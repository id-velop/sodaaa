# createConnector

**Source:** https://developers.figma.com/docs/plugins/api/properties/figma-createconnector/

---

On this page

info

This API is only available in FigJam

Creates a new connector. The behavior is similar to using the `Shift-C` shortcut followed by a click.

## Signature[​](#signature "Direct link to Signature")

### [createConnector](/docs/plugins/api/properties/figma-createconnector/)(): [ConnectorNode](/docs/plugins/api/ConnectorNode/)

## Remarks[​](#remarks "Direct link to Remarks")

By default, the new node has a width of 200, and is parented under `figma.currentPage`.

Add a connector between two stickies

```
// Create two stickies  
const stickyLeft = figma.createSticky()  
stickyLeft.x = -200  
  
const stickyRight = figma.createSticky()  
stickyRight.x = 200  
  
// Connect the two stickies  
const connector = figma.createConnector()  
connector.connectorStart = {  
  endpointNodeId: stickyLeft.id,  
  magnet: 'AUTO'  
}  
  
connector.connectorEnd = {  
  endpointNodeId: stickyRight.id,  
  magnet: 'AUTO'  
}
```

- [Signature](#signature)
- [Remarks](#remarks)