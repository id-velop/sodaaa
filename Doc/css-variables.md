# CSS Variables and Theming

**Source:** https://developers.figma.com/docs/plugins/css-variables/

---

On this page

In order to support light and dark themes in your plugin, you will need to update your call to `figma.showUI()` and replace applicable, hard-coded color values in your plugin CSS with the CSS variables shown here.

## API Details[​](#api-details "Direct link to API Details")

For your plugin UI to get access to the CSS variables, you will need to call `figma.showUI()` with the new themeColors option:

```
figma.showUI(__html__, { themeColors: true, /* other options */ })
```

This will lead to the following changes to the plugin `<iframe>`:

- A `figma-light` or `figma-dark` class will be added to the `<html>` element in the iframe content
- A `<style id="figma-style">` element will be added to the iframe content containing a set of CSS variables (`--figma-color-bg`, `--figma-color-text`, etc…)

You can then use these variables in your CSS using the `var()` function. For example:

Using CSS variables

```
body {  
  background-color: var(--figma-color-bg);  
  color: var(--figma-color-text);  
}
```

You can also use the `figma-light` or `figma-dark` classes on the `<html>` element to supply your own theme-specific colors:

Customize light and dark classes

```
.figma-light body {  
  background-color: white;  
  color: blue;  
}  
  
.figma-dark body {  
  background-color: black;  
  color: red;  
}
```

If the user changes their theme preference in Figma Design, the CSS variables in the plugin iframe will dynamically update with new color values.

Please note a couple of caveats with using this new theme API:

- FigJam currently does not support dark mode. **If your plugin supports FigJam, you will have access to CSS variables corresponding to a FigJam-specific light mode**. These variables will be named exactly the same as the ones in Figma, but have different colors. For example, FigJam has a purple accent color whereas Figma has a blue accent color.
- If your plugin UI navigates to another URL, do not use the new `themeColors` option in `figma.showUI()`.

caution

Theme support for externally-hosted plugin UIs is not available at this time.

## Semantic Color Tokens[​](#semantic-color-tokens "Direct link to Semantic Color Tokens")

The tokens we are exposing via the Plugin API use the same underlying schema that powers Dark Mode at Figma. At first glance, this may seem like a ton of tokens (and it is), but we’re really excited to be sharing our system in its purest form with our Plugin developers!

