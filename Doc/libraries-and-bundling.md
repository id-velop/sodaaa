# Libraries and Bundling

**Source:** https://developers.figma.com/docs/plugins/libraries-and-bundling/

---

On this page

In the [plugin manifest section](/docs/plugins/manifest/), we covered how to set up a simple Figma project with all plugin code in a single file. For a basic plugin with limited functionality, having everything in one place makes sense. But all the code must be in one file, which doesn’t scale for very long. These days, most websites use hundreds of files and libraries in a single project.

info

Libraries are collections of prewritten code. They allow you to reuse common JavaScript functions or patterns in your own websites and applications.

Take a look at the following example:

```
<html>  
  <head>  
    <meta charset="UTF-8">  
    <link rel="stylesheet" href="main.css">  
    <script src="libraries/scripts.js" type="text/javascript"></script>  
    <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js" integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo" crossorigin="anonymous"></script>  
    <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>  
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>  
  </head>  
  <body>  
  </body>  
</html>
```

While `<script>` tags can be used to include multiple libraries, having hundreds of these tags would not be the most efficient way to include your project dependencies. A common solution is to bundle all code and dependencies into one file. Because everything is technically in one file, bundling can optimize your project by making less server requests.

![An animation showing two rectangles. One labeled "Plugin" and the other "API". In an animation labeled "unbundled request" many requests are shown going from plugin to API, then many responses going from API to plugin. In an animation labeled "bundled request" one "bundle" goes from plugin to API, then one responses going from API to plugin](https://static.figma.com/uploads/483677af4f38b1ddcfa0dd6839c1ecb61787b532)

## Bundling with Webpack[​](#bundling-with-webpack "Direct link to Bundling with Webpack")

Webpack is a widely used JavaScript library and module bundler that packages your project files for use in a browser. Loading scripts individually in a web app can be very costly and Webpack can improve a project’s load speed by bundling script files. Instead of making multiple requests, a bundle of script files only needs to be requested once. In this section, we’ll go over how you can bundle your projects with this tool. We are going to:

1. Install Webpack
2. Setup Typescript with Webpack
3. Create a bundle
4. Import modules

caution

We recommend taking a look at the [Plugin Quickstart Guide](/docs/plugins/plugin-quickstart-guide/) before using Webpack to install other dependencies required to build a Figma plugin.

### Install Webpack[​](#install-webpack "Direct link to Install Webpack")

1. Open your project folder in Visual Studio Code.
2. Go to **Terminal** > **New terminal** to open a command line window in VS Code.
3. In the terminal, run the following commands. These commands will save Webpack to your current project and install other dependencies into your project:

```
npm install
```

```
npm install webpack webpack-cli --save-dev
```

If the commands are successful, the `node_modules` folder is created in Visual Studio Code and Webpack is added to our list of devDependencies in `package.json`.

![A screenshot of the VSCode open to a package.json file with webpack and webpack-cli indicated as installed in devDependencies. It also shows the file explorer for the project containing the following 10 items: node_modules, .gitignore, code.js, code.ts, manifest.json, package-lock.json, package.json, README.md, tsconfig.json, ui.html](https://static.figma.com/uploads/611a970d53bd4422af3ac50a2822ae5b2e8428f1)

info

If you followed our Plugin Quickstart guide, you’ll already have a `node_modules` folder in your project.

### Setup Typescript with Webpack[​](#setup-typescript-with-webpack "Direct link to Setup Typescript with Webpack")

We recommend using [Typescript](/docs/plugins/typescript/) for developing Figma plugins. In order for our plugin to compile properly, we need to configure Webpack to use Typescript.

1. Install the Typescript compiler and loader by running the following command. You can verify the installation by checking that `ts-loader` is now under the list of dependencies in `package.json`.

```
npm install --save-dev typescript ts-loader
```

2. Now, we’ll change up the project structure by creating a directory named `dist`. Right-click in the file explorer and select **New Folder…**

![A screen recording of VSCode with the right click menu open saying "New folder..." as the second item in the menu. A folder named ‘dist’ is created.](https://static.figma.com/uploads/b08456080055b93f07e2512506436a375fe71ba1)

3. Then, drag `code.js` and drop it into the new `dist` directory.
4. Create another directory named `src` then move `code.ts` into it. Our updated project structure should look something like this:

![A partial screenshot of the project directory open in the VSCode file explorer. It highlights two directories: "dist" containing a code.js file and "src" containing a code.ts file.](https://static.figma.com/uploads/bad0ab8a30ee58ac07765ba385a2e9168ddfc150)

5. Since we changed the location of our `code.js`, we also need to update the `main` field in `manifest.json` to reflect the change:

```
// manifest.json  
  
{  
  "name": "bundling-test2",  
  "id": "1174728261122583026",  
  "api": "1.0.0",  
  "main": "dist/code.js",  
  "editorType": [  
    "figma",  
    "figjam"  
  ]  
}
```

6. Open `package.json` then update `build` to `"webpack"`. This will allow us to run a webpack build with a simple terminal command.

```
// package.json  
...  
"scripts": {  
  "build": "webpack",  
  "watch": "npm run build -- --watch"  
},  
...
```

7. Then, open `tsconfig.json` and replace it with the following. This sets our compiler options to include Typescript files from the `src` folder and assigns `dist` as the output directory.

```
// tsconfig.json  
{  
  "compilerOptions": {  
    "target": "es6",  
    "lib": ["es6"],  
    "strict": true,  
    "typeRoots": [  
      "./node_modules/@types",  
      "./node_modules/@figma"  
    ],  
    "outDir": "./dist",  
    "jsx": "react",  
    "allowJs": true,  
    "moduleResolution": "node"  
  },  
  "include": ["src/**/*.ts"]  
}
```

8. Since the Figma desktop app works a little differently than the browser, we need to add some Webpack configurations. We are going to create a `webpack.config.js` file at the root of our project.

![A screen recording of a new file named “webpack.config.js” being created in the project directory.](https://static.figma.com/uploads/4de33046bd086d03e81f001c323bbfa4aaf5f039)

9. Copy the following code and add it to your `webpack.config.js` file:

```
const path = require('path');  
const webpack = require('webpack');  
  
module.exports = (env, argv) => ({  
mode: argv.mode === 'production' ? 'production' : 'development',  
  
// This is necessary because Figma's 'eval' works differently than normal eval  
devtool: argv.mode === 'production' ? false : 'inline-source-map',  
  entry: {  
    code: './src/code.ts' // This is the entry point for our plugin code.  
  },  
  module: {  
    rules: [  
      // Converts TypeScript code to JavaScript  
      {  
        test: /\.tsx?$/,  
        use: 'ts-loader',  
        exclude: /node_modules/,  
      },  
    ],  
  },  
  // Webpack tries these extensions for you if you omit the extension like "import './file'"  
  resolve: {  
    extensions: ['.ts', '.js'],  
  },  
  output: {  
    filename: '[name].js',  
    path: path.resolve(__dirname, 'dist'),  
  },  
});
```

info

If you want to learn more about how `webpack.config.js` works, we recommend reading the [Webpack documentation](https://webpack.js.org/guides/getting-started/#using-a-configuration) →

After all the changes, our project structure should look something like this:

![A VSCode file explorer screenshot containing the following 12 files and folders: dist with code.js in side of it, a collapsed node_modules folder, src with code.ts inside of it, .gitignore, manifest.json, package-lock.json, package.json, README.md, tsconfig.json, and webpack.config.js](https://static.figma.com/uploads/42e95840e350f24797108a04c35fbf13cf209ea8)

10. Now, our Webpack modules should compile and our plugin should run properly. Save all your changes, then run a build of the project by running `npm run build` in the terminal. You’ll see a success message if the modules compiled with no errors.

![A screenshot of a CLI that is running the command "npm run build". That is running build and webpack scripts and indicating that it converted src/code.ts to dist/code.js successfully.](https://static.figma.com/uploads/0b30f9339f2a8bc59b9e77318d2a92f6131d7103)

11. Check that your plugin runs in the Figma desktop app by going to **Plugins** > **Development** then selecting your plugin.

    If you are working with the starter code from the **Plugin Quickstart Guide**, you’ll see five orange rectangles in the canvas.

![An animation of a plugin functioning in the Figma interface. The plugin window says "Rectangle creator" and shows a cursor entering the number "5" into a text input then hitting a "create" button which shows five rectangles being drawn on the Figma canvas.](https://static.figma.com/uploads/5edc8a8b67eddbf98ac3bd911b5c67ebefa0a6b8)

### Create a bundle[​](#create-a-bundle "Direct link to Create a bundle")

Now that we have Webpack installed and integrated with Typescript, we can start splitting up our plugin code into multiple files. This can be done through the use of JavaScript **modules**. A **module** is a bundle of code that can **export** functionality to other modules and **import** functionality from other modules.

In this section, we’ll take a look at how we can import and export modules between files.

1. Cut the following lines of code from `code.ts` :

   ```
   const rect = figma.createRectangle();  
   rect.x = i * 150;  
   rect.fills = [{type: 'SOLID', color: {r: 1, g: 0.5, b: 0}}];  
   figma.currentPage.appendChild(rect);  
   nodes.push(rect);
   ```
2. In `rectangle-module.ts` create an exported function named `createRectangles()` and paste in the code from `code.ts`:

   ```
   export function createRectangles(i:number, nodes: SceneNode[]) {  
     const rect = figma.createRectangle();  
     rect.x = i * 150;  
     rect.fills = [{ type: "SOLID", color: { r: 1, g: 0.5, b: 0 } }];  
     figma.currentPage.appendChild(rect);  
     nodes.push(rect);  
   }
   ```
3. Then, go back to `code.ts`. At the top of the file, create an import statement for the `createRectangles` function:

   ```
   import { createRectangles } from "./rectangle-module"
   ```
4. Finally, in `code.ts` call the `createRectangles` function under the `nodes` declaration:

   ```
   const nodes: SceneNode[] = [];  
     
   for (let i = 0; i < msg.count; i++) {  
     createRectangles(i,nodes);  
   }
   ```
5. Save your changes, then run a build of the project using `npm run build`.
6. Run your plugin again in the Figma desktop app. The plugin should work the same way, but with Webpack bundling our modules together behind the scenes. Rather than making requests to multiple TypeScript files, a single request is made to `code.ts`.

If you have issues running your plugin after creating modules, check that you have an `export` statement in your `createRectangles()` function and that your `import` statement in `code.ts` is correct.

### Import all modules[​](#import-all-modules "Direct link to Import all modules")

You can further simplify your import statements by importing everything from a library:

```
import * as MyCode from "./rectangle-module";
```

`MyCode` is the alias for our library. This is what we’ll use to reference the file and the pre-written code from it. Update your `createRectangles` function call to reflect the new import:

```
MyCode.createRectangles(i, nodes);
```

The concept of importing and exporting modules is the basic idea behind bundling. You can see how in a larger project, importing modules from a library saves you time and prevents redundancies in your code.

Webpack only understands JavaScript and JSON, so HTML and CSS files are converted into modules in a format that a browser can consume.

To see what bundling with Webpack and React looks like for a Figma plugin, take a look at the [Webpack sample](https://github.com/figma/plugin-samples/tree/master/webpack-react) directory in the [plugin-samples](https://github.com/figma/plugin-samples) repository. This may require additional Webpack configuration.

[Learn more about these concepts on the Webpack JS website →](https://webpack.js.org/concepts/)

## Using Plugma[​](#using-plugma "Direct link to Using Plugma")

[Plugma](https://plugma.dev) is a community-created toolkit to create plugins with support for common frameworks and additional development tools. To get started run the following command and follow the prompts:

```
npm create plugma@latest
```

For more information on what Plugma offers you can visit their [documentation](https://www.plugma.dev/docs/getting-started).

info

Plugma is a third-party library and not officially maintained by the Figma team.

## Using Create Figma Plugin[​](#using-create-figma-plugin "Direct link to Using Create Figma Plugin")

[Create Figma Plugin](https://yuanqing.github.io/create-figma-plugin/) is a community-created toolkit to create plugins with bundling, UI components, and helpful utilities configured out of the box. To get started, run the following command and follow the prompts:

```
npx --yes create-figma-plugin
```

For more information on what Create Figma Plugin offers you can visit their [documentation](https://yuanqing.github.io/create-figma-plugin/).

info

Create Figma Plugin is a 3rd party library and not officially maintained by the Figma team.

## ai-plugin-template[​](#ai-plugin-template "Direct link to ai-plugin-template")

If you want to create a plugin that integrates with OpenAI we have an official Figma starter template that uses [Next.js](https://nextjs.org/) that can get you up and running.

![Gif of ai-plugin-template](https://static.figma.com/uploads/cd663ea9256a71040227bc4af94c614febc8fc56)

To get started run the command below in your terminal and follow the instructions in the generated `README.md` file:

```
npx create-next-app@latest --example https://github.com/figma/ai-plugin-template/
```

To learn more you can visit the repository [here](https://github.com/figma/ai-plugin-template/).

## Bundling with Esbuild[​](#bundling-with-esbuild "Direct link to Bundling with Esbuild")

[Esbuild](https://esbuild.github.io/) is a JavaScript bundler built with [Go](https://go.dev/) that is even faster than Webpack. Much like Webpack, Esbuild converts your files into modules then creates a bundle for the browser to consume. Esbuild also supports Typescript and JSX out of the box, so you don’t need to worry about these extra configurations.

[Learn more about bundling with Esbuild on their website →](https://esbuild.github.io/getting-started/)

There are a lot of bundling tools out there, so feel free to use the module bundler you feel is best for your project. Take a look at this [esbuild-react](https://github.com/figma/plugin-samples/tree/master/esbuild-react) example in our [plugin-samples](https://github.com/figma/plugin-samples) repository.

- [Bundling with Webpack](#bundling-with-webpack)
  - [Install Webpack](#install-webpack)
  - [Setup Typescript with Webpack](#setup-typescript-with-webpack)
  - [Create a bundle](#create-a-bundle)
  - [Import all modules](#import-all-modules)
- [Using Plugma](#using-plugma)
- [Using Create Figma Plugin](#using-create-figma-plugin)
- [ai-plugin-template](#ai-plugin-template)
- [Bundling with Esbuild](#bundling-with-esbuild)