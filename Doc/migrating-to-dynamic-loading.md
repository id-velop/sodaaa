# Migrating Plugins to Dynamically Load Pages

**Source:** https://developers.figma.com/docs/plugins/migrating-to-dynamic-loading/

---

On this page

In 2023, Figma started to [dynamically load pages](https://help.figma.com/hc/en-us/articles/1500005554982-Guide-to-files-and-projects#h_01HHDQ77YC3D3NK7K9DEE3SQKQ) for Figma designs. Previously, when a Figma file was accessed, all pages in the document were loaded, which led to delays in loading very large or complex files. Now, pages in Figma design files are loaded only as needed. Because pages are loaded only as needed, it is no longer guaranteed that all information in a document is accessible via the Plugin API without additional requests for page data.

This transition required the deprecation of incompatible methods and addition of new dynamic loading compatible methods in the Plugin API. This guide describes how to upgrade your plugin to use these new methods.

## How to upgrade your plugin[​](#how-to-upgrade-your-plugin "Direct link to How to upgrade your plugin")

To upgrade your plugin:

1. [Update the type definitions.](#update-the-type-definitions)
2. [Install the linter.](#install-linter)
3. [Update your plugin's manifest.](#update-your-plugins-manifest)
4. [Update the plugin code to use the async APIs.](#update-plugin-code-to-use-async-apis)

## Update the type definitions[​](#update-the-type-definitions "Direct link to Update the type definitions")

To support the way Figma [loads pages as needed](https://help.figma.com/hc/en-us/articles/1500005554982-Guide-to-files-and-projects#h_01HHDQ77YC3D3NK7K9DEE3SQKQ), we’ve updated the Plugin API. TypeScript type definitions for the changes are available in our [official typings](https://github.com/figma/plugin-typings).

To access these type definitions, ensure your plugin’s package.json file contains the following entry:

package.json

```
{  
  ...  
  "devDependencies": {  
    ...  
    "@figma/plugin-typings": "*"  
  }  
}
```

Then, re-run `npm install`.

## Install the linter[​](#install-the-linter "Direct link to Install the linter")

Figma provides a set of [typescript-eslint rules](https://github.com/figma/eslint-plugin-figma-plugins?tab=readme-ov-file#eslint-plugin-figma-plugins) that help identify, and in many cases automatically fix, areas of your plugin code that need to be migrated.

To install and use the linter, follow the instructions in the [**Usage** section](https://github.com/figma/eslint-plugin-figma-plugins?tab=readme-ov-file#usage) of the README included with the linter rules. [Find the `eslint-plugin-figma-plugins` repository on GitHub →](https://github.com/figma/eslint-plugin-figma-plugins?tab=readme-ov-file)

**Note:** The linter works for TypeScript files only. If your code is written in JavaScript, you can use a regex snippet to search for code that might need to be changed to be compatible with dynamic page loading. While this isn't all-encompassing, it should make the migration process easier. This regex snippet can be used in an editor like VS Code to search through your plugin code:

```
((figma\.getNodeById)|(figma\.getStyleById)|(figma\.getFileThumbnailNode)|(figma\.getLocalTextStyles)|(figma\.getLocalPaintStyles)|(figma\.getLocalEffectStyles)|(figma\.getLocalGridStyles)|(figma\.variables\.getVariableById)|(figma\.variables\.getVariableCollectionById)|(figma\.variables\.getLocalVariableCollections)|(figma\.variables\.getLocalVariables)|(\.instances)|(\.consumers)|(\.mainComponent)|(\.effectStyleId =)|(\.fillStyleId =)|(\.gridStyleId =)|(\.textStyleId =)|(\.backgroundStyleId =)|(\.strokeStyleId =)|(\.setRangeTextStyleId)|(\.setRangeFillStyleId)|(\.setRangeTextStyleId)|(\.setRangeFillStyleId)|(\.setBoundVariable)|(figma\.variables\.setBoundVariableForPaint)|(createVariable))
```

## Update your plugin’s manifest[​](#update-your-plugins-manifest "Direct link to Update your plugin’s manifest")

Dynamic page loading introduces a new field to the [existing manifest fields](/docs/plugins/manifest/): `documentAccess`.

Adding `"documentAccess": "dynamic-page"` to your plugin’s manifest tells Figma that it does not need to preemptively load all pages in a file before running your plugin. The manifest field and value are included by default in Figma’s plugin templates, so you won’t need to worry about this step when you create new plugins. The `documentAccess` field is a required manifest field for plugins and must be set to `dynamic-page`.

manifest.json

```
manifest: {  
  ...  
  "documentAccess": "dynamic-page"  
}
```

When `documentAccess` is not included in the manifest, the first time a legacy plugin runs in a newly-opened file, Figma ensures all nodes, pages, and contents of the file are loaded before running the plugin. If a Figma file is very large, this load can take around 20 to 30 seconds. Only contents of the file that have not been loaded on the client will need to be loaded, so any subsequent plugin runs during the same session will be able to run immediately, as before.

## Overview of changes[​](#overview-of-changes "Direct link to Overview of changes")

With dynamic page loading, several methods are no longer supported and are replaced by new async versions that will retrieve these objects if they have not been loaded on the client. If you call any of the deprecated APIs when in dynamic page loading mode, your plugin will throw.

Variables and Styles specifically are considered objects that exist outside of pages. Similar to regular nodes, before setting a variable or a style, we need to make sure that it has been loaded on the client. We achieved this by updating APIs where a StyleId, a VariableId, or a VariableCollectionId is used directly to instead use a Style, Variable, or a VariableCollection object.

### Net-new methods[​](#net-new-methods "Direct link to Net-new methods")

- [figma.loadAllPagesAsync()](/docs/plugins/api/figma/#loadallpagesasync)
- [figma.variables.createVariableAliasByIdAsync()](/docs/plugins/api/figma-variables/#createvariablealiasbyidasync)
- [PageNode.loadAsync()](/docs/plugins/api/PageNode/#loadasync)

### Deprecations and replacements[​](#deprecations-and-replacements "Direct link to Deprecations and replacements")

Several methods and properties have been deprecated in favor of `async` replacements:

- Use [`figma.getFileThumbnailNodeAsync()`](/docs/plugins/api/figma/#getfilethumbnailnodeasync) instead of [`figma.getFileThumbnailNode()`](/docs/plugins/api/figma/#getfilethumbnailnode).
- Use [`figma.getLocalEffectStylesAsync()`](/docs/plugins/api/figma/#getlocaleffectstylesasync) instead of [`figma.getLocalEffectStyles()`](/docs/plugins/api/figma/#getlocaleffectstyles).
- Use [`figma.getLocalGridStylesAsync()`](/docs/plugins/api/figma/#getlocalgridstylesasync) instead of [`figma.getLocalGridStyles()`](/docs/plugins/api/figma/#getlocalgridstyles).
- Use [`figma.getLocalPaintStylesAsync()`](/docs/plugins/api/figma/#getlocalpaintstylesasync) instead of [`figma.getLocalPaintStyles()`](/docs/plugins/api/figma/#getlocalpaintstyles).
- Use [`figma.getLocalTextStylesAsync()`](/docs/plugins/api/figma/#getlocaltextstylesasync) instead of [`figma.getLocalTextStyles()`](/docs/plugins/api/figma/#getlocaltextstyles).
- Use [`figma.getNodeByIdAsync()`](/docs/plugins/api/figma/#getnodebyidasync) instead of [`figma.getNodeById()`](/docs/plugins/api/figma/#getnodebyid).
- Use [`figma.getStyleByIdAsync()`](/docs/plugins/api/figma/#getstylebyidasync) instead of [`figma.getStyleById()`](/docs/plugins/api/figma/#getstylebyid).
- Use [`figma.variables.getLocalVariableCollectionsAsync()`](/docs/plugins/api/figma-variables/#getlocalvariablecollectionsasync) instead of [`figma.variables.getLocalVariableCollections()`](/docs/plugins/api/figma-variables/#getlocalvariablecollections).
- Use [`figma.variables.getLocalVariablesAsync()`](/docs/plugins/api/figma-variables/#getlocalvariablesasync) instead of [`figma.variables.getLocalVariables()`](/docs/plugins/api/figma-variables/#getlocalvariables).
- Use [`figma.variables.getVariableByIdAsync()`](/docs/plugins/api/figma-variables/#getvariablebyidasync) instead of [`figma.variables.getVariableById()`](/docs/plugins/api/figma-variables/#getvariablebyid).
- Use [`figma.variables.getVariableCollectionByIdAsync()`](/docs/plugins/api/figma-variables/#getvariablecollectionbyidasync) instead of [`figma.variables.getVariableCollectionById()`](/docs/plugins/api/figma-variables/#getvariablecollectionbyid).
- Use [`setRangeFillStyleIdAsync()`](/docs/plugins/api/node-properties/#setrangefillstyleidasync) instead of [`setRangeFillStyleId()`](/docs/plugins/api/node-properties/#setrangefillstyleid).
- Use [`setRangeTextStyleIdAsync()`](/docs/plugins/api/node-properties/#setrangetextstyleidasync) instead of [`setRangeTextStyleId()`](/docs/plugins/api/node-properties/#setrangetextstyleid).

In some specific cases, reading node properties has been deprecated in favor of an `async` getter:

- Use [`ComponentNode.getInstancesAsync()`](/docs/plugins/api/ComponentNode/#getinstancesasync) instead of [`ComponentNode.instances`](/docs/plugins/api/ComponentNode/#instances).
- Use [`getStyleConsumersAsync()`](/docs/plugins/api/BaseStyle/#getstyleconsumersasync) instead of the [`consumers`](/docs/plugins/api/BaseStyle/#consumers).
- Use [`InstanceNode.getMainComponentAsync()`](/docs/plugins/api/InstanceNode/#getmaincomponentasync) instead of [`InstanceNode.mainComponent`](/docs/plugins/api/InstanceNode/#maincomponent).

In some specific cases, assigning values directly to node properties has been deprecated in favor of an `async` setter:

- Use [`figma.setCurrentPageAsync()`](/docs/plugins/api/figma/#setcurrentpageasync) instead of assigning to [`figma.currentPage`](/docs/plugins/api/figma/#currentpage).
- Use [`setEffectStyleIdAsync()`](/docs/plugins/api/node-properties/#seteffectstyleidasync) instead of assigning to [`effectStyleId`](/docs/plugins/api/node-properties/#effectstyleid).
- Use [`setFillStyleIdAsync()`](/docs/plugins/api/node-properties/#setfillstyleidasync) instead of assigning to [`backgroundStyleId`](/docs/plugins/api/node-properties/#backgroundstyleid).
- Use [`setFillStyleIdAsync()`](/docs/plugins/api/node-properties/#setfillstyleidasync) instead of assigning to [`fillStyleId`](/docs/plugins/api/node-properties/#fillstyleid).
- Use [`setGridStyleIdAsync()`](/docs/plugins/api/node-properties/#setgridstyleidasync) instead of assigning to [`gridStyleId`](/docs/plugins/api/node-properties/#gridstyleid).
- Use [`setReactionsAsync()`](/docs/plugins/api/node-properties/#setreactionsasync) instead of assigning to [`reactions`](/docs/plugins/api/node-properties/#reactions).
- Use [`setStrokeStyleIdAsync()`](/docs/plugins/api/node-properties/#setstrokestyleidasync) instead of assigning to [`strokeStyleId`](/docs/plugins/api/node-properties/#strokestyleid).
- Use [`setVectorNetworkAsync()`](/docs/plugins/api/node-properties/#setvectornetworkasync) instead of assigning to [`vectorNetwork`](/docs/plugins/api/node-properties/#vectornetwork).
- Use [`TextNode.setTextStyleIdAsync()`](/docs/plugins/api/TextNode/#settextstyleidasync) instead of assigning to [`TextNode.textStyleId`](/docs/plugins/api/TextNode/#textstyleid).

If an extension's manifest contains `"documentAccess": "dynamic-page"`, accessing any of the deprecated items listed above will throw an exception.

### Method/property usage changes[​](#methodproperty-usage-changes "Direct link to Method/property usage changes")

If an extension's manifest contains `"documentAccess": "dynamic-page"`, calling any of the following methods will throw an exception unless you first call [figma.loadAllPagesAsync()](/docs/plugins/api/figma/#loadallpagesasync):

- [`DocumentNode.findAll()`](/docs/plugins/api/DocumentNode/#findall)
- [`DocumentNode.findAllWithCriteria()`](/docs/plugins/api/DocumentNode/#findallwithcriteria)
- [`DocumentNode.findOne()`](/docs/plugins/api/DocumentNode/#findone)
- [`DocumentNode.findWidgetNodesByWidgetId()`](/docs/plugins/api/DocumentNode/#findwidgetnodesbywidgetid)

For the methods listed below, passing a string ID is now deprecated in favor of passing objects that the IDs refer to. If an extension's manifest contains `"documentAccess": "dynamic-page"`, passing an ID will throw an exception.

- [`figma.variables.createVariable()`](/docs/plugins/api/figma-variables/#createvariable) - Pass a [`VariableCollection`](/docs/plugins/api/VariableCollection/) object instead of a collection ID.
- [`clearExplicitVariableModeForCollection()`](/docs/plugins/api/node-properties/#clearexplicitvariablemodeforcollection) (present on multiple node types) - Pass a [`VariableCollection`](/docs/plugins/api/VariableCollection/) object instead of a collection ID.
- [`setExplicitVariableModeForCollection()`](/docs/plugins/api/node-properties/#setexplicitvariablemodeforcollection) (present on multiple node types) - Pass a [`VariableCollection`](/docs/plugins/api/VariableCollection/) object instead of a collection ID.
- [`setBoundVariable()`](/docs/plugins/api/node-properties/#setboundvariable) (present on multiple node types) - Pass a [`Variable`](/docs/plugins/api/Variable/) object instead of a variable ID.

If an extension's manifest contains `"documentAccess": "dynamic-page"`, some properties and methods of [`PageNode`](/docs/plugins/api/PageNode/) will throw an exception unless you explicitly load the page first using [`PageNode.loadAsync()`](/docs/plugins/api/PageNode/#loadasync). These include:

- [`PageNode.appendChild()`](/docs/plugins/api/PageNode/#appendchild)
- [`PageNode.children`](/docs/plugins/api/PageNode/#children)
- [`PageNode.exportAsync`](/docs/plugins/api/PageNode/#exportasync)
- [`PageNode.findAll()`](/docs/plugins/api/PageNode/#findall)
- [`PageNode.findAllWithCriteria()`](/docs/plugins/api/PageNode/#findallwithcriteria)
- [`PageNode.findChild()`](/docs/plugins/api/PageNode/#findchild)
- [`PageNode.findChildren()`](/docs/plugins/api/PageNode/#findchildren)
- [`PageNode.findOne()`](/docs/plugins/api/PageNode/#findone)
- [`PageNode.findWidgetNodesByWidgetId()`](/docs/plugins/api/PageNode/#findwidgetnodesbywidgetid)
- [`PageNode.insertChild()`](/docs/plugins/api/PageNode/#insertchild)

### Changes to events[​](#changes-to-events "Direct link to Changes to events")

- If an extension's' manifest contains `"documentAccess": "dynamic-page"`, the [`documentchange`](/docs/plugins/api/properties/figma-on/#documentchange) event will not be available unless you first call [`figma.loadAllPagesAsync()`](/docs/plugins/api/figma/#loadallpagesasync).
- Where possible, prefer using the [`nodechange`](/docs/plugins/api/PageNode/#on) and [`stylechange`](/docs/plugins/api/properties/figma-on/#stylechange) events, which do not require triggering a full-document load.

## Update plugin code to use async APIs[​](#update-plugin-code-to-use-async-apis "Direct link to Update plugin code to use async APIs")

To update your plugin code to use the async APIs, you'll generally refactor your functions to use `async` and `await`.

**Examples of upgrading to async:**

Example: figma.getNodeById() → figma.getNodeByIdAsync()

```
// Before  
function extractTextContent(nodeId: string): string[] {  
  const node = figma.getNodeById(nodeId)  
  const textNodes = node.findChild(child => child.type === "TEXT")  
  return textNodes.map(textNode => textNode.characters)  
}  
  
  
// After  
async function extractTextContent(nodeId: string): Promise<string[]> {  
  const node = await figma.getNodeByIdAsync(nodeId)  
  const textNodes = node.findChild(child => child.type === "TEXT")  
  return textNodes.map(textNode => textNode.characters)  
}
```

Example: InstanceNode.mainComponent → InstanceNode.getMainComponentAsync()

```
// Before  
function getDefinitionNode(node) {  
  if (node.type !== "INSTANCE") {  
    return node  
  }  
  const { mainComponent } = node  
  return mainComponent?.parent?.type === "COMPONENT_SET"  
    ? mainComponent?.parent  
    : mainComponent  
}  
  
  
// After  
async function getDefinitionNode(node) {  
  if (node.type !== "INSTANCE") {  
    return node  
  }  
  const mainComponent = await node.getMainComponentAsync()  
  return mainComponent?.parent?.type === "COMPONENT_SET"  
    ? mainComponent?.parent  
    : mainComponent  
}
```

Example: getStyleById() & set node.fillStyleId → getStyleByIdAsync() & node.setFillStyle()

```
// Before  
function swapFillStyles(node1, node2) {  
  const fill1 = node1.fillStyleId  
  const fill2 = node2.fillStyleId  
  node1.fillStyleId = fill2  
  node2.fillStyleId = fill1  
}  
  
  
// After  
async function swapFillStyles(node1, node2) {  
  const fill1Id = node1.fillStyleId  
  const fill2Id = node2.fillStyleId  
  await node1.setFillStyleAsync(fill2Id)  
  await node2.setFillStyleAsync(fill1Id)  
}
```

### Change DocumentNode.find\* methods[​](#change-documentnodefind-methods "Direct link to Change DocumentNode.find* methods")

These methods currently work by searching nodes in the document. Some of them search all nodes in the entire document, others only search the children of the current node. These two types will have different requirements moving forward.

With `"documentAccess": "dynamic-page"`, `DocumentNode.find*` methods that search all nodes in entire document will throw unless `figma.loadAllPagesAsync()` has been called explicitly in the plugin.

Plugins must call `figma.loadAllPagesAsync()` before calling any of the following `DocumentNode.find*` methods.

- `figma.root.findAll()`
- `figma.root.findOne()`
- `figma.root.findAllWithCriteria()`

With `"documentAccess": "dynamic-page"`, `DocumentNode.find*` methods that only search the children of the node (not all nodes in the document) remain the same. These methods are the following:

- `figma.root.findChild()`
- `figma.root.findChildren()`

Example: findAll

```
/**  
 * Find all nodes named "Color"  
 */  
// Before  
const colors = figma.root.findAll(n => n.name === "Color")  
  
  
// After  
await figma.loadAllPagesAsync()  
const colors = figma.root.findAll(n => n.name === "Color")
```

Example: Document traversal

```
// This plugin counts the number of layers, ignoring instance sublayers,  
// in the document.  
// Before  
function getNumNonInstanceChildren(node) {  
  let count = 0;  
  const toVisit = [node]  
  while (toVisit.length) {  
    const curr = toVisit.pop()  
    if (curr.type !== "INSTANCE") {  
      toVisit.push(...curr.children)  
    }  
    count++;  
  }  
  return count;  
}  
  
  
// After  
async function getNumNonInstanceChildren(node) {  
  let count = 0;  
  const toVisit = [node]  
  while (toVisit.length) {  
    const curr = toVisit.pop()  
    if (curr.type === "PAGE") {  
    await curr.loadAsync()  
    }  
    if (curr.type !== "INSTANCE") {  
      toVisit.push(...curr.children)  
    }  
    count++;  
  }  
  return count;  
}
```

### Explicitly access other pages in the document[​](#explicitly-access-other-pages-in-the-document "Direct link to Explicitly access other pages in the document")

`DocumentNode.children` will continue to return all of the PageNodes in the file. However, before traversing into PageNode.children, plugins will have to explicitly call `PageNode.loadAsync()` or load the page using one of the other asynchronous methods provided. `PageNode.children` will throw an exception if called on a page that has not been explicitly loaded by the plugin. The `loadAsync()` method only exists on PageNodes as Figma loads entire pages in together.

Example: Logging the number of children on all pages

```
// Before  
for (const page of figma.root.children) {  
  console.log(`Page ${page.name} has ${page.children.length} children`)  
}  
  
  
// After  
for (const page of figma.root.children) {  
  await page.loadAsync()  
  console.log(`Page ${page.name} has ${page.children.length} children`)  
}
```

Example: Counting the number of nodes in a document

```
// This plugin counts the number of empty pages in a file  
// Before  
function countEmptyPages() {  
  let emptyPageCount = 0  
  const pages = DocumentNode.children  
  for (const page of pages) {  
    if (page.children.length === 0) {  
      emptyPageCount++  
    }  
  }  
  return emptyPageCount  
}  
  
  
// After  
async function countEmptyPages() {  
  let emptyPageCount = 0  
  const pages = DocumentNode.children  
  for (const page of pages) {  
    await page.loadAsync()  
    if (page.children.length === 0) {  
      emptyPageCount++  
    }  
  }  
  return emptyPageCount  
}
```

### Accessing the current page[​](#accessing-the-current-page "Direct link to Accessing the current page")

`figma.currentPage` remains the same and continues to return the current page without any async operations. If you are accessing the current page using an expression like `figma.root.children[x]`, then you will be required to call `loadAsync()` as described earlier. To set the current page you must use the new async setter `figma.setCurrentPageAsync(PageNode)`. This ensures the page is loaded prior to setting it as the current page.

[Accessing the Document →](/docs/plugins/accessing-document/)

### Listening to document change events[​](#listening-to-document-change-events "Direct link to Listening to document change events")

When `documentAccess` is set to `"dynamic-page"`, the `on('documentchange')` event requires that you call `figma.loadAllPagesAsync()` before registering the callback to ensure that events from all pages are listened to.

If you wish to listen to events without loading all pages, we have added two new event APIs. To subscribe to the changes on a specific page, you can use the `PageNode.on('nodechange')` callback. You can add as many `nodechange` callbacks as you want.

NodeChangeEvent interface

```
interface NodeChangeEvent {  
  nodeChanges: NodeChange[]  
}  
  
type NodeChange: CreateChange | DeleteChange | PropertyChange  
  
type CreateChange: {type: 'CREATE', node: SceneNode | RemovedNode}  
type DeleteChange: {type: 'DELETE', node: SceneNode | RemovedNode}  
type PropertyChange: {type: 'PROPERTY_CHANGE', properties: NodeChangeProperties[], node: SceneNode | RemovedNode}  
  
pageNode.on('nodechange', (event: NodeChangeEvent) => {})
```

If you wish to subscribe to only style changes, you can use the new `figma.on('stylechange')` callback.

StyleChangeEvent interface

```
interface StyleChangeEvent {  
  styleChanges: StyleChange[]  
}  
  
type StyleChange: CreateChange | DeleteChange | PropertyChange  
  
type CreateChange: {type: 'STYLE_CREATE', style: PaintStyle | TextStyle | GridStyle | EffectStyle | null}  
type DeleteChange: {type: 'STYLE_DELETE', style: PaintStyle | TextStyle | GridStyle | EffectStyle | null}  
type PropertyChange: {type: 'STYLE_PROPERTY_CHANGE', properties: StyleChangeProperty[], style: PaintStyle | TextStyle | GridStyle | EffectStyle | null}  
  
figma.on('stylechange', (event: StyleChangeEvent) => {})
```

Example: Log observed changes

```
// This plugin logs all of the CREATE changes made to the document  
// Before  
figma.on("documentchange", (e) => {  
  for (const change of event.documentchanges) {  
    if (change.type === "CREATE") {  
      console.log(  
        `Node ${change.id} created by a ${change.origin.toLowerCase()} user`  
      );  
    }  
  }  
})  
  
  
// After (a specific page)  
const page = await figma.getNodeByIdAsync('2:2')  
page.on("nodechange", (e) => {  
  for (const change of event.nodechanges) {  
    if (change.type === "CREATE") {  
      console.log(  
        `Node ${change.id} created by a ${change.origin.toLowerCase()} user`  
      );  
    }  
  }  
})  
  
// After (all pages)  
await figma.loadAllPagesAsync()  
figma.on("documentchange", (e) => {  
  for (const change of event.documentChanges) {  
    if (change.type === "CREATE") {  
      console.log(  
        `Node ${change.id} created by a ${change.origin.toLowerCase()} user`  
      );  
    }  
  }  
})  
  
// After (a style change)  
figma.on("stylechange", (e) => {  
  for(const change of event.stylechanges) {  
    if(change.type === "STYLE_CHANGE") {  
      console.log(  
            `Style ${change.id}`  
      );  
    }  
  }  
})
```

### Accessing all pages[​](#accessing-all-pages "Direct link to Accessing all pages")

Because loading all pages can be slow in large files, we strongly recommend that you only load pages as needed. Very large files can also run into a memory limit when all pages are loaded.

If you need access to all pages of a document, you can use the new API:
`figma.loadAllPagesAsync(): Promise<void>`

This method loads all pages in the document and is useful in the following two use cases:

- Traversing the entire document via `DocumentNode.find*` methods
- Listening for Document Changes

This method is subtly different from loading all pages manually via: `await Promise.all(figma.root.children.map(page => page.loadAsync()))`

With `figma.loadAllPagesAsync`, new pages added by other clients will automatically be loaded on the client as well.

- [How to upgrade your plugin](#how-to-upgrade-your-plugin)
- [Update the type definitions](#update-the-type-definitions)
- [Install the linter](#install-the-linter)
- [Update your plugin’s manifest](#update-your-plugins-manifest)
- [Overview of changes](#overview-of-changes)
  - [Net-new methods](#net-new-methods)
  - [Deprecations and replacements](#deprecations-and-replacements)
  - [Method/property usage changes](#methodproperty-usage-changes)
  - [Changes to events](#changes-to-events)
- [Update plugin code to use async APIs](#update-plugin-code-to-use-async-apis)
  - [Change DocumentNode.find\* methods](#change-documentnodefind-methods)
  - [Explicitly access other pages in the document](#explicitly-access-other-pages-in-the-document)
  - [Accessing the current page](#accessing-the-current-page)
  - [Listening to document change events](#listening-to-document-change-events)
  - [Accessing all pages](#accessing-all-pages)