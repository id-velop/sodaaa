# normalizeMarkdown

**Source:** https://developers.figma.com/docs/plugins/api/properties/figma-util-normalizemarkdown/

---

On this page

Normalizes the markdown string to verify what markdown will render with Figma's rich-text editors.

Examples:

```
const md = "# Hello, world!\n\nThis is a **bold** text."  
const normalizedMd = figma.util.normalizeMarkdown(md);  
  
// Set an component description with descriptionMarkdown  
component.descriptionMarkdown = normalizedMd;
```

## Signature[​](#signature "Direct link to Signature")

### normalizeMarkdown(markdown: string): string

## Parameters[​](#parameters "Direct link to Parameters")

### markdown[​](#markdown "Direct link to markdown")

A markdown string to normalize.

- [Signature](#signature)
- [Parameters](#parameters)
  - [markdown](#markdown)