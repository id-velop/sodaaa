# Working in Dev Mode

**Source:** https://developers.figma.com/docs/plugins/working-in-dev-mode/

---

On this page

## Figma design's Dev Mode[​](#figma-designs-dev-mode "Direct link to Figma design's Dev Mode")

[Dev Mode](https://help.figma.com/hc/en-us/articles/15023124644247) is a mode in Figma design files that is dedicated to giving front-end developers everything they need to navigate design files and implement designs into code.

Key differences between Dev Mode and Figma's design mode are:

- The layers panel in Dev Mode is simplified and organized around [Sections](/docs/plugins/api/SectionNode/)
- In Dev Mode, the Inspect panel has information that's helpful for design implementation, such as a CSS box model and a simplified view of properties, code, and assets
- Dev Mode is a read-only surface, since developers implementing designs often don't have write access to a Figma file

## Plugins for Dev Mode[​](#plugins-for-dev-mode "Direct link to Plugins for Dev Mode")

Like Figma's other products, plugins can also integrate with Dev Mode.

Plugins for Dev Mode help ensure developers have all of the relevant information that they need to implement a design in one place. Plugins for Dev Mode can be used for inspection and code generation.

**Inspection:** Plugins can take over the Inspect panel in Dev Mode and pull in relevant context from other tools that’s needed for design implementation, such as Jira, GitHub, or an internal API specific to your organization.

**Code generation:** Plugins can customize code generation using languages and frontend frameworks that Figma doesn’t support natively.

Plugins in Dev Mode have some key differences when compared to other plugins:

- **Pages are always dynamically loaded**: Unlike other plugins for the Figma editor, plugins for Dev Mode will *not* [load all pages in a file](/docs/plugins/how-plugins-run/#file-loading), even if `"documentAccess": "dynamic-page"` isn't included in the [plugin manifest](/docs/plugins/manifest/). By default, a plugin in Dev Mode will only run on the user's current page. You can use the methods provided by the Plugin API to [load additional pages as needed](/docs/plugins/accessing-document/#loading-pages-and-nodes).
- **Read-only:** Plugins in Dev Mode are read-only, meaning they can use plugin APIs that read from the document, modify some metadata like [pluginData](/docs/plugins/api/properties/nodes-setplugindata/) and [relaunchData](/docs/plugins/api/properties/nodes-setrelaunchdata/), respond to API events emitted by Figma, [make network requests](/docs/plugins/making-network-requests/), or [open iframes to create UIs](/docs/plugins/creating-ui/#usage-example). However, these plugins **won't** be able to edit the contents of the document.
- **Plugin UIs:** If a plugin in Dev Mode opens an iframe, the iframe will take up the full height and width of the Inspect panel. This ensures the plugin’s iframe doesn’t obscure the canvas or what developers need to implement.
- **Visual Studio Code:** Dev Mode plugins can run in [Figma for VS Code](https://help.figma.com/hc/en-us/articles/15023121296151), in addition to running in Figma's web and desktop apps. Dev Mode plugins need to explicitly indicate that they are compatible with Figma for VS Code.

caution

The Inspect panel is resizeable in Dev Mode. In Visual Studio Code, the Inspect panel is oriented horizontally, rather than vertically as in the Figma web and desktop apps. Because of these varied orientations, it's important to make sure that your plugin's iframe is responsive. [Learn more →](#responsive-iframes).

## Plugins for inspection[​](#plugins-for-inspection "Direct link to Plugins for inspection")

Plugins in Dev Mode can be used for inspection, meaning they can show context associated with a selected layer in Dev Mode's Plugins panel.

### How to get started[​](#how-to-get-started "Direct link to How to get started")

To start building a plugin for inspection, you must update your plugin manifest in the following ways:

- Set the `"editorType"` to `"dev"`
- Add `"inspect"` to the `"capabilities"` field
- Add `"vscode"` to the `"capabilities"` field if you want your plugin to work in Figma for VS Code

For example:

manifest.json for Dev Mode

```
{  
  "name": "Plugin for inspection",  
  "id": "000000000000000000",  
  "api": "1.0.0",  
  "main": "code.js",  
  "documentAccess": "dynamic-page",  
  "editorType": ["dev"],  
  "capabilities": ["inspect", "vscode"]  
}
```

info

See all of the options for the [Plugin Manifest →](/docs/plugins/manifest/)

When structuring your code, you can utilize `figma.editorType` and `figma.mode` to determine what plugin behavior is allowed.

main.ts for Dev Mode

```
if (figma.editorType === "dev") {  
  // Read the current page and listen to API events  
  const numChildren = figma.currentPage.children.length  
  figma.notify(  
    `This is running in Dev Mode.  
    The current page has ${numChildren}`  
  );  
} else {  
  figma.notify(  
    `This is NOT running in Dev Mode.  
    We can modify the file!`  
  );  
  const node = figma.createRectangle();  
  node.name = "I proved that I can edit files!";  
}  
figma.closePlugin();
```

## Plugins for code generation[​](#plugins-for-code-generation "Direct link to Plugins for code generation")

Plugins in Dev Mode can also be used for custom code generation ("codegen"). These plugins can read the user's current selection and send Figma any generate code or related metadata associated with the layer. Importantly, any content generated by these plugins is rendered in the code section of the Inspect panel, in the same place you’d find Figma’s native code snippets. This means that you don't need to build or open an iframe in order to show users generated code.

You can use plugins to generate code for languages or framework that Figma doesn’t support natively, or to surface other metadata that a user might want, such as where to import icons in a codebase or internationalization string extraction.

Learn more about how to build [Plugins for Codegen →](/docs/plugins/codegen-plugins/).

## Key differences between plugins in Dev Mode and other plugins[​](#key-differences-between-plugins-in-dev-mode-and-other-plugins "Direct link to Key differences between plugins in Dev Mode and other plugins")

### Limited access to the document[​](#limited-access-to-the-document "Direct link to Limited access to the document")

Plugin in Dev Mode can access the current page, load additional pages as needed, listen to events, and make network requests, but crucially they cannot modify the document, with the exception of writing certain metadata like [pluginData](/docs/plugins/api/properties/nodes-setplugindata/) and [relaunchData](/docs/plugins/api/properties/nodes-setrelaunchdata/). So, any method or operation in the plugin API that creates new nodes, deletes existing nodes, or modifies an existing node isn't available in Dev Mode.

For example, here are a few operations that would not work in Dev Mode:

Plugin trying to write to the document in Dev Mode

```
// This will throw an error because we are trying to create a new node.  
const node = figma.createRectangle();  
  
// This will throw an error because we are trying to remove an existing node.  
node.remove();  
  
// This will throw an error because we are trying to update a property on a node.  
node.name = "Button";
```

The following operations are valid to perform while in Dev Mode:

Plugin valid operations in Dev Mode

```
// Get a node  
const node = await figma.getNodeByIdAsync('1:12');  
  
// Read a property  
console.log(node.name)  
  
// showUI  
figma.showUI(__html__)  
  
// listen to events  
figma.on('selectionchange', () => {  
  // Do something  
})
```

info

In general, setter methods in the Plugin API do not work in Dev Mode. The only exceptions to this rule are for [pluginData](/docs/plugins/api/properties/nodes-setplugindata/), [relaunchData](/docs/plugins/api/properties/nodes-setrelaunchdata/), and [`exportAsync()`](/docs/plugins/api/properties/nodes-exportasync/), which plugins can use regardless of the file permissions of the user who is running the plugin.

### Reading from the document[​](#reading-from-the-document "Direct link to Reading from the document")

When reading the document, the plugin will have access to the current page and ComponentNodes that the page references.

Plugin reading from the document in Dev Mode

```
// ✅ Works the same as in Figma design  
// Children of the current page  
figma.currentPage.children  
  
// findAll and findAllWithCriteria  
figma.currentPage.findAll(node => node.name === 'Button')  
  
// Getting the main component  
instance.mainComponent  
  
// Changing the page  
figma.currentPage = figma.root.children[2]  
  
// Accessing data directly on the document root  
figma.root.getPluginData("plugin-data-id")
```

To load additional pages for your plugin to act on, follow the instructions in [Accessing the Document](/docs/plugins/accessing-document/#loading-pages-and-nodes).

### skipInvisibleInstanceChildren[​](#skipinvisibleinstancechildren "Direct link to skipInvisibleInstanceChildren")

The [skipInvisibleInstanceChildren](/docs/plugins/api/properties/figma-skipinvisibleinstancechildren/) property is set to `true` in Dev Mode by default. This helps ensure plugins are more performant.

### Responsive iframes[​](#responsive-iframes "Direct link to Responsive iframes")

Because plugins in Dev Mode will take up the full width and height of the Inspect panel in Dev Mode, and because this panel is resizable by users, we recommend that you design your plugin iframes using the following guidelines:

1. Make sure the content inside of your plugin iframe can handle being responsively resized
2. Design your content around being vertically tall and handling scrolling overflow
3. The content of your iframe should be optimized around having a minimum width of 300px

## Dev Mode plugins in Visual Studio Code[​](#dev-mode-plugins-in-visual-studio-code "Direct link to Dev Mode plugins in Visual Studio Code")

Dev Mode plugins require some minor updates to work in Visual Studio Code:

- `"vscode"` must be added to the `"capabilities"` field
- Plugins that open links must use `figma.openExternal` to do so
- Plugins that show UI that contains text fields should handle keyboard shortcuts
- Plugins that show dialogs in the UI like `alert()` or `confirm()` should implement custom UI for this functionality. VS Code blocks extensions from showing native dialogs like alert and confirm.

### Opening links in Visual Studio Code[​](#opening-links-in-visual-studio-code "Direct link to Opening links in Visual Studio Code")

VS Code limits how extensions, like Figma for VS Code, can open links.

If your plugin needs to open links, like to sign in to a backend service, it must use the `figma.openExternal` method rather than `window.open` or `<a href="...">`-style links.

Opening links in VS Code: plugin iframe

```
// ui.html  
<script>  
  function handleClick(event) {  
    event.preventDefault();  
    var url = event.currentTarget.getAttribute("href");  
    parent.postMessage(  
      { pluginMessage: { type: "OPEN_IN_BROWSER", url: url } },  
      "*"  
    );  
  }  
</script>  
  
<a href="https://google.com" onclick="handleClick(event)">Click Me</a>
```

Opening links in VS Code: plugin code

```
figma.ui.onmessage = (message) => {  
  if (message.type === 'OPEN_IN_BROWSER') {  
    figma.openExternal(message.url)  
  }  
}
```

### Handling keyboard shortcuts in Visual Studio Code[​](#handling-keyboard-shortcuts-in-visual-studio-code "Direct link to Handling keyboard shortcuts in Visual Studio Code")

Text-related keyboard shortcuts work differently in plugin UIs in VS Code.

Specifically, plugin UIs that are hosted elsewhere (i.e. you are navigating the plugin iframe to a custom URL, rather than HTML included with your plugin) do not support text-related keyboard shortcuts by default. This means that, unless you implement custom handlers as described in this section, users cannot use the following shortcuts within your plugin:

- Cut/copy/paste: `Cmd` (Mac) or `Ctrl` (Windows) + `X`/`C`/`V`
- Undo/redo: `Cmd-Z`, `Cmd-Shift-Z` (Mac), `Ctrl-Z`, `Ctrl-Y` (Windows)
- Select all: `Cmd` (Mac) or `Ctrl` (Windows) + `A`

If you have text inputs in your plugin UI, or text that users expect to copy, you should test these keyboard shortcuts to ensure they work as expected in VS Code. If they do not, we recommend adding custom keyboard event handling code.

In your plugin sandbox code:

1. Wait for your plugin UI to load.
2. Send a message to your plugin UI to tell it if your plugin is running in VS Code.

Keyboard shortcuts in VS Code: plugin code

```
figma.showUI(`<script>window.location = 'https://...'</script>`);  
  
figma.ui.onmessage = (msg) => {  
  // Message sent from plugin UI when it's ready to receive messages  
  // We don't want to send a message if the UI hasn't loaded yet  
  if (msg === 'ready') {  
    figma.ui.postMessage({  
      type: 'isVsCode',  
      isVsCode: !!figma.vscode, // Tell our plugin UI whether we're running in VS Code  
    })  
  }  
}
```

Then, in your UI code, you must listen for the keyboard shortcuts you want to handle, and execute the corresponding commands:

Keyboard shortcuts in VS Code: plugin iframe

```
window.onmessage = (e) => {  
  if (e.data.pluginMessage) {  
    const message = e.data.pluginMessage  
    // If we get a message from the plugin sandbox saying that we're running  
    // in VS Code, then we need to handle keyboard shortcuts ourselves  
    if (message.type === 'isVsCode' && message.isVsCode) {  
      console.log('in VSCode, adding keydown listener')  
      document.addEventListener('keydown', (e) => {  
        const ctrlDown = e.metaKey || e.ctrlKey  
        if (ctrlDown) {  
          if (e.key === 'a') {  
            document.execCommand('selectAll')  
          } else if (e.key === 'z') {  
            if (e.shiftKey) {  
              document.execCommand('redo')  
            } else {  
              document.execCommand('undo')  
            }  
          } else if (e.key === 'x') {  
            document.execCommand('cut')  
          } else if (e.key === 'c') {  
            document.execCommand('copy')  
          } else if (e.key === 'v') {  
            document.execCommand('paste')  
          }  
        }  
      })  
    }  
  }  
}  
  
// Tell our plugin code that we're ready to receive messages  
parent.postMessage(  
  { pluginMessage: 'ready', pluginId: 'USE-ID-FROM-MANIFEST-HERE' },  
  'https://www.figma.com'  
)
```

### Determine if plugin is running in VS Code[​](#determine-if-plugin-is-running-in-vs-code "Direct link to Determine if plugin is running in VS Code")

Figma has reserved the `figma.vscode` namespace. Currently, we do not provide any VS Code-specific APIs, but we may add some in the future.

`figma.vscode` will be `undefined` if you are outside of the VS Code extension, so you can use this value to determine if your plugin is running inside of VS Code.

Determine if running in VS Code

```
if (figma.vscode) {  
  // Do something in VS Code  
}
```

- [Figma design's Dev Mode](#figma-designs-dev-mode)
- [Plugins for Dev Mode](#plugins-for-dev-mode)
- [Plugins for inspection](#plugins-for-inspection)
  - [How to get started](#how-to-get-started)
- [Plugins for code generation](#plugins-for-code-generation)
- [Key differences between plugins in Dev Mode and other plugins](#key-differences-between-plugins-in-dev-mode-and-other-plugins)
  - [Limited access to the document](#limited-access-to-the-document)
  - [Reading from the document](#reading-from-the-document)
  - [skipInvisibleInstanceChildren](#skipinvisibleinstancechildren)
  - [Responsive iframes](#responsive-iframes)
- [Dev Mode plugins in Visual Studio Code](#dev-mode-plugins-in-visual-studio-code)
  - [Opening links in Visual Studio Code](#opening-links-in-visual-studio-code)
  - [Handling keyboard shortcuts in Visual Studio Code](#handling-keyboard-shortcuts-in-visual-studio-code)
  - [Determine if plugin is running in VS Code](#determine-if-plugin-is-running-in-vs-code)