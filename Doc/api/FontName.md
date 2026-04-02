# FontName

**Source:** https://developers.figma.com/docs/plugins/api/FontName/

---

```
interface Font {  
  fontName: FontName  
}  
  
interface FontName {  
  readonly family: string  
  readonly style: string  
}
```

Describes a font used by a text node. For example, the default font is `{ family: "Inter", style: "Regular" }`.