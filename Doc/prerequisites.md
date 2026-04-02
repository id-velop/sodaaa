# Prerequisites

**Source:** https://developers.figma.com/docs/plugins/prerequisites/

---

Figma plugins are lightweight web applications that extend the functionality of Figma’s products. Plugins are written in **JavaScript** and their UI is created with **HTML**.

The Figma Plugin API is intended to be easy to use. We do our best to abstract away the complexities of design tools and provide quality-of-life improvements such as a linter, TypeScript type definitions, and helper functions. However, at least some basic experience with JavaScript and HTML are necessary to build Figma plugins.

If you have no prior experience in programming or web development, there are many free education resources out there that can help you. Here are just a few of the popular ones:

- [The Odin Project](https://www.theodinproject.com/courses/web-development-101)
- [Codecademy: Web Development](https://www.codecademy.com/learn/paths/web-development)
- [Khan Academy: Intro to JS](https://www.khanacademy.org/computing/computer-programming/programming)

In addition, many of the tools used in modern web development will be useful for building more complex plugins. You don't need to learn these tools before starting to write plugins, but they will come in handy eventually. We opted to build on top of the most popular open-source tools in the web development community rather than to roll out our own proprietary solutions. Here are some examples of things you might end up using:

- An integrated development environment (IDE) such as [VS Code](https://code.visualstudio.com/), [Eclipse IDE](https://eclipseide.org/), or [IntelliJ IDEA](https://www.jetbrains.com/idea/): As a developer, IDEs can be a useful way to work across multiple files or sources and often provide extensions that make life easier. JavaScript and HTML are well-supported languages in most IDEs.
- [Asynchronous JavaScript](/docs/plugins/async-tasks/): Async operations are an important part of Figma plugins, such as for loading pages or requesting and using data that may take a brief time to return.
- TypeScript: Figma provides TypeScript types for the various methods, interfaces, and other features that are a part of the Plugin API.
- Webpack, to [bundle](/docs/plugins/libraries-and-bundling/) large multi-file projects and import libraries: Bundling helps pack dependencies into the format required for Figma plugins.
- React, Vue, etc. to create complex user interfaces.