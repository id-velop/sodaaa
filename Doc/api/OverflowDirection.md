# OverflowDirection

**Source:** https://developers.figma.com/docs/plugins/api/OverflowDirection/

---

```
type OverflowDirection = "NONE" | "HORIZONTAL" | "VERTICAL" | "BOTH"
```

The possible values are:

- `"NONE"`: the frame does not *explicitly* scroll
- `"HORIZONTAL"`: the frame can scroll in the horizontal direction if its content exceeds the frame's bounds horizontally
- `"VERTICAL"`: the frame can in the vertical direction if its content exceeds the frame's bounds vertically
- `"BOTH"`: the frame can scroll in either direction if the content exceeds the frame's bounds

Note that top-level frames (parented directly under the canvas) can still scroll even when `OverflowDirection` is `NONE`.