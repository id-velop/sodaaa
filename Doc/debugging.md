# Debugging

**Source:** https://developers.figma.com/docs/plugins/debugging/

---

On this page

First open the Developer Tools panel by clicking the "Plugins > Development > Open Console..." or use the shortcut ⌥⌘I. It should look like this:

Note that you may need to switch to the "Console" tab if another tab is currently active.

This panel lets you debug your plugin in various ways:

### Use it to explore the API[​](#use-it-to-explore-the-api "Direct link to Use it to explore the API")

You can try out the plugin API here. Try typing `figma.currentPage` and pressing Enter. This will execute that expression and show the return value, just as if your plugin had executed the same expression.

You should see a something like `PageNode {id: "0:1"}` in the console. This is the object returned from executing `figma.currentPage`. Try clicking the little triangle to the left of it to see the properties available on the object.

![](https://static.figma.com/uploads/a77c254095b2f6f4f878b2f35ecdc898843c5ff0)

Note that the `(...)` text next to each property is clickable. When clicked the console will show the value of that property and will let you explore further into the object and its properties.

If the current page contains any layers it can be especially interesting to click the `(...)` next to `children` to see a list of all the layers directly in the page and explore their properties.

### Print out what your plugin is doing[​](#print-out-what-your-plugin-is-doing "Direct link to Print out what your plugin is doing")

If you want to inspect the value of a variable in your plugin, the easiest way to do that is to call `console.log(value)` from your plugin code. That will show up in this console.

info

Note: once your plugin has finished executing, the little `(...)` next to properties will stop working on any objects that were printed to the console while by the plugin. The easiest way to work around that is to remove the `figma.closePlugin()` call from your plugin while you are debugging.

## Developer VM[​](#developer-vm "Direct link to Developer VM")

Plugins that are currently being developed (those in the "Plugins > Development" menu) can be run in the Developer VM by checking the "Plugins > Development > Use Developer VM" option. When the option is enabled, these plugins will run in the browser's JavaScript engine, so that developer tools can be used.

info

Note: running a plugin in the Developer VM will have different performance characteristics than running in the normal sandbox. It is best to do performance testing and final verification without this option as the Developer VM can give unrealistic results.

To find a plugin's source code in the dev tools, add a `debugger;` statement somewhere in the file to add a breakpoint. When the plugin execution reaches that line, the source code will show in the dev tools centered on that line.

- [Use it to explore the API](#use-it-to-explore-the-api)
- [Print out what your plugin is doing](#print-out-what-your-plugin-is-doing)
- [Developer VM](#developer-vm)