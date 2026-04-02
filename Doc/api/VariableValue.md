# VariableValue

**Source:** https://developers.figma.com/docs/plugins/api/VariableValue/

---

On this page

```
type VariableValue =  
  string |  
  number |  
  boolean |  
  RGB |  
  RGBA |  
  VariableAlias
```

## Variable Alias[​](#variable-alias "Direct link to Variable Alias")

Created via `figma.variables.createVariableBinding()`. Used to alias variables to other variables. Each `VariableValue` has at least one corresponding [`VariableResolvedDataType`](/docs/plugins/api/VariableResolvedDataType/).

- [Variable Alias](#variable-alias)