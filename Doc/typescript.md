# TypeScript

**Source:** https://developers.figma.com/docs/plugins/typescript/

---

On this page

In `manifest.json`, the `main` field always takes a JavaScript file. After all, plugins run in the browser, and browsers only support JavaScript.

You're free to use plain JavaScript, or any of the languages that can be translated into JavaScript. However, to build a quality plugin that won't crash in unexpected situations, we **strongly** recommend the use of TypeScript.

## What is TypeScript?[​](#what-is-typescript "Direct link to What is TypeScript?")

TypeScript is **not a new language**. It is an extension of the JavaScript language. You can write JavaScript code, paste it into a TypeScript file. Congratulations, you've just written TypeScript!

TypeScript allows you to add *type annotations* to your code. These don't change how your code runs, they are just notes for yourself and for the compiler

Sample TypeScript

```
// The ': string[]' is an annotation  
let list: string[] = []  
for (const node of figma.currentPage.selection) {  
  list.push(node.type)  
}  
  
// The ': number' are also annotations  
function doThing(x: number, str: string) {  
  // ...  
}
```

In addition, we provide type annotations for the entire Figma API. It looks like this:

plugin-typings

```
interface PluginAPI {  
  readonly command: string  
  readonly root: DocumentNode  
  readonly timer?: TimerAPI  
  readonly viewport: ViewportAPI  
  closePlugin(message?: string): void  
  
  showUI(html: string, options?: ShowUIOptions): void  
  readonly ui: UIAPI  
  readonly util: UtilAPI  
  
  readonly clientStorage: ClientStorageAPI  
  
  getNodeByIdAsync(id: string): Promise<BaseNode> | null  
  getStyleByIdAsync(id: string): Promise<BaseStyle> | null  
  ...  
}
```

Paired with an editor like Visual Studio Code, the editor is smart about knowing what variable has which properties, *while you are typing*!

![Intellisense](/assets/images/intellisense-f35ccb7877f9c148a19d082ba230b38a.gif)

These type annotations are more than just comments with a new syntax. The TypeScript compiler can use them to detect accidental errors.

Detecting accidental errors with TypeScript

```
let list: string[] = []  
for (const node of figma.currentPage.selection) {  
  // Error! Type SceneNode is not assignable to type 'string'  
  list.push(node)  
}
```

![Type error](/assets/images/type_error-3dc91f43e463d288b94bbab7d403ed40.png)

Having the compiler tell you about errors generally allows you to develop faster. It's much easier to catch and fix errors when the compiler tells you exactly what line is wrong, whereas having to test the plugin to find bugs (or worse, having your *users* test the plugin) is much more expensive. TypeScript doesn't prevent all bugs from happening of course, but it does eliminate a large class of them.

## How do I use the Figma API with TypeScript?[​](#how-do-i-use-the-figma-api-with-typescript "Direct link to How do I use the Figma API with TypeScript?")

One of the main reasons we want you to use TypeScript is that there are many [node types](/docs/plugins/api/nodes/) in Figma, and all of them are slightly different. For example, it's easy to forget nodes like boolean operations or slices. And it's possible your plugin doesn't care about them, which is fine, but it shouldn't crash if it runs into one!

Consider, for example, this function which turns a frame into a component:

Erroneous way to turn frame into a component

```
function turnFrameIntoComponent() {  
  const selection: SceneNode = figma.currentPage.selection[0]  
  if (!selection) { return }  
  const component = figma.createComponent()  
  component.x = selection.x  
  component.y = selection.y  
  component.resize(selection.width, selection.height)  
  // Copy children into new node  
  for (const child of selection.children) {  
    component.appendChild(child)  
  }  
  selection.remove()  
}
```

This code could crash. The user might not necessarily have a frame selected when running the plugin! TypeScript will tell you that.

![Type error in a node](/assets/images/type_error_node-d9daf2a4685db10db0b6c84b7bba5fb8.png)

