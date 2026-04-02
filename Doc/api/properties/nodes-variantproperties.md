# variantProperties

**Source:** https://developers.figma.com/docs/plugins/api/properties/nodes-variantproperties/

---

On this page

**DEPRECATED:** Use [`componentProperties`](/docs/plugins/api/InstanceNode/#componentproperties) instead.

Variant properties and values for this node. Is `null` for nodes that are not variants.

Supported on:

- [ComponentNode](/docs/plugins/api/ComponentNode/)
- [InstanceNode](/docs/plugins/api/InstanceNode/)

## Signature[​](#signature "Direct link to Signature")

### [variantProperties](/docs/plugins/api/properties/nodes-variantproperties/): { [property: string]: string } | null [readonly]

## Remarks[​](#remarks "Direct link to Remarks")

[Variant properties](https://help.figma.com/hc/en-us/articles/5579474826519#h_01G2Q5GF4407ZTN7K8FHM2JREZ) define attributes of variants in a component set. For example, a component set for a button might have variant properties such as `size` and `state`, with different possible values for each property (e.g. `default`, `hover`, `pressed`, and `disabled` for the `state` property).

Variant-related properties and methods for component sets, components, and instances

```
componentSet.variantGroupProperties  
  
// Output  
{  
  Size: {  
    values: ['Small', 'Medium', 'Large']  
  },  
  State: {  
    values: ['Default', 'Hover', 'Pressed', 'Disabled']  
  }  
}  
  
// One of the variants / component nodes in the component set  
componentSet.children[1].variantProperties  
  
// Output  
{ Size: 'Small', State: 'Hover' }  
  
// variantProperties also works on an instances of variants  
instance.variantProperties  
  
// Output  
{ Size: 'Medium', State: 'Default' }  
  
// Use setProperties on an instance of a variant to configure it  
instance.setProperties({ Size: 'Large' })  
instance.variantProperties  
  
// Output  
{ Size: 'Large', State: 'Default' }
```

- [Signature](#signature)
- [Remarks](#remarks)