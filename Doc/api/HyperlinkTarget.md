# HyperlinkTarget

**Source:** https://developers.figma.com/docs/plugins/api/HyperlinkTarget/

---

```
type HyperlinkTarget = {  
    type: "URL" | "NODE"  
    value: string  
}
```

An object representing hyperlink target. The possible values for `type` are:

- `"URL"`: value is a hyperlink URL. If the URL points to a valid node in the current document, the `HyperlinkTarget` is automatically converted to type `"NODE"`.
- `"NODE"`: value is the `id` of a node in the current document. Note that the node cannot be a sublayer of an instance.