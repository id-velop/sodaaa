# Working with Rich Text

**Source:** https://developers.figma.com/docs/plugins/working-with-rich-text/

---

On this page

note

**Note:** This guide covers rich text support for components and annotations. If you're looking for information about text, text nodes, and fonts in the Plugin API, try [Working with Text](/docs/plugins/working-with-text/).

When working with annotations or components, your plugin can read and write annotation labels and component descriptions with rich text using a subset of the standard Markdown format.

## Markdown in the Plugin API[​](#markdown-in-the-plugin-api "Direct link to Markdown in the Plugin API")

The Plugin API supports the following subset of Markdown formatting:

| Formatting | Markdown |
| --- | --- |
| Paragraph | `\n` |
| Numbered list | `1.`, `2.`, `3.` |
| Unordered list | `-`, `*` |
| Heading | `##` |
| Bold | `**` or `__` |
| Italic | `*` or `_` |
| Strikethrough | `~~` |
| Link | `[link-string](link-url)` |
| Monospace/inline code | ``example code`` |
| Code block | ````example code```` |

There are some small limitations when using Markdown with the Plugin API.

- Markdown formatting can't be used inside of code blocks.
- Only second-level headings are supported. If you use `#` to set a first-level heading, it's converted to heading level 2 in Dev Mode.
- In a code block, spaces at the start of a line are removed.

The following example shows an annotation in Dev Mode that uses rich text, and the corresponding Markdown.

![Example of a markdown-formatted annotation in Dev Mode](/assets/images/example-markdown-f50f7a28eb1de99be2797b60223b20a7.png)

Markdown formats can vary widely, so we’ve also provided a helper function called `normalizeMarkdown`. We call this function implicitly before we set `labelMarkdown` or `descriptionMarkdown`, so it’s not required to call this on markdown you pass to either field. However, if you want a better understanding of exactly what markdown will be rendered, you can use this function. It is available within `figma.util`.

```
const component = getComponent();  
  
const md = buildMarkdown();  
const normalized = figma.util.normalizeMarkdown(md);  
component.descriptionMarkdown = normalized; // this is fine  
component.descriptionMarkdown = md; // this does the same thing
```

## Annotations[​](#annotations "Direct link to Annotations")

[Annotations](/docs/plugins/api/Annotation/) store formatted text in the `labelMarkdown` field of the annotation.

To get the formatted text content of a node's annotation, read the value of `labelMarkdown`:

```
const node = figma.currentPage.selection[0];  
const markdown = node.annotations[0].labelMarkdown;
```

To add formatted text to a node's annotation, set `labelMarkdown` to a Markdown string:

```
if (figma.editorType === "dev") {  
  const selectedNode = figma.currentPage.selection[0];  
  const markdown = `We should use **--err-red** for 500s.  
See the [color examples](https://example.com) for more info.  
Don't use:  
- deprecated \`--err-salmon\`  
- internal tokens`;  
  
  selectedNode.annotations = [  
    {  
      labelMarkdown: markdown,  
    },  
  ];  
}
```

## Component descriptions[​](#component-descriptions "Direct link to Component descriptions")

[ComponentNodes](/docs/plugins/api/ComponentNode/#publishable-properties) store formatted text in the `descriptionMarkdown` field of the annotation.

To get the formatted text content of a component's description, read the value of `descriptionMarkdown`:

```
const components = figma.currentPage.findAllWithCriteria({  
    types: ["COMPONENT"],  
});  
  
components.forEach((component) => {  
  console.log(component.descriptionMarkdown);  
});
```

To add formatted text to a component's description, set `descriptionMarkdown` to a Markdown string:

```
const components = figma.currentPage.findAllWithCriteria({  
    types: ["COMPONENT"],  
});  
  
components.forEach((component) => {  
  component.descriptionMarkdown = "This is a **component**";  
});
```

- [Markdown in the Plugin API](#markdown-in-the-plugin-api)
- [Annotations](#annotations)
- [Component descriptions](#component-descriptions)