The correct thing to do is to check the `type` property of a node before using it.

Correct way to turn frame into a component

```
function turnFrameIntoComponent() {  
  const selection: SceneNode = figma.currentPage.selection[0]  
  if (!selection) { return }  
  if (selection.type !== 'FRAME') { return } // <----  
  const component = figma.createComponent()  
  component.x = selection.x  
  component.y = selection.y  
  component.resize(selection.width, selection.height)  
  // Copy children into new node  
  for (const child of selection.children) {  
    component.appendChild(child)  
  }  
  selection.remove()  
}
```

And the compiler is smart enough that, past that point, `selection` is always a `FrameNode` which always has a `children` property. It knows to narrow down `SceneNode` to `FrameNode`. Just hover over `selection` to see!

![Node type on hover](/assets/images/node_type_hover-08fffb6a424dbf5351967ba2a712c110.png)

TypeScript also supports type unions. In this example, `NodeWithChildren` is one of four node types.

```
type NodeWithChildren = FrameNode | ComponentNode | InstanceNode | BooleanOperationNode
```

You can combine multiple of these checks together. For example, if you often find yourself needing to check that a node has the `children` property, you can write a helper function for that. This function's return value is a [type predicate](https://www.typescriptlang.org/docs/handbook/advanced-types.html#using-type-predicates), which tells the compiler that if `supportsChildren` evaluates to true, then the argument must necessarily be of type `(FrameNode | ComponentNode | InstanceNode | BooleanOperationNode)`.

Multiple type checks

```
function supportsChildren(node: SceneNode):  
  node is FrameNode | ComponentNode | InstanceNode | BooleanOperationNode  
{  
  return node.type === 'FRAME' || node.type === 'GROUP' ||  
         node.type === 'COMPONENT' || node.type === 'INSTANCE' ||  
         node.type === 'BOOLEAN_OPERATION'  
}  
  
const selection = figma.currentPage.selection[0]  
if (supportsChildren(selection)) {  
  // Inside this if statement, selection always has .children property  
  console.log(selection.children)  
}
```

## Lint your TypeScript[​](#lint-your-typescript "Direct link to Lint your TypeScript")

Linting, the automated validation of source code for issues, can be very helpful for catching errors early in the development of your plugin. Figma provides a set of [typescript-eslint rules](https://github.com/figma/eslint-plugin-figma-plugins?tab=readme-ov-file#eslint-plugin-figma-plugins) to help support plugin development. These rules can identify, and in many cases automatically fix, issues in your plugin code.

To install and use the linter, follow the instructions in the [**Usage** section](https://github.com/figma/eslint-plugin-figma-plugins?tab=readme-ov-file#usage) of the README included with the linter rules. [Find the `eslint-plugin-figma-plugins` repository on GitHub →](https://github.com/figma/eslint-plugin-figma-plugins?tab=readme-ov-file)

## Type errors are slowing you down?[​](#type-errors-are-slowing-you-down "Direct link to Type errors are slowing you down?")

In some cases, you *know* your code is correct, but you can't seem to convince the compiler. One way to tell the compiler something is to use a type cast.

Type casting

```
// Prints the number of children. 'as NodeWithChildren'  
// tells the compiler you're sure about what you're doing  
const selection = figma.currentPage.selection[0]  
console((selection as NodeWithChildren).children)
```

In even more extreme measures, you can use the `as any` cast to have TypeScript not type-check a particular variable at all. It's reasonable to do this sometimes, particularly when prototyping where you want to move as fast as possible. But try not to leave these type casts around. The compiler sometimes raises false alarms, but it finds bugs pretty often too!

- [What is TypeScript?](#what-is-typescript)
- [How do I use the Figma API with TypeScript?](#how-do-i-use-the-figma-api-with-typescript)
- [Lint your TypeScript](#lint-your-typescript)
- [Type errors are slowing you down?](#type-errors-are-slowing-you-down)