If you learn best by doing and want to explore our semantic tokens in an interactive way, install the [Theme Colors Inspector](https://www.figma.com/community/plugin/1104533141442501061) plugin.

### Tokens Overview[​](#tokens-overview "Direct link to Tokens Overview")

We’ve defined a naming schema that creates predictable behavior across our tokens. For example, additional hierarchy can be created by adding `-secondary` or `-tertiary` to any text, icon, or background color, and interactive behavior can be specified by adding `-hover`, `-selected`, `-disabled`.

Our tokens follow a format of

Semantic color token format

```
--figma-color-{type}-{color role}-{prominence}-{interaction}
```

#### Type `(required)`[​](#type-required "Direct link to type-required")

This is the only required parameter, and specifies *what is the type of thing we want to color*? Our four types are **`bg`**, **`text`**, **`icon`**, and **`border`**.

*Example variables*  
`--figma-color-`**`bg`**  
`--figma-color-`**`text`**

#### Color Role `(optional)`[​](#color-role-optional "Direct link to color-role-optional")

Colors in our UI have specific meaning, so we’ve organized hues around how they are used, rather than the hue itself. For example, our default accent color is `-brand`, which may shift between blue and purple dependent on context.

*Example variables*  
`--figma-color-bg-`**`brand`**  
`--figma-color-icon-`**`danger`**

#### Prominence `(optional)`[​](#prominence-optional "Direct link to prominence-optional")

To create hierarchy and adjust visual emphasis, bg, text, and icon support `-secondary` and `-tertiary`. Similarly, borders come in two flavors — “default” for a border that acts as a divider, and `-strong` for a border used as the outline around a more prominent element (like a text input).

*Example variables*  
`--figma-color-text-`**`secondary`**  
`--figma-color-border-`**`strong`**

#### Interaction `(optional)`[​](#interaction-optional "Direct link to interaction-optional")

Some tokens support `-hover` and `-pressed` modifiers for interaction states.

*Example variables*  
`--figma-color-bg-brand-`**`pressed`**  
`--figma-color-icon-danger-`**`hover`**

### Color Roles[​](#color-roles "Direct link to Color Roles")

To create consistent meaning around our colors, we’ve organized hues by color role. These modifiers can be added to any type of color token — so for example, “red text” would be `--figma-color-text-danger`, and a “red background” would be `--figma-color-bg-danger`.

**`-brand`**
Our default accent color, which may shift between blue in Figma design and purple in FigJam.

**`-selected`**
Light blue or purple fills for the backgrounds of a selected element, or a border around a focused element.

**`-disabled`**
Light grey fills for inactive text, buttons, and inputs that a user cannot interact with.

**`-component`**
Purple text, icons, and backgrounds for component layer names, as well as features connected to components (like variants)

**`-danger`**
Red indicators when there is an error, or something a user should urgently attend to.

**`-warning`**
Yellow indicators used to warn a user about a potential problem, such as a missing font.

**`-success`**
Green indicators used for confirmation, approval, or when a task has completed.

**`-inverse`**
Dark grey / white fills used for elements that need to be “the opposite of the background color”.

## Frequently Used Tokens[​](#frequently-used-tokens "Direct link to Frequently Used Tokens")

While we have many tokens, there are a handful that are very frequently used, and worth knowing about.

#### Text Colors[​](#text-colors "Direct link to Text Colors")

**`--figma-color-text`**
Our default text color for most titles, tabs, and body text.

**`--figma-color-text-secondary`**
Our secondary text color for inactive tabs, labels, timestamps, and other text that needs to be “lighter” in order to create hierarchy.

**`--figma-color-text-tertiary`**
Our tertiary text color primarily used for placeholder text (for example in a search input), or for hierarchy below secondary text.

**`--figma-color-text-disabled`**
Truly disabled text that a user cannot interact with.

**`--figma-color-text-onbrand`**
White text used against a Blue / Purple background (for example, the text in our “Share” button).

**`--figma-color-text-brand`**
Blue or purple text used for things like links.

**`--figma-color-text-danger`**
Red text used to alert users about an error.

**`--figma-color-text-warning`**
Yellow text used to warn users about a potential problem.

**`--figma-color-text-success`**
Green text used for confirmation, and approval.

#### Background Colors[​](#background-colors "Direct link to Background Colors")

**`--figma-color-bg`**
Our default white / light grey background fill for most views (like our file browser, editor sidebars, panels, windows, and modals).

**`--figma-color-bg-secondary`**
A light grey fill used to create sections on top of a background, as well as for some inputs.

#### Common Hues[​](#common-hues "Direct link to Common Hues")

**`--figma-color-bg-brand`**
Blue or purple fill colors for backgrounds like a blue primary button.

**`--figma-color-bg-danger`**
Red fill color behind destructive buttons, and error banners.

**`--figma-color-bg-warning`**
Yellow fill color for warning banners

**`--figma-color-bg-success`**
Green fill color for confirmation banners.

#### Borders[​](#borders "Direct link to Borders")

**`--figma-color-border`**
Our default border color for dividers between sections.

**`--figma-color-border-strong`**
The darker border color we use for secondary outline buttons.

**`--figma-color-border-selected`**
The blue or purple border color we use for focused / selected inputs.

**`--figma-color-border-danger-strong`**
The red border color we use around inputs that have an error.

## Default Token Values[​](#default-token-values "Direct link to Default Token Values")

if you are interested in accessing the default values for these tokens, you can get at them by accessing the `<style id="figma-style"/>` tag via JavaScript inside your UI code.

Access default values

```
const styleTagDefinitions = document.getElementById("figma-style").innerHTML;
```

Using this, you can run this directly in your console to log the defaults for the current theme.

Logging defaults of current theme

```
figma.showUI(  
  "<script>console.log(document.getElementById('figma-style').innerHTML)</script>",  
  { themeColors: true }  
);
```

## List of All Available Color Tokens[​](#list-of-all-available-color-tokens "Direct link to List of All Available Color Tokens")

Figma Design: Light

Figma Design: Dark

FigJam: Light (Beta)

- --figma-color-bg#ffffff
- --figma-color-bg-brand#0d99ff
- --figma-color-bg-brand-hover#007be5
- --figma-color-bg-brand-pressed#007be5
- --figma-color-bg-brand-secondary#0768cf
- --figma-color-bg-brand-tertiary#e5f4ff
- --figma-color-bg-component#9747ff
- --figma-color-bg-component-hover#8638e5
- --figma-color-bg-component-pressed#8638e5
- --figma-color-bg-component-secondary#7c2bda
- --figma-color-bg-component-tertiary#f1e5ff
- --figma-color-bg-danger#f24822
- --figma-color-bg-danger-hover#dc3412
- --figma-color-bg-danger-pressed#dc3412
- --figma-color-bg-danger-secondary#bd2915
- --figma-color-bg-danger-tertiary#ffe2e0
- --figma-color-bg-disabled#d9d9d9
- --figma-color-bg-disabled-secondary#b3b3b3
- --figma-color-bg-hover#f5f5f5
- --figma-color-bg-inverse#2c2c2c
- --figma-color-bg-onselected#bde3ff
- --figma-color-bg-onselected-hover#bde3ff
- --figma-color-bg-onselected-pressed#bde3ff
- --figma-color-bg-pressed#f5f5f5
- --figma-color-bg-secondary#f5f5f5
- --figma-color-bg-selected#e5f4ff
- --figma-color-bg-selected-hover#bde3ff
- --figma-color-bg-selected-pressed#bde3ff
- --figma-color-bg-selected-secondary#f2f9ff
- --figma-color-bg-selected-strong#0d99ff
- --figma-color-bg-selected-tertiary#f2f9ff
- --figma-color-bg-success#14ae5c
- --figma-color-bg-success-hover#009951
- --figma-color-bg-success-pressed#009951
- --figma-color-bg-success-secondary#008043
- --figma-color-bg-success-tertiary#cff7d3
- --figma-color-bg-tertiary#e6e6e6
- --figma-color-bg-warning#ffcd29
- --figma-color-bg-warning-hover#ffc21a
- --figma-color-bg-warning-pressed#ffc21a
- --figma-color-bg-warning-secondary#fab815
- --figma-color-bg-warning-tertiary#fff1c2
- --figma-color-border#e6e6e6
- --figma-color-border-brand#bde3ff
- --figma-color-border-brand-strong#007be5
- --figma-color-border-component#e4ccff
- --figma-color-border-component-hover#9747ff
- --figma-color-border-component-strong#8638e5
- --figma-color-border-danger#ffc7c2
- --figma-color-border-danger-strong#dc3412
- --figma-color-border-disabled#e6e6e6
- --figma-color-border-disabled-strong#0000004d
- --figma-color-border-onbrand#007be5
- --figma-color-border-onbrand-strong#ffffff
- --figma-color-border-oncomponent#8638e5
- --figma-color-border-oncomponent-strong#ffffff
- --figma-color-border-ondanger#dc3412
- --figma-color-border-ondanger-strong#ffffff
- --figma-color-border-onselected#bde3ff
- --figma-color-border-onselected-strong#000000e5
- --figma-color-border-onsuccess#009951
- --figma-color-border-onsuccess-strong#ffffff
- --figma-color-border-onwarning#fab815
- --figma-color-border-onwarning-strong#000000e5
- --figma-color-border-selected#0d99ff
- --figma-color-border-selected-strong#007be5
- --figma-color-border-strong#2c2c2c
- --figma-color-border-success#aff4c6
- --figma-color-border-success-strong#009951
- --figma-color-border-warning#ffe8a3
- --figma-color-border-warning-strong#b86200
- --figma-color-icon#000000e5
- --figma-color-icon-brand#007be5
- --figma-color-icon-brand-pressed#0768cf
- --figma-color-icon-brand-secondary#80caff
- --figma-color-icon-brand-tertiary#bde3ff
- --figma-color-icon-component#8638e5
- --figma-color-icon-component-pressed#7c2bda
- --figma-color-icon-component-secondary#c5b2dc
- --figma-color-icon-component-tertiary#c5b2dc
- --figma-color-icon-danger#f24822
- --figma-color-icon-danger-hover#bd2915
- --figma-color-icon-danger-pressed#bd2915
- --figma-color-icon-danger-secondary#f24822
- --figma-color-icon-danger-secondary-hover#f24822
- --figma-color-icon-danger-tertiary#f24822
- --figma-color-icon-disabled#0000004d
- --figma-color-icon-hover#000000e5
- --figma-color-icon-onbrand#ffffff
- --figma-color-icon-onbrand-secondary#ffffffcc
- --figma-color-icon-onbrand-tertiary#ffffff66
- --figma-color-icon-oncomponent#ffffff
- --figma-color-icon-oncomponent-secondary#ffffffcc
- --figma-color-icon-oncomponent-tertiary#ffffff66
- --figma-color-icon-ondanger#ffffff
- --figma-color-icon-ondanger-secondary#ffffffcc
- --figma-color-icon-ondanger-tertiary#ffffff66
- --figma-color-icon-ondisabled#ffffff
- --figma-color-icon-oninverse#ffffffe5
- --figma-color-icon-onselected#000000e5
- --figma-color-icon-onselected-secondary#00000080
- --figma-color-icon-onselected-strong#ffffff
- --figma-color-icon-onselected-tertiary#0000004d
- --figma-color-icon-onsuccess#ffffff
- --figma-color-icon-onsuccess-secondary#ffffffcc
- --figma-color-icon-onsuccess-tertiary#ffffff66
- --figma-color-icon-onwarning#000000e5
- --figma-color-icon-onwarning-secondary#ffffffcc
- --figma-color-icon-onwarning-tertiary#ffffff66
- --figma-color-icon-pressed#007be5
- --figma-color-icon-secondary#00000080
- --figma-color-icon-secondary-hover#000000e5
- --figma-color-icon-selected#007be5
- --figma-color-icon-selected-secondary#007be5
- --figma-color-icon-selected-tertiary#007be5
- --figma-color-icon-success#14ae5c
- --figma-color-icon-success-pressed#008043
- --figma-color-icon-success-secondary#14ae5c
- --figma-color-icon-success-tertiary#14ae5c
- --figma-color-icon-tertiary#0000004d
- --figma-color-icon-tertiary-hover#000000e5
- --figma-color-icon-warning#ffcd29
- --figma-color-icon-warning-pressed#b86200
- --figma-color-icon-warning-secondary#ffcd29
- --figma-color-icon-warning-tertiary#ffcd29
- --figma-color-text#000000e5
- --figma-color-text-brand#007be5
- --figma-color-text-brand-secondary#007be5
- --figma-color-text-brand-tertiary#007be5
- --figma-color-text-component#8638e5
- --figma-color-text-component-pressed#7c2bda
- --figma-color-text-component-secondary#c5b2dc
- --figma-color-text-component-tertiary#c5b2dc
- --figma-color-text-danger#dc3412
- --figma-color-text-danger-secondary#dc3412
- --figma-color-text-danger-tertiary#dc3412
- --figma-color-text-disabled#0000004d
- --figma-color-text-hover#000000e5
- --figma-color-text-onbrand#ffffff
- --figma-color-text-onbrand-secondary#ffffffcc
- --figma-color-text-onbrand-tertiary#ffffff66
- --figma-color-text-oncomponent#ffffff
- --figma-color-text-oncomponent-secondary#ffffffcc
- --figma-color-text-oncomponent-tertiary#ffffff66
- --figma-color-text-ondanger#ffffff
- --figma-color-text-ondanger-secondary#ffffffcc
- --figma-color-text-ondanger-tertiary#ffffff66
- --figma-color-text-ondisabled#ffffff
- --figma-color-text-oninverse#ffffffe5
- --figma-color-text-onselected#000000e5
- --figma-color-text-onselected-secondary#00000080
- --figma-color-text-onselected-strong#ffffff
- --figma-color-text-onselected-tertiary#0000004d
- --figma-color-text-onsuccess#ffffff
- --figma-color-text-onsuccess-secondary#ffffffcc
- --figma-color-text-onsuccess-tertiary#ffffff66
- --figma-color-text-onwarning#000000e5
- --figma-color-text-onwarning-secondary#00000080
- --figma-color-text-onwarning-tertiary#0000004d
- --figma-color-text-secondary#00000080
- --figma-color-text-secondary-hover#000000e5
- --figma-color-text-selected#007be5
- --figma-color-text-selected-secondary#007be5
- --figma-color-text-selected-tertiary#007be5
- --figma-color-text-success#009951
- --figma-color-text-success-secondary#009951
- --figma-color-text-success-tertiary#009951
- --figma-color-text-tertiary#0000004d
- --figma-color-text-tertiary-hover#000000e5
- --figma-color-text-warning#b86200
- --figma-color-text-warning-secondary#b86200
- --figma-color-text-warning-tertiary#b86200

- [API Details](#api-details)
- [Semantic Color Tokens](#semantic-color-tokens)
  - [Tokens Overview](#tokens-overview)
  - [Color Roles](#color-roles)
- [Frequently Used Tokens](#frequently-used-tokens)
- [Default Token Values](#default-token-values)
- [List of All Available Color Tokens](#list-of-all-available-color-tokens)