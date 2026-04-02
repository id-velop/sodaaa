# Build Scripts

**Source:** https://developers.figma.com/docs/plugins/build-script/

---

This workflow described above has a race condition: If you edit a source file and run the plugin quickly enough, the bundler may still be busy generating the output files and the current output files may be stale. This is especially likely if your bundler is slow. To get around this, you can use an optional `"build"` field in `manifest.json`. This specifies a script that Figma will run to completion before your plugin is run. If you use that to build your bundle, then Figma is guaranteed to always use the correct up-to-date output files.

This is a very advanced workflow and definitely not required. It also has a lot of rough edges and isn't necessarily ready for use yet. We're just mentioning it in case you find it helpful. An easy alternative to using a build script is to run your bundler in watch mode and just wait for your bundler to finish building before you run the plugin in Figma. We hope to improve this workflow in the future.

One big caveat is that Figma's desktop app currently doesn't set the `PATH` environment variable correctly. Your script may need to use absolute paths and/or contain code to import the right path from somewhere.

If you'd like to configure Webpack as a build script instead of manually running Webpack commands, you could try adding this line to your `manifest.json`. This assumes your `node` binary is located at `/usr/local/bin/node`. Note that this is a lot slower than running Webpack in watch mode because Webpack is not optimized for fast startup time.

manifest.json

```
{  
  ...  
  "build": "/usr/local/bin/node node_modules/.bin/webpack --mode=production",  
  ...  
}
```