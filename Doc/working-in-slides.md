# Working in Slides

**Source:** https://developers.figma.com/docs/plugins/working-in-slides/

---

On this page

## Figma Slides[​](#figma-slides "Direct link to Figma Slides")

[Figma Slides](https://help.figma.com/hc/en-us/articles/24170630629911-Explore-Figma-Slides) is the first presentation tool built for designers and their teammates. No matter your role or level of design experience, Figma Slides makes it easy to create beautiful and effective slide decks. Use Figma Slides to build decks for:

- **Design reviews:** Share ideas and gather feedback using interactive polls and alignment scales
- **Startup pitches:** Use clickable prototypes to build excitement with potential investors
- **Class projects:** Create slide decks together using collaborative tools like audio and cursor chat
- **Conference talks:** Stay on-message with built-in presenter notes
  and more!

## Getting started with Plugins in Figma Slides[​](#getting-started-with-plugins-in-figma-slides "Direct link to Getting started with Plugins in Figma Slides")

To create a new plugin for Figma Slides, follow the [Plugin Quickstart Guide](/docs/plugins/plugin-quickstart-guide/) to create a plugin, then come back to this guide.

To update an existing plugin to support Figma Slides, [follow the steps below](#update-an-existing-plugin-to-support-slides).

### Update an existing plugin to support Slides[​](#update-an-existing-plugin-to-support-slides "Direct link to Update an existing plugin to support Slides")

To enable plugins for Slides, add `slides` to the `editorType` field in your plugin's manifest:

```
{  
  ...  
  "editorType": ["slides"] // or ["figma", "slides", ...]  
}
```

And, run `npm update` in the terminal to make sure you have the latest plugin typings for Slides:

```
npm update
```

## Key differences between plugins in Slides and other plugins[​](#key-differences-between-plugins-in-slides-and-other-plugins "Direct link to Key differences between plugins in Slides and other plugins")

Plugins in Slides have some key differences when compared to other plugins:

### New Node Types[​](#new-node-types "Direct link to New Node Types")

Figma Slides introduces four node types: [SLIDE](#slide), [SLIDE\_ROW](#slide_row), [SLIDE\_GRID](#slide_grid), and [INTERACTIVE\_SLIDE\_ELEMENT](#interactive_slide_element).

#### SLIDE[​](#slide "Direct link to SLIDE")

`SLIDE`s are the primary building blocks of Figma Slides, with a fixed size of 1920x1080.

```
interface SlideNode extends  
  BaseNodeMixin, SceneNodeMixin, ChildrenMixin,  
  ContainerMixin, GeometryMixin, CornerMixin,  
  RectangleCornerMixin, BlendMixin, ConstraintMixin,  
  LayoutMixin, ExportMixin, FramePrototypingMixin,  
  ReactionMixin {  
    readonly type: 'SLIDE'  
    clone(): SlideNode  
}
```

To create a slide, use `createSlide()`:

```
const mySlide = figma.createSlide()
```

#### SLIDE\_ROW[​](#slide_row "Direct link to SLIDE_ROW")

`SLIDE_ROW`s are containers for slides and must be children of the `SLIDE_GRID`.

```
interface SlideRowNode extends  
  BaseNodeMixin, SceneNodeMixin, ChildrenMixin {  
  readonly type: 'SLIDE_ROW'  
  
  children: Array<SlideNode>  
  appendChild(child: SlideNode): void  
  insertChild(index: number, child: SlideNode): void  
}
```

To create a Slide Row, use `createSlideRow()`:

```
const mySlideRow = figma.createSlideRow()
```

#### SLIDE\_GRID[​](#slide_grid "Direct link to SLIDE_GRID")

`SLIDE_GRID` is the top-level container for slides. It cannot be selected or edited in the UI but can be manipulated through its children (instances of `SLIDE_ROW`) via the Plugin API.

```
interface SlideGridNode extends  
  BaseNodeMixin, SceneNodeMixin, ChildrenMixin {  
  readonly type: 'SLIDE_GRID'  
  
  children: Array<SlideRowNode>  
  appendChild(child: SlideRowNode): void  
  insertChild(index: number, child: SlideRowNode): void  
}
```

#### INTERACTIVE\_SLIDE\_ELEMENT[​](#interactive_slide_element "Direct link to INTERACTIVE_SLIDE_ELEMENT")

These elements include interactive types like `POLL`, `EMBED`, `FACEPILE`, `ALIGNMENT`, and `YOUTUBE`. They cannot be created via the Plugin API. However, their positions can be read and manipulated.

```
interface SlideNode extends BaseNodeMixin, SceneNodeMixin {  
  readonly type: 'INTERACTIVE_SLIDE_ELEMENT'  
  readonly interactiveSlideElementType: 'POLL' | 'EMBED' | 'FACEPILE' | 'ALIGNMENT' | 'YOUTUBE'  
}
```

### Additional Features[​](#additional-features "Direct link to Additional Features")

#### Grid View and Single Slide View[​](#grid-view-and-single-slide-view "Direct link to Grid View and Single Slide View")

Figma Slides allows toggling between grid view and single slide view. Access or set the mode using `viewport.slidesMode`:

```
const mode: 'grid' |  'single-slide' = figma.viewport.slidesMode  
figma.viewport.slidesMode = 'grid' // or 'single-slide'
```

#### Focused Slide ID[​](#focused-slide-id "Direct link to Focused Slide ID")

When in single slide view, access the focused slide using `currentPage.focusedSlide`:

```
const focusedSlide: SlideNode | null = figma.currentPage.focusedSlide  
figma.currentPage.focusedSlide = slideNode
```

#### Reading and Updating the Slide Grid[​](#reading-and-updating-the-slide-grid "Direct link to Reading and Updating the Slide Grid")

The slide grid is a 2D representation of slides within a deck. Access the grid using `getSlideGrid()`:

```
const grid = figma.getSlideGrid()
```

To reorder slides, use `setSlideGrid()`:

```
figma.setSlideGrid([...rest, firstRow])
```

### Slide Transitions[​](#slide-transitions "Direct link to Slide Transitions")

Define slide transitions with a specific style, duration, and curve:

```
{  
  style: 'NONE' | 'DISSOLVE' | 'SLIDE_FROM_LEFT', // etc.  
  duration: number, // 0.01 - 10 seconds  
  curve: 'EASE_IN' | 'EASE_OUT' | 'LINEAR', // etc.  
  timing: {  
    type: 'ON_CLICK' | 'AFTER_DELAY',  
    delay?: number // 0-30 seconds  
  },  
}
```

Read or update transitions using `getSlideTransition()` and `setSlideTransition()`:

```
slideNode.getSlideTransition()  
slideNode.setSlideTransition(slideTransition: SlideTransition)
```

The following transition `style`s are supported:

```
  'NONE' |  
  'DISSOLVE' |  
  'SLIDE_FROM_LEFT' |  
  'SLIDE_FROM_RIGHT' |  
  'SLIDE_FROM_TOP' |  
  'SLIDE_FROM_BOTTOM' |  
  'PUSH_FROM_LEFT' |  
  'PUSH_FROM_RIGHT' |  
  'PUSH_FROM_TOP' |  
  'PUSH_FROM_BOTTOM' |  
  'MOVE_FROM_LEFT' |  
  'MOVE_FROM_RIGHT' |  
  'MOVE_FROM_TOP' |  
  'MOVE_FROM_BOTTOM' |  
  'SLIDE_OUT_TO_LEFT' |  
  'SLIDE_OUT_TO_RIGHT' |  
  'SLIDE_OUT_TO_TOP' |  
  'SLIDE_OUT_TO_BOTTOM' |  
  'MOVE_OUT_TO_LEFT' |  
  'MOVE_OUT_TO_RIGHT' |  
  'MOVE_OUT_TO_TOP' |  
  'MOVE_OUT_TO_BOTTOM' |  
  'SMART_ANIMATE'
```

The following transition `curve`s are supported:

```
  'LINEAR' |  
  'EASE_IN' |  
  'EASE_OUT' |  
  'EASE_IN_AND_OUT' |  
  'EASE_IN_BACK' |  
  'EASE_OUT_BACK' |  
  'EASE_IN_AND_OUT_BACK'
```

### Unsupported and Supported Features[​](#unsupported-and-supported-features "Direct link to Unsupported and Supported Features")

#### Unsupported in Slides[​](#unsupported-in-slides "Direct link to Unsupported in Slides")

Slides does not support:

- Components
- Styles
- Variables
- Libraries

Methods unavailable in Slides:

- `createConnector()`
- `createCodeBlock()`
- `createSection()`
- `createLinkPreviewAsync()`
- `setFileThumbnailNodeAsync()`

#### Supported in Slides but not in Design[​](#supported-in-slides-but-not-in-design "Direct link to Supported in Slides but not in Design")

Slides supports:

- `createShapeWithText()`
- `createTable()`
- `createGif()`

### Additional Notes[​](#additional-notes "Direct link to Additional Notes")

When updating existing plugins for Figma Slides:

- Adjust conditions checking for `node.type === 'FRAME'` to also check for `node.type === 'SLIDE'`.
- Use `figma.getSlideGrid().flat().forEach(...)` for slide operations.

- [Figma Slides](#figma-slides)
- [Getting started with Plugins in Figma Slides](#getting-started-with-plugins-in-figma-slides)
  - [Update an existing plugin to support Slides](#update-an-existing-plugin-to-support-slides)
- [Key differences between plugins in Slides and other plugins](#key-differences-between-plugins-in-slides-and-other-plugins)
  - [New Node Types](#new-node-types)
  - [Additional Features](#additional-features)
  - [Slide Transitions](#slide-transitions)
  - [Unsupported and Supported Features](#unsupported-and-supported-features)
  - [Additional Notes](#additional-notes)