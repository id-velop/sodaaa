# TextCase

**Source:** https://developers.figma.com/docs/plugins/api/TextCase/

---

```
type TextCase = "ORIGINAL" | "UPPER" | "LOWER" | "TITLE" | "SMALL_CAPS" | "SMALL_CAPS_FORCED"
```

The possible values are:

- `"ORIGINAL"`: show the text as defined, no overrides.
- `"UPPER"`: all characters are in upper case.
- `"LOWER"`: all characters are in lower case.
- `"TITLE"`: the first character of each word is upper case and all other characters are in lower case.
- `"SMALL_CAPS"`: all characters are in small upper case.
- `"SMALL_CAPS_FORCED"`: the first character of each word is upper case and all other characters are in small upper case.