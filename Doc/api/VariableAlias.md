# VariableAlias

**Source:** https://developers.figma.com/docs/plugins/api/VariableAlias/

---

```
interface VariableAlias {  
  type: 'VARIABLE_ALIAS'  
  id: string  
}
```

A structure used to describe when a particular node or variable is directly bound to a variable. The `id` of the bound variable can be used in conjunction with functions that accept a VariableId, such as `figma.variables.getVariableById`.