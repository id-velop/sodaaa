# HandleMirroring

**Source:** https://developers.figma.com/docs/plugins/api/HandleMirroring/

---

```
type HandleMirroring = "NONE" | "ANGLE" | "ANGLE_AND_LENGTH"
```

The possible values are:

- `"NONE"`: the two vector handles are independent from each other
- `"ANGLE"`: the two vector handles form a single tangent line, but the length of each handle is independent
- `"ANGLE_AND_LENGTH"`: the two vector handles form a single tangent line, equidistant on both sides of the vertex