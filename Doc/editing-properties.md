# Editing Properties

**Source:** https://developers.figma.com/docs/plugins/editing-properties/

---

On this page

In many cases, editing a node property is as straightforward as changing a property on a regular node object. For example, this is how you could move a node 10 pixels to the right:

Simple change

```
node.x += 10 // easy!
```

However, for more complex properties that are stored as arrays and objects, you will notice that we marked all the properties in those objects as `readonly`. That means that the following, which you may naturally be inclined to try, won't work:

Readonly properties

```
// error: object is not extensible  
figma.currentPage.selection.push(otherNode)  
// error: Cannot assign to read only property 'r' of object  
node.fills[0].color.r = 10
```

info

In Figma design's Dev Mode, plugins can only edit certain node metadata, such as [pluginData](/docs/plugins/api/properties/nodes-setplugindata/), [relaunchData](/docs/plugins/api/properties/nodes-setrelaunchdata/), and [`exportAsync()`](/docs/plugins/api/properties/nodes-exportasync/).

Learn more in the [Working in Dev Mode →](/docs/plugins/working-in-dev-mode/) guide.

## The 'How'[​](#the-how "Direct link to The 'How'")

For all node properties, making a change to a property requires setting the entire property. Often, this will mean making a copy of the original property, which can then be modified.

For arrays of nodes like `selection` where you want to make a copy of the array, but not the nodes themselves, an easy way to make a copy of the array is to use [`array.slice()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice). Other array methods that return a new array include [`array.concat()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/concat) and [`array.map()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map). Keep in mind that most array methods such as `array.push()` do not create a new array, though they may be used on a copy of the array.

Example:

Changing selection

```
// Example 1: Adding a new element to the selection via `concat`  
figma.currentPage.selection = figma.currentPage.selection.concat(someNode)  
  
// Example 2: Adding a new element to the selection via `slice`  
const selection = figma.currentPage.selection.slice()  
selection.push(someNode)  
figma.currentPage.selection = selection  
  
// Creating a new selection. This is more efficient  
// than editing `page.selection` repeatedly.  
const newSelection = []  
newSelection.push(...)  
newSelection.push(...)  
newSelection.push(...)  
newSelection.push(...)  
figma.currentPage.selection = newSelection  
  
// Remove element in selection at index i  
const selection = figma.currentPage.selection.slice()  
selection.splice(i, 1)  
figma.currentPage.selection = selection
```

For objects such as fills/paints, you'll want to do something similar, which is to clone the object.

Change fills

```
// Example: Changing the red channel of the first fill  
const fills = clone(rect.fills)  
fills[0].color.r = 0.5  
rect.fills = fills
```

info

For more detail on changing color properties, see the [Changing Colors](#changing-colors) section below.

There's many ways to implement such a clone function. A simple though inefficient one-liner would be:

Simple clone function

```
function clone(val) {  
  return JSON.parse(JSON.stringify(val))  
}
```

A perhaps more principled way of cloning would look like:

Better clone function

```
function clone(val) {  
  const type = typeof val  
  if (val === null) {  
    return null  
  } else if (type === 'undefined' || type === 'number' ||  
             type === 'string' || type === 'boolean') {  
    return val  
  } else if (type === 'object') {  
    if (val instanceof Array) {  
      return val.map(x => clone(x))  
    } else if (val instanceof Uint8Array) {  
      return new Uint8Array(val)  
    } else {  
      let o = {}  
      for (const key in val) {  
        o[key] = clone(val[key])  
      }  
      return o  
    }  
  }  
  throw 'unknown'  
}
```

### Changing colors[​](#changing-colors "Direct link to Changing colors")

A common use case is to modify a node fill with a solid color. Color objects in the Plugin API use separate numeric properties for each color channel, but you can use [`figma.util.solidPaint`](/docs/plugins/api/properties/figma-util-solidpaint/) to set both color and opacity using familiar CSS string encodings:

Setting colors using figma.util.solidPaint

```
if (fills[0].type === 'SOLID') {  
  const fills = clone(rect.fills)  
  fills[0] = figma.util.solidPaint("#FF00FF88", fills[0])  
  rect.fills = fills  
}
```

For setting colors on other types of API objects, see [`figma.util.rgb`](/docs/plugins/api/properties/figma-util-rgb/) and [`figma.util.rgba`](/docs/plugins/api/properties/figma-util-rgba/).

## The 'Why'[​](#the-why "Direct link to The 'Why'")

*Bonus material, entirely optional*

For your curiosity, properties work this way to defend you against easy mistakes while working around some limitations of JavaScript.

This way of editing properties is not our #1 choice of API design, but...

1. When writing `color = node.fills[0].color`, the `color` object has to be either a copy or a merely view into the source-of-truth that we store internally. We can't expose the internal one because:

- Of stability reasons
- In some cases, the internal one has a more complex structure that we simplified for the API
- Many things have to happen inside Figma when a property is changed (e.g. re-render, update instances)
- The real `color` isn't even a JavaScript object, but somewhere in [WebAssembly memory](https://www.figma.com/blog/webassembly-cut-figmas-load-time-by-3x/)

Example:

Erroneous edit

```
// This wouldn't do anything, which is even more  
// confusing, so we throw an exception  
node.fills.[0].color.r = 0.5
```

In the above example, setting a property on a plain JS object can't notify Figma of changes.

2. We could have properties like `node.fills` return magic objects that can notify Figma of changes using getter, setters, or even [proxies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy). However, that would require us to re-implement JavaScript arrays, which is not advisable. It also leads to other confusing situations:

Confusing edit

```
// just a plain array  
let selection = [A, B, C]  
// converts plain array into magic array?  
figma.currentPage.selection = selection  
// doesn't do anything, still a plain array  
selection.push(D)
```

In addition, due to the need to pass plain objects when message-passing between the main thread and the UI, the magic objects would have to be converted back and forth to plain objects anyway.

Debugging via `console.log` would also be quite painful. Since getters & setters have to be evaluated, everything would always appear as `(...)` in the console that you would need to click to expand. Whereas currently, `console.log(node.fills)` prints out the entire fills object correctly.

In the end, while magic objects would be convenient in some cases, they are only convenient if they look as much like normal objects as possible. But if they did, it would be hard to tell the two apart. Since it wouldn't be possible to fully hide the abstraction, the abstraction would fail in random, hard to predict ways.

info

Note: node objects *are* magic objects with getters & setters, because they have to be. But there's a big difference between having a magic object and a magic object whose properties recursively return magic objects.

- [The 'How'](#the-how)
  - [Changing colors](#changing-colors)
- [The 'Why'](#the-why)