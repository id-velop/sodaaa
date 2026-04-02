# ArcData

**Source:** https://developers.figma.com/docs/plugins/api/ArcData/

---

```
interface ArcData {  
  readonly startingAngle: number  
  readonly endingAngle: number  
  readonly innerRadius: number  
}
```

This data controls the "arc" properties of the circle shape:

![](https://static.figma.com/uploads/abd31088233f035d829a22d99a4e481263f5db68)

The angles are in radians and the inner radius value is from 0 to 1. For the angles, 0° is the x axis and increasing angles rotate clockwise.

Examples:

```
// Make a half-circle  
node.arcData = {startingAngle: 0, endingAngle: Math.PI, innerRadius: 0}
```

```
// Make a donut  
node.arcData = {startingAngle: 0, endingAngle: 2 * Math.PI, innerRadius: 0.5}
```