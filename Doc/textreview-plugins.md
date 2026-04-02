# Text Review Plugins

**Source:** https://developers.figma.com/docs/plugins/textreview-plugins/

---

On this page

A text review plugin is a plugin that either replaces or supplements the native spellcheck functionality inside of Figma or FigJam. Here are a few example use cases of text review plugins:

- Checking for spelling mistakes using a REST API
- Checking for spelling mistakes in languages that Figma doesn't support
- Checking for grammar mistakes
- Checking for style guide violations
- Checking for branding violations

When in text edit mode, a plugin will be notified of changes to text and can mark ranges of text that are incorrect. The plugin can also offer suggestions that should be returned when someone right clicks on a misspelled region.

![Image showing a list of text review suggestions](https://static.figma.com/uploads/bee7e532617240712ea19724725d51b3d0ea4c75)

Plugins that have text review capabilities have a unique feature that other plugins don't: they are started automatically anytime a user starts editing text in the document.

Considerations about [how pages are loaded](/docs/plugins/accessing-document/) in the document still apply to text review plugins. However, as text review plugins act on the user's current page, it's unlikely you'll need to worry about loading additional pages.

info

Note: When in text edit mode, a plugin can only read from the document, it can't edit it.

## Getting started[​](#getting-started "Direct link to Getting started")

A plugin that can run in text review mode must have `"textreview"` listed in its list of capabilities. This lets Figma know that a user can enable the plugin as a text review plugin.

```
{  
  "name": "MyPlugin",  
  "id": "{your id here}",  
  "api": "1.0.0",  
  "main": "code.js",  
  "ui": "ui.html",  
  "capabilities": ["textreview"]  
}
```

## A quick example[​](#a-quick-example "Direct link to A quick example")

Below is a fully featured text review plugin implementation that highlights any occurrences of the word "yeet" in a string and suggests that it be replaced with the word "throw":

Yeet checking example

```
if (figma.command === 'textreview') {  
  // If the plugin is in text review mode (i.e. the plugin was started  
  // automatically because the user started typing in a text node)  
  // set up a text review event that listens to a user's typing  
  // and looks for occurrences of "yeet".  
  figma.on('textreview', ({ text }) => {  
    if (!text) {  
      return []  
    }  
  
    const yeetRegex = /yeet/gi  
    const yeetMatches = Array.from(text.matchAll(yeetRegex))  
    return yeetMatches.map((match: any) => {  
      return {  
        start: match.index,  
        end: match.index + match[0].length,  
        suggestions: ['throw'],  
        color: 'GREEN',  
      }  
    })  
  })  
} else if (!figma.textreview?.isEnabled) {  
  // Otherwise, if the user started the plugin manually,  
  // request to be enabled as a text review plugin.  
  figma.textreview  
    ?.requestToBeEnabledAsync()  
    .then(() => {  
      console.log('I am now the default!')  
    })  
    .catch(() => {  
      console.log('User declined to enable this plugin.')  
    })  
    .finally(() => {  
      figma.closePlugin()  
    })  
} else {  
  // Otherwise the plugin is enabled so close immediately  
  figma.closePlugin()  
}
```

## Reviewing text[​](#reviewing-text "Direct link to Reviewing text")

To tell that you are in `textreview` mode the `figma.command` property will be set to `textreview`.

The text review events are fired periodically while a user is editing text in Figma. Note that Figma will automatically debounce calls to this function and invalidate stale results returned from it. These are registered by calling `figma.on('textreview')`. The callback you provide to this function will take a `TextReviewEvent` as a parameter and return either a `TextReviewRange[]` or `Promise<TextReviewRange[]>`.

```
type TextReviewEvent = {  
  text: string  
}  
  
type TextReviewRange = {  
  start: number  
  end: number  
  suggestions: string[]  
  color?: 'RED' | 'GREEN' | 'BLUE'  
}
```

Your plugin can mark ranges of the text, denoted by the `start` and `end` properties on the returned value, which will show a squiggle under the word to denote that there is an error. The color of the squiggle is determined by the `color` property which can be either one of `'RED'`, `'GREEN'`, or `'BLUE'`. If there are multiple overlapping ranges, either from your plugin or from Figma's built in spell check we will always show red squiggles first, then green ones, and finally blue ones.

You can also return an array of `suggestions` that will be shown as possible substitutions if a user right clicks on the marked word.

In the example below we take the text property from the text review event and highlight the entire range of text with a green squiggle which will suggest with 'Figma' and 'FigJam' if a user right clicks on the range:

Always green example

```
figma.on('textreview', ({ text }: TextReviewEvent): TextReviewRange[] => {  
  return [  
    {  
      start: 0,  
      end: text.length,  
      suggestions: ['Figma', 'FigJam'],  
      color: 'GREEN',  
    },  
  ]  
})
```

The callback to a `'textreview'` event can also return a `Promise` which is useful in cases where you want to call an external API to check text for grammatical errors. Note that a convenient way to use this is to pass `figma.on('textreview')` an async function:

Async example

```
figma.on('textreview', async ({ text }: TextReviewEvent): Promise<TextReviewRange[]> => {  
  const result = await fetchSomeSuggestionsFromTheInternet(text)  
  return processResults(result)  
})
```

## Letting a user enable your plugin for text review[​](#letting-a-user-enable-your-plugin-for-text-review "Direct link to Letting a user enable your plugin for text review")

The first interaction that a user will likely have with your plugin is from running it from the resources modal in Figma / FigJam. Often users will look to your plugin to enable and disable text review capabilities. We offer the `figma.textreview` suite of APIs for this purpose:

figma.textreview interface

```
interface TextReviewAPI {  
  requestToBeEnabledAsync(): Promise<void>  
  requestToBeDisabledAsync(): Promise<void>  
  readonly isEnabled: boolean  
}
```

[`TextReviewAPI`](/docs/plugins/api/figma-textreview/) is an interface that allows users to request to be enabled or disabled. To request to be enabled, call the requestToBeEnabledAsync() method. To request to be disabled, call the requestToBeDisabledAsync() method. The isEnabled property can be used to check if your plugin is enabled as a text review plugin for the user.

### `figma.textreview.requestToBeEnabledAsync()`[​](#figmatextreviewrequesttobeenabledasync "Direct link to figmatextreviewrequesttobeenabledasync")

This method will request your plugin to be enabled as a text review plugin for the user. A modal will pop up that will ask the user if they want to enable the plugin for text review:

![Dialog box that shows when you call the function](https://static.figma.com/uploads/ee33919763431eb2520074650fddfaa904c7e9c1)

The promise returned by the function will be resolved if the user presses accept in the dialog and will be rejected if the user cancels. Note that to prevent spam the promise will be auto rejected if the user cancels the request multiple times in a given plugin run.

### `figma.textreview.requestToBeDisabledAsync()`[​](#figmatextreviewrequesttobedisabledasync "Direct link to figmatextreviewrequesttobedisabledasync")

This method will disable the plugin as a text review plugin if it is enabled. The promise will resolve if it has been successfully been disabled and reject if it wasn’t enabled in the first place.

### `figma.textreview.isEnabled`[​](#figmatextreviewisenabled "Direct link to figmatextreviewisenabled")

This property is a readonly boolean that can be used to check if your plugin is enabled as a text review plugin for the user. It will be true if the plugin is enabled and false if the plugin is disabled.

- [Getting started](#getting-started)
- [A quick example](#a-quick-example)
- [Reviewing text](#reviewing-text)
- [Letting a user enable your plugin for text review](#letting-a-user-enable-your-plugin-for-text-review)
  - [`figma.textreview.requestToBeEnabledAsync()`](#figmatextreviewrequesttobeenabledasync)
  - [`figma.textreview.requestToBeDisabledAsync()`](#figmatextreviewrequesttobedisabledasync)
  - [`figma.textreview.isEnabled`](#figmatextreviewisenabled)