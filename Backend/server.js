// 加载环境变量配置
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const https = require('https');
const app = express();

// 创建一个忽略 SSL 证书验证的 HTTPS 代理（用于处理自签名证书）
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));  // 增大请求体限制，支持大型设计稿结构

// Smart API 配置 - 敏感信息存储在后端
// 强烈建议将敏感信息放在环境变量中，而非硬编码
const SMART_CONFIG = {
  // workflow_orchestrator 端点（统一端点，支持文本和文件）
  apiUrl: process.env.SMART_API_URL || 'https://smart.shopee.io/apis/smart/v1/workflow_orchestrator/deployments/invoke',
  deploymentHashId: process.env.SMART_DEPLOYMENT_HASH_ID || '399dhx5cijd2joyiwmzjucbs',
  deploymentKey: process.env.SMART_DEPLOYMENT_KEY || 'l2abqwbjdj7w92ryxjbw2wei',
  timeout: parseInt(process.env.API_TIMEOUT) || 120000  // 增加到 2 分钟
};

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Figma Plugin Backend Service is running',
    timestamp: new Date().toISOString()
  });
});

// 文件上传中间件配置
const multer = require('multer');
const FormData = require('form-data');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB 限制
  }
});

// 代理Smart API请求（支持带文件和Confluence链接）
app.post('/api/smart/generate', upload.array('files', 10), async (req, res) => {
  try {
    const query = req.body.query || '';
    const uploadedFiles = req.files || [];
    const confluenceUrl = req.body.confluence_url || '';
    const functionTarget = parseInt(req.body.function_target) || 0; // 功能目标：0=智能思考, 1=页面生成, 2=组件查询, 3=设计咨询
    const cacheContent = req.body.cache_content || ''; // 缓存内容（structured_output）
    
    // 需要至少有文本、文件或Confluence链接
    if (!query && uploadedFiles.length === 0 && !confluenceUrl) {
      return res.status(400).json({
        error: 'Missing query, files or confluence_url',
        message: '请提供界面描述、上传文件或添加Confluence链接'
      });
    }

    console.log('Received request:', { 
      query, 
      filesCount: uploadedFiles.length, 
      confluenceUrl: confluenceUrl ? '有' : '无', 
      functionTarget,
      hasCache: !!cacheContent
    });

    // 验证配置是否正确
    if (!SMART_CONFIG.deploymentHashId || !SMART_CONFIG.deploymentKey) {
      return res.status(500).json({
        success: false,
        error: 'Smart API配置未正确配置，请检查环境变量'
      });
    }

    let response;

    // 构建 start_user_variables（统一使用 JSON 格式）
    const startUserVariables = {
      user_requirement_description: query || '请分析上传的文件',
      user_function_target: functionTarget
    };
    
    // 如果有 Confluence 链接，添加到变量中
    if (confluenceUrl) {
      startUserVariables.user_confluence_link = confluenceUrl;
      console.log('Adding Confluence URL:', confluenceUrl);
    }
    
    // 如果有缓存内容，添加到变量中
    if (cacheContent) {
      try {
        // 尝试解析缓存内容（应该是 JSON 字符串）
        const parsedCache = typeof cacheContent === 'string' ? JSON.parse(cacheContent) : cacheContent;
        startUserVariables.cache_content = parsedCache;
        console.log('Adding cache content to request');
      } catch (e) {
        // 如果解析失败，直接作为字符串传递
        startUserVariables.cache_content = cacheContent;
        console.log('Cache content parse failed, passing as string');
      }
    }
    
    // 如果有文件，将文件转换为 base64 并添加到 user_files
    if (uploadedFiles.length > 0) {
      console.log('Processing', uploadedFiles.length, 'files for upload');
      
      // SMART API 期望 user_files 是单个 WorkflowFile 对象，不是数组
      // 只处理第一个文件
      const file = uploadedFiles[0];
      const base64Data = file.buffer.toString('base64');
      console.log('File:', file.originalname, file.mimetype, file.size, 'bytes');
      
      // 添加文件到 start_user_variables（单个对象格式）
      startUserVariables.user_files = {
        filename: file.originalname,
        content_type: file.mimetype,
        data: base64Data
      };
      
      if (uploadedFiles.length > 1) {
        console.log('Warning: Only first file will be uploaded, SMART API only supports single file');
      }
    }
    
    const requestData = {
      endpoint_deployment_hash_id: SMART_CONFIG.deploymentHashId,
      endpoint_deployment_key: SMART_CONFIG.deploymentKey,
      start_user_variables: startUserVariables
    };

    console.log('Calling Smart API (JSON):', SMART_CONFIG.apiUrl);
    console.log('Request variables (files count):', uploadedFiles.length);

    response = await axios({
      method: 'POST',
      url: SMART_CONFIG.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Figma-Plugin-Backend/1.0'
      },
      data: requestData,
      timeout: SMART_CONFIG.timeout,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      httpsAgent: httpsAgent, // 忽略自签名证书
      validateStatus: function (status) {
        return true;
      }
    });

    console.log('Smart API Response Status:', response.status);
    console.log('Smart API Response Data:', JSON.stringify(response.data, null, 2));

    // 处理不同的HTTP状态码
    if (response.status === 200) {
      // 成功响应 - 转换Smart API响应格式为前端期望的格式
      const smartData = response.data;
      
      // 提取response内容 - 支持多种响应格式
      let responseStr = '';
      let outputData = null;
      
      // 首先尝试从标准路径提取 Output
      if (smartData?.data?.output?.Output) {
        // workflow_orchestrator 返回 { data: { output: { Output: "..." } } } 格式
        outputData = smartData.data.output.Output;
      } else if (smartData?.output) {
        // Smart API 返回 { success: true, output: { figma_use_consultation_output: "..." } } 格式
        outputData = smartData.output;
      } else if (smartData?.Output) {
        outputData = smartData.Output;
      } else if (smartData?.data?.response?.response_str) {
        outputData = smartData.data.response.response_str;
      } else if (smartData?.data?.outputs) {
        outputData = smartData.data.outputs;
      } else if (smartData?.data?.Output) {
        outputData = smartData.data.Output;
      } else if (smartData?.data?.output) {
        outputData = smartData.data.output;
      } else if (smartData?.data?.result) {
        outputData = smartData.data.result;
      } else if (smartData?.data) {
        outputData = smartData.data;
      } else {
        outputData = smartData;
      }
      
      // 支持的特殊返回字段（需要 JSON 序列化传递给前端）
      const specialFields = [
        'figma_use_consultation_output',    // 设计咨询
        'best_pratices_consultation_output', // 最佳实践咨询
        'foundation_consultation_output',    // 基础规范咨询
        'component_output',                  // 组件查询
        'icon_output',                       // 图标查询
        'generate_output'                    // 页面生成配置
      ];
      
      // 检查对象是否包含特殊字段
      const hasSpecialField = (obj) => {
        if (!obj || typeof obj !== 'object') return false;
        return specialFields.some(field => obj[field] !== undefined);
      };
      
      // 解析输出内容
      if (typeof outputData === 'string') {
        // 尝试解析 JSON 字符串
        try {
          const parsed = JSON.parse(outputData);
          // 检查是否为特殊格式（咨询、组件查询、页面生成等）
          if (hasSpecialField(parsed)) {
            responseStr = JSON.stringify(parsed);
          } else {
            responseStr = outputData;
          }
        } catch (e) {
          // 不是 JSON，保持原样（可能是 CONFIG 代码）
          responseStr = outputData;
        }
      } else if (typeof outputData === 'object' && outputData !== null) {
        // 如果是对象，统一序列化为 JSON 字符串
        responseStr = JSON.stringify(outputData);
      }
      
      console.log('Extracted response:', responseStr ? responseStr.substring(0, 200) + '...' : 'empty');
      
      // 转换为前端期望的格式
      const transformedData = {
        answer: responseStr,
        // 保留原始数据以备调试
        _original: process.env.NODE_ENV === 'development' ? smartData : undefined
      };
      
      res.json({
        success: true,
        data: transformedData
      });
    } else {
      // 处理各种错误状态
      let errorMessage = '生成配置失败';
      let errorCode = response.data?.code || 'unknown_error';
      
      switch (response.status) {
        case 400:
          errorMessage = response.data?.message || '请求参数错误';
          break;
        case 401:
          errorMessage = 'API认证失败或已过期';
          break;
        case 403:
          errorMessage = '访问被拒绝，请检查API权限';
          break;
        case 404:
          errorMessage = 'API端点不存在';
          break;
        case 500:
          errorMessage = '服务器内部异常';
          break;
        default:
          errorMessage = response.data?.message || `HTTP错误 ${response.status}`;
      }

      res.status(response.status).json({
        success: false,
        error: errorMessage,
        code: errorCode,
        details: process.env.NODE_ENV === 'development' ? response.data : undefined
      });
    }

  } catch (error) {
    console.error('Network/Connection Error:', error.message);
    
    let errorMessage = '网络连接失败';
    let statusCode = 500;

    if (error.code === 'ECONNREFUSED') {
      errorMessage = '无法连接到Smart服务器，请检查服务器地址和端口';
      statusCode = 503;
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = '请求超时，请稍后重试';
      statusCode = 408;
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = '无法解析Smart服务器地址';
      statusCode = 503;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      code: error.code || 'network_error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 兼容旧的 dify 路由（直接复用 smart 路由逻辑）
// 注意：前端已更新为使用 /api/smart/generate，此路由仅作兼容保留

// 获取配置信息接口（不包含敏感信息）
app.get('/api/config', (req, res) => {
  res.json({
    apiUrl: SMART_CONFIG.apiUrl.replace(/\/invoke$/, ''), // 隐藏具体端点
    timeout: SMART_CONFIG.timeout,
    environment: process.env.NODE_ENV || 'development'
  });
});

// 测试Smart连接接口
app.get('/api/test-connection', async (req, res) => {
  try {
    console.log('Testing connection to Smart API...');
    
    // 发送一个简单的测试请求
    const response = await axios({
      method: 'POST',
      url: SMART_CONFIG.apiUrl,
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        endpoint_deployment_hash_id: SMART_CONFIG.deploymentHashId,
        endpoint_deployment_key: SMART_CONFIG.deploymentKey,
        start_user_variables: {
          user_requirement_description: "测试连接",
          user_function_target: 0
        }
      },
      timeout: 10000, // 10秒超时
      httpsAgent: httpsAgent, // 忽略自签名证书
      validateStatus: function (status) {
        return true; // 允许所有状态码
      }
    });

    res.json({
      success: true,
      status: response.status,
      message: response.status === 200 ? 'Smart API连接正常' : `Smart API返回状态码: ${response.status}`,
      data: {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers['content-type']
      }
    });

  } catch (error) {
    console.error('Connection test failed:', error.message);
    
    res.json({
      success: false,
      error: error.message,
      code: error.code,
      message: '无法连接到Smart API服务器'
    });
  }
});

// 文件上传已整合到 /api/smart/generate 路由中
// 有文件时使用 multipart/form-data 格式，无文件时使用 JSON 格式

// ==================== 设计稿编辑 API ====================
// 独立于生成功能，用于已生成设计稿的智能编辑

// 编辑功能配置（可以使用不同的 deployment）
const EDIT_CONFIG = {
  apiUrl: process.env.SMART_EDIT_API_URL || SMART_CONFIG.apiUrl,
  deploymentHashId: process.env.SMART_EDIT_DEPLOYMENT_HASH_ID || SMART_CONFIG.deploymentHashId,
  deploymentKey: process.env.SMART_EDIT_DEPLOYMENT_KEY || SMART_CONFIG.deploymentKey,
  timeout: parseInt(process.env.SMART_EDIT_TIMEOUT) || 300000  // 编辑需要较长时间，5分钟超时
};

/**
 * 设计稿编辑代理接口
 * 
 * 接收：
 * - designStructure: 设计稿结构 JSON
 * - prdContent: PRD 内容（可选）
 * - editIntent: 编辑意图描述
 * 
 * 返回：
 * - editActions: 编辑指令数组
 */
app.post('/api/smart/edit', async (req, res) => {
  try {
    const { designStructure, prdContent, editIntent } = req.body;
    
    // 验证必要参数
    if (!designStructure) {
      return res.status(400).json({
        success: false,
        error: '缺少 designStructure 参数',
        message: '请提供设计稿结构'
      });
    }
    
    if (!editIntent) {
      return res.status(400).json({
        success: false,
        error: '缺少 editIntent 参数',
        message: '请描述编辑意图'
      });
    }
    
    console.log('Received edit request:', {
      structureNodes: designStructure.nodes ? designStructure.nodes.length : 0,
      hasPrd: !!prdContent,
      editIntent: editIntent.substring(0, 100) + '...'
    });
    
    // 构建请求数据
    // 将设计稿结构和编辑意图组合成 user_requirement_description
    // 格式：[Edit] + 编辑意图 + 设计稿结构 JSON
    const combinedDescription = `[Edit]
## 编辑意图
${editIntent}

## PRD 内容
${prdContent || '无'}

## 当前设计稿结构
\`\`\`json
${JSON.stringify(designStructure, null, 2)}
\`\`\`

## 编辑规则
1. 为需要显示的元素填充合适的文案（setVariant/setText/setNestedText）
2. **重要**：对于列表类组件（如 Sidebar 菜单、Tab 标签等），如果某些项目不需要显示，使用 setVisibility 指令将其隐藏
3. **表格组件全量填充**：
   - 为表格的所有 columnHeaders（列头）填充业务相关的列名
   - 为表格的 editableCells 中的每个文本单元格填充示例数据
   - 为表格的 editableInstances 中的组件属性填充合适的值
   - 使用 setText 指令修改 editableCells（直接用 id）
   - 使用 setVariant 指令修改 editableInstances（用 id + textProperties 中的属性名）
4. **重要 - nodeId 使用规则**：
   - 必须**原样复制**设计稿结构中提供的 id，不要做任何修改
   - 不要尝试替换 ID 的任何部分（如前缀）
   - 嵌套实例的 ID 格式如 "I1384:63041;9117:21350" 是完整的，直接使用
5. **尽可能全面**：生成足够多的编辑指令覆盖所有可编辑元素

请根据编辑意图和 PRD 内容，分析当前设计稿结构，生成编辑指令 JSON。
注意：nodeId 必须与设计稿结构中的 id 完全一致，不要做任何修改或替换！`;

    const requestData = {
      endpoint_deployment_hash_id: EDIT_CONFIG.deploymentHashId,
      endpoint_deployment_key: EDIT_CONFIG.deploymentKey,
      start_user_variables: {
        // 使用标准的 user_requirement_description 传递所有内容
        user_requirement_description: combinedDescription,
        // 功能目标：4 = 设计稿编辑模式
        user_function_target: 4
      }
    };
    
    console.log('Calling Smart Edit API:', EDIT_CONFIG.apiUrl);
    
    const response = await axios({
      method: 'POST',
      url: EDIT_CONFIG.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Figma-Plugin-Backend/1.0'
      },
      data: requestData,
      timeout: EDIT_CONFIG.timeout,
      httpsAgent: httpsAgent,
      validateStatus: function(status) {
        return true;
      }
    });
    
    console.log('Smart Edit API Response Status:', response.status);
    console.log('Smart Edit API Raw Response:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200) {
      // 解析响应
      const smartData = response.data;
      let editActions = null;
      let rawOutput = null;
      
      // 尝试从不同路径提取编辑指令
      // Smart API 可能返回 { data: { output: { Output: "..." } } } 或 { output: "..." } 格式
      if (smartData?.data?.output?.Output) {
        rawOutput = smartData.data.output.Output;
        console.log('Found output at data.output.Output');
      } else if (smartData?.data?.output?.output) {
        // 处理 { data: { output: { output: "..." } } } 格式
        rawOutput = smartData.data.output.output;
        console.log('Found output at data.output.output');
      } else if (smartData?.data?.output) {
        rawOutput = smartData.data.output;
        console.log('Found output at data.output');
      } else if (smartData?.output) {
        rawOutput = smartData.output;
        console.log('Found output at output');
      } else {
        rawOutput = smartData;
        console.log('Using raw smartData as output');
      }
      
      // 如果 rawOutput 是对象且有 output 字段，再提取一层
      if (rawOutput && typeof rawOutput === 'object' && rawOutput.output) {
        rawOutput = rawOutput.output;
        console.log('Extracted nested output field');
      }
      
      // 尝试解析为 JSON
      if (typeof rawOutput === 'string') {
        // 移除 markdown 代码块标记（如 ```json ... ```）
        let cleanedOutput = rawOutput.trim();
        
        // 检查是否被 markdown 代码块包裹
        const codeBlockMatch = cleanedOutput.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/);
        if (codeBlockMatch) {
          cleanedOutput = codeBlockMatch[1].trim();
          console.log('Removed markdown code block wrapper');
        }
        
        // 也处理可能的多余换行和空格
        cleanedOutput = cleanedOutput.replace(/^\s+|\s+$/g, '');
        
        try {
          editActions = JSON.parse(cleanedOutput);
          console.log('Parsed string output as JSON');
        } catch (e) {
          console.log('Failed to parse as JSON:', e.message);
          console.log('Cleaned output preview:', cleanedOutput.substring(0, 200));
          editActions = rawOutput;
        }
      } else {
        editActions = rawOutput;
      }
      
      // 检查是否有 edit_actions 字段
      if (editActions?.edit_actions) {
        editActions = editActions.edit_actions;
        console.log('Extracted edit_actions field');
      }
      
      console.log('Final editActions:', JSON.stringify(editActions, null, 2));
      
      // 验证编辑指令格式 - 检查是否有 actions 数组
      if (editActions && typeof editActions === 'object') {
        // 确保有 actions 数组
        if (!editActions.actions && Array.isArray(editActions)) {
          // 如果 editActions 本身是数组，包装它
          editActions = { actions: editActions };
          console.log('Wrapped array as actions');
        }
        
        if (editActions.actions && Array.isArray(editActions.actions)) {
          res.json({
            success: true,
            data: {
              editActions: editActions,
              _original: process.env.NODE_ENV === 'development' ? smartData : undefined
            }
          });
        } else {
          // actions 不存在或不是数组
          console.log('editActions.actions is missing or not an array');
          res.json({
            success: false,
            error: 'Agent 返回的数据格式不正确，缺少 actions 数组',
            rawOutput: JSON.stringify(editActions).substring(0, 500),
            hint: 'Agent 需要返回 { "actions": [...] } 格式的编辑指令'
          });
        }
      } else {
        res.json({
          success: false,
          error: '未能解析编辑指令',
          rawOutput: process.env.NODE_ENV === 'development' ? smartData : undefined
        });
      }
    } else {
      // 处理错误
      let errorMessage = '编辑请求失败';
      
      switch (response.status) {
        case 400:
          errorMessage = response.data?.message || '请求参数错误';
          break;
        case 401:
          errorMessage = 'API 认证失败';
          break;
        case 403:
          errorMessage = '访问被拒绝';
          break;
        case 500:
          errorMessage = '服务器内部错误';
          break;
        default:
          errorMessage = `HTTP 错误 ${response.status}`;
      }
      
      res.status(response.status).json({
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? response.data : undefined
      });
    }
    
  } catch (error) {
    console.error('Edit API Error:', error.message);
    
    let errorMessage = '网络连接失败';
    let statusCode = 500;
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage = '无法连接到 Smart 服务器';
      statusCode = 503;
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = '请求超时，编辑操作可能过于复杂';
      statusCode = 408;
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      code: error.code || 'network_error'
    });
  }
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: '服务器内部错误'
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Figma Plugin Backend Server is running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔑 Smart API URL: ${SMART_CONFIG.apiUrl}`);
  console.log(`🔐 Deployment Hash ID: ${SMART_CONFIG.deploymentHashId ? '✅ Yes' : '❌ No'}`);
  console.log(`🔐 Deployment Key: ${SMART_CONFIG.deploymentKey ? '✅ Yes' : '❌ No'}`);
  
  // 安全提醒
  if (process.env.NODE_ENV !== 'production') {
    console.log(`⚠️  开发环境运行中 - 请确保生产环境中使用环境变量配置敏感信息`);
  }
  
  // 验证配置完整性
  if (!SMART_CONFIG.deploymentHashId || !SMART_CONFIG.deploymentKey) {
    console.log(`⚠️  Smart API配置不完整，请检查环境变量`);
  }
});

module.exports = app;
