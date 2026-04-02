# VariableBindableEffectField

**Source:** https://developers.figma.com/docs/plugins/api/VariableBindableEffectField/

---

```
type VariableBindableShadowEffectField =  
  'radius' |  
  'color' |  
  'spread' |  
  'offsetX' |  
  'offsetY'  
  
type VariableBindableBlurEffectField = 'radius'  
  
type VariableBindableEffectField =  
  VariableBindableShadowEffectField  
  | VariableBindableBlurEffectField
```

A list of node fields that can be bound to a [`Effect`](/docs/plugins/api/Effect/) by type.