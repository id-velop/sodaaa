import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { fetchConfluencePage, ConfluenceError } from '../services/confluence-reader.js';
import { updatePrdImages, getExistingImages } from '../services/confluence-writer.js';
import { detectIntent } from '../services/intent-detector.js';
import { startTrace, endTrace, startSpan, endSpan } from '../services/trace-collector.js';
import { createChildLogger } from '../utils/logger.js';
import { nanoid } from 'nanoid';

const log = createChildLogger({ module: 'route-confluence' });

const previewRequestSchema = z.object({
  url: z.string().min(1, { message: 'url is required' }),
  pat: z.string().min(1, { message: 'pat is required' }),
  userRequirement: z.string().optional(),
  sessionId: z.string().optional(),
});

const updatePrdRequestSchema = z.object({
  url: z.string().min(1, { message: 'url is required' }),
  pat: z.string().min(1, { message: 'pat is required' }),
  screenshots: z.array(z.object({
    name: z.string(),
    base64: z.string(),
    figmaLink: z.string(),
  })).min(1, { message: 'at least one screenshot is required' }),
});

const existingImagesRequestSchema = z.object({
  url: z.string().min(1, { message: 'url is required' }),
  pat: z.string().min(1, { message: 'pat is required' }),
});

export async function confluenceRoutes(app: FastifyInstance) {
  app.post('/api/confluence/preview', async (request, reply) => {
    const parsed = previewRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid request',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { url, pat, userRequirement, sessionId } = parsed.data;
    const userInfo = (request as any).userInfo;
    const traceId = nanoid(12);

    startTrace(
      traceId,
      traceId,
      'confluence-preview',
      userRequirement || url,
      {},
      sessionId,
      userInfo,
    );

    try {
      // Span 1: Fetch Confluence page
      const fetchSpanId = startSpan(traceId, 'confluence-fetch', 'route', {
        input: { url },
      });

      let page;
      try {
        page = await fetchConfluencePage(url, pat);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        endSpan(traceId, fetchSpanId, 'failed', { error: errMsg });
        throw err;
      }

      endSpan(traceId, fetchSpanId, 'completed', {
        output: {
          title: page.title,
          contentLength: page.content.length,
          truncated: page.truncated,
        },
      });

      // Span 2: Intent detection
      let intent: string = 'generate';
      if (userRequirement && userRequirement.trim()) {
        const intentSpanId = startSpan(traceId, 'intent-detect', 'llm', {
          input: { userRequirement: userRequirement.slice(0, 200) },
        });

        try {
          intent = await detectIntent(userRequirement, traceId);
        } catch (err) {
          log.warn({ error: String(err) }, 'Intent detection failed for confluence preview, defaulting to generate');
          intent = 'generate';
        }

        endSpan(traceId, intentSpanId, 'completed', {
          output: { intent },
        });
      }

      endTrace(traceId, 'completed');

      return reply.send({
        success: true,
        data: {
          title: page.title,
          content: page.content,
          intent,
          truncated: page.truncated,
        },
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const errCode = err instanceof ConfluenceError ? err.code : 'UNKNOWN';

      endTrace(traceId, 'failed', errMsg);

      log.error({ url, errorCode: errCode }, 'Confluence preview failed');

      const statusMap: Record<string, number> = {
        INVALID_URL: 400,
        AUTH: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        TIMEOUT: 504,
        NETWORK: 502,
      };

      const statusCode = statusMap[errCode] || 500;

      return reply.status(statusCode).send({
        success: false,
        error: errMsg,
        errorCode: errCode,
      });
    }
  });

  // ─── Get Existing Images Route ───
  app.post('/api/confluence/existing-images', async (request, reply) => {
    const parsed = existingImagesRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid request',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { url, pat } = parsed.data;

    try {
      const result = await getExistingImages(url, pat);
      return reply.send(result);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const errCode = err instanceof ConfluenceError ? err.code : 'UNKNOWN';

      log.error({ url, errorCode: errCode }, 'Get existing images failed');

      const statusMap: Record<string, number> = {
        INVALID_URL: 400,
        AUTH: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        TIMEOUT: 504,
        NETWORK: 502,
      };

      const statusCode = statusMap[errCode] || 500;

      return reply.status(statusCode).send({
        success: false,
        error: errMsg,
        errorCode: errCode,
      });
    }
  });

  // ─── Update PRD Route ───
  app.post('/api/confluence/update-prd', async (request, reply) => {
    const parsed = updatePrdRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid request',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { url, pat, screenshots } = parsed.data;
    const userInfo = (request as any).userInfo;
    const traceId = nanoid(12);

    startTrace(
      traceId,
      traceId,
      'confluence-update-prd',
      `Update PRD with ${screenshots.length} screenshots`,
      { screenshotCount: screenshots.length },
      undefined,
      userInfo,
    );

    try {
      const spanId = startSpan(traceId, 'update-prd-images', 'route', {
        input: { url, screenshotCount: screenshots.length },
      });

      const result = await updatePrdImages(url, pat, screenshots);

      if (result.success) {
        endSpan(traceId, spanId, 'completed', {
          output: { updatedCount: result.updatedCount },
        });
        endTrace(traceId, 'completed');

        return reply.send({
          success: true,
          updatedCount: result.updatedCount,
          pageUrl: result.pageUrl,
        });
      } else {
        endSpan(traceId, spanId, 'failed', {
          error: result.error,
        });
        endTrace(traceId, 'failed', result.error);

        return reply.status(500).send({
          success: false,
          error: result.error,
        });
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const errCode = err instanceof ConfluenceError ? err.code : 'UNKNOWN';

      endTrace(traceId, 'failed', errMsg);

      log.error({ url, errorCode: errCode }, 'Update PRD failed');

      const statusMap: Record<string, number> = {
        INVALID_URL: 400,
        AUTH: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        TIMEOUT: 504,
        NETWORK: 502,
      };

      const statusCode = statusMap[errCode] || 500;

      return reply.status(statusCode).send({
        success: false,
        error: errMsg,
        errorCode: errCode,
      });
    }
  });
}
