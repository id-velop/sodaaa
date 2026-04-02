# createStar

**Source:** https://developers.figma.com/docs/plugins/api/properties/figma-createstar/

---

On this page

Creates a new star.

## Signature[​](#signature "Direct link to Signature")

### [createStar](/docs/plugins/api/properties/figma-createstar/)(): [StarNode](/docs/plugins/api/StarNode/)

## Remarks[​](#remarks "Direct link to Remarks")

By default, the new node has five points edges (i.e. a canonical star), a default fill, width and height both at 100, and is parented under `figma.currentPage`.

Create a red, 7-pointed star

```
const star = figma.createStar()  
  
// Move to (50, 50)  
star.x = 50  
star.y = 50  
  
// Set size to 200 x 200  
star.resize(200, 200)  
  
// Make the star 7-pointed  
star.pointCount = 7  
  
// Set solid red fill  
star.fills = [{ type: 'SOLID', color: { r: 1, g: 0, b: 0 } }]  
  
// Make the angles of each point less acute  
star.innerRadius = 0.6
```

- [Signature](#signature)
- [Remarks](#remarks)