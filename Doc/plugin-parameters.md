# Accepting Parameters as Input

**Source:** https://developers.figma.com/docs/plugins/plugin-parameters/

---

On this page

This page goes over how to accept parameters as input to your plugin. Plugin parameters offer a way to receive user input without building a UI. They can be flexible, fast to develop, and convenient for users.

![SVG Inserter plugin accepting parameters](/assets/images/svg-inserter-62a23a624a1c40c97d86d0332f1d585e.png)

To support parameter input, there are a few changes you have to make:

1. Add a [parameter list](#parameter-list) to your plugin’s manifest.
2. Add a handler for the `figma.parameters.on('input')` event to provide [suggested parameter values](#suggestions).
3. Add a handler for the `figma.on('run')` event to [run](#run) your plugin with the selected values.

To get started building plugins with parameters, check out [these samples in the Figma Plugin Samples repository](https://github.com/figma/plugin-samples#examples-with-parameters).

## Parameter List[​](#parameter-list "Direct link to Parameter List")

To accept parameters, your plugin must define a list of parameters in the [manifest](/docs/plugins/manifest/#parameters). You can either define a single list of parameters on the manifest root, or you can create multiple [submenu items](/docs/plugins/manifest/#menu), each with its own unique parameter list. A parameter list is an array of parameters that looks something like this:

manifest.json

```
{  
  "name": "Plugin with parameters",  
  "api": "1.0.0",  
  "main": "code.js",  
  "editorType": [  
    "figma",  
    "figjam"  
  ],  
  "documentAccess": "dynamic-page",  
  "parameters": [  
      {  
        "name": "Icon name",  
        "key": "icon-name"  
      },  
      {  
        "name": "Size",  
        "key": "size",  
        "allowFreeform": true  
      },  
      {  
        "name": "Color",  
        "key": "color",  
        "allowFreeform": true,  
        "optional": true  
      }  
  ]  
}
```

Each parameter requires a `name` and a `key`. The `name` is the text that appears in the UI and the `key` is used to uniquely identify the value for that parameter when your plugin is run.

Parameters can optionally set `allowFreeform` and `optional` flags. Freeform parameters (`allowFreeform == true`) allow any value to be entered, not just those suggested by the plugin. Optional parameters are skippable, meaning their values may be undefined when your plugin runs. In the UI, parameters are entered in the order they appear in the manifest, with optional parameters coming last. If optional parameters aren’t last in the manifest, we will throw an error.

By default, any time that a parameter-enabled command is triggered by the user, the parameter entry UI is launched and the user is asked to provide parameter values. This includes all contexts from which a plugin can be run: quick actions, context menus, the desktop app menu, etc.

However, you can make your plugin runnable without parameters by setting [`"parameterOnly": false`](/docs/plugins/manifest/#parameteronly) in the manifest for the command. For plugins or commands with `"parameterOnly": false`, users will only be able to provide parameters by pressing tab in quick actions. All other menus will launch your plugin without parameters. It is the responsibility of the plugin to get the necessary information from the user, usually using [`showUI`](/docs/plugins/api/properties/figma-showui/). This can be useful if you want to allow advanced users to quickly enter parameter values, while allowing other users to use a richer UI created by your plugin.

## Suggestions[​](#suggestions "Direct link to Suggestions")

Your plugin can dynamically provide suggestions as a user types in values for parameters. To enable this, your plugin is launched in “query mode,” during which it can read from the document, and make [network requests](/docs/plugins/making-network-requests/), but can’t make changes to the document or display visible UI. The [Capital sample plugin](https://github.com/figma/plugin-samples/tree/master/capital) demonstrates how to make network requests in a plugin that accepts parameters. For a more advanced example, refer to the [Trivia sample plugin](https://github.com/figma/plugin-samples/tree/master/trivia).

Users enter parameters one at a time in quick actions. Every time the user makes a change, we clear out old suggestions and trigger an event in the plugin. Plugins provide updated suggestions by handling the [`figma.parameters.on('input')`](/docs/plugins/api/figma-parameters/#on) event and calling [`setSuggestions`](/docs/plugins/api/figma-parameters/#setsuggestions) on the object passed in.

Suggestions represent valid parameter values. For freeform parameters, any value can be entered, so these suggestions enable convenient autocompletions. But, for all other parameters, these suggestions are the only valid values accepted for that parameter. Users can’t progress to the next parameter until they select one of these valid values.

Here is an example of what this looks like in practice:

Filtering suggestions

```
figma.parameters.on(  
  'input',  
  ({ parameters, key, query, result }: ParameterInputEvent) => {  
    switch (key) {  
      case 'icon':  
        const icons = [  
          'menu',  
          'settings',  
          'search',  
          'angle',  
          'checkbox',  
          'logout'  
        ]  
        result.setSuggestions(icons.filter(s => s.includes(query)))  
        break  
      ...  
      default:  
        return  
    }  
  }  
)
```

You have a lot of flexibility in the suggestions you choose to present. You can filter suggestions using the simple function shown above, or you could implement a more complex ‘fuzzy’ search, among other options.

The [`setSuggestions`](/docs/plugins/api/figma-parameters/#setsuggestions) API also allows you to display icons and associate hidden metadata with each suggestion. With metadata, you can pass around useful information like node IDs while still displaying user friendly suggestion text.

For more details, see [`setSuggestions`](/docs/plugins/api/figma-parameters/#setsuggestions) and [`setError`](/docs/plugins/api/figma-parameters/#seterror).

## Run[​](#run "Direct link to Run")

After all parameters have been entered, your plugin is run via the [`figma.on('run')`](/docs/plugins/api/properties/figma-on/#run) event. The selected parameter values are passed as an input to the run event handler. This event is called on all plugin runs, not just plugins with parameters, making it a convenient place to put all of your top level plugin code.

Run plugin with parameters

```
figma.on('run', ({ command, parameters }: RunEvent) => {  
  switch (command) {  
    case "resize":  
      handleResize(parameters.width, parameters.height)  
      break  
    case "move":  
      handleMove(parameters.dx, parameters.dy)  
      break  
    ...  
  }  
})
```

The `'run'` event also signals the end of “query mode”, which means you can start using all normal plugin APIs. It is possible that your plugin will be run with parameters, but never enter “query mode”. This can happen, for example, when using the “Run last plugin” shortcut.

The `'run'` event is always fired when a plugin is first launched, even when the user has not used the parameters UI. If the user did not use the parameter UI the `parameters` property is set to `undefined` rather than a map of parameter values.

This is especially useful for plugins and submenu items that contain `"parameterOnly": false`. For such plugins, you can always use the `'run'` event as an entry point to your plugin logic, and then check if `parameters === undefined` to check if the parameter UI was used.

- [Parameter List](#parameter-list)
- [Suggestions](#suggestions)
- [Run](#run)