# Frozen Plugins

**Source:** https://developers.figma.com/docs/plugins/frozen-plugins/

---

On this page

### I accidentally caused an infinite loop. What do I do?[​](#i-accidentally-caused-an-infinite-loop-what-do-i-do "Direct link to I accidentally caused an infinite loop. What do I do?")

You will be unable to click the “Cancel” button because the editor tab will be hung waiting for your plugin to end. You have to close and reopen the hanging editor tab and restart your plugin.

If you have the developer tools open, can push the ‘pause’ button (in the ‘Sources’ tab) to see why your script is in an infinite loop.

### My plugin needs to do a long-running task. What do I do?[​](#my-plugin-needs-to-do-a-long-running-task-what-do-i-do "Direct link to My plugin needs to do a long-running task. What do I do?")

Sometimes, your plugin might be frozen not because it has a bug, but because it's genuinely doing an operation that takes a long time. This could be for example, a plugin that applies some complex filter on an image, or a plugin that touches every node in a document. Users create really large Figma documents!

It's not the best experience for the user if the UI is completely frozen while the plugin finishes. But it's one of the tradeoffs we had to make to let your plugin run on the JavaScript main thread. In exchange for a more simple API, we can't prevent plugins from freezing the UI. Here are different ways you can potentially deal with this:

- **Split your work into chunks**

  The best way to keep the UI responsive is to split your work into chunks. The idea is to only do a little bit of computation (e.g. a fixed number of nodes, or for a few milliseconds), then yield to the main thread before continuing. This allows the browser to process any events, such as a mouse click on the cancel button. A typical way to do this is to use `setTimeout(() => { ... rest of your computation ... }, 1)` which schedules more computation to be run on a subsequent frame, possibly in conjunction with `Promise`s and `async/await`.
- **Use CSS animations**

  An imperfect but inexpensive way to make the plugin *look* like it's not frozen is to have a progress spinner, implemented using **only** CSS animation (no JavaScript). Even when the rest of the UI is frozen, the CSS animation can still play on some browsers. The reason is that many browsers implement animation composition outside the main thread. However, note that this is only an aesthetic improvement.
- **Use a WebWorker**

  [WebWorkers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) are a browser feature that allows you to create a JavaScript background thread to perform expensive computation. This can be useful for expensive task such as image decoding or processing. However, note that WebWorkers are like iframes in that they can only communicate with their creator via message-passing. They won't have access to the `figma` global or any nodes. As such, WebWorkers are best suited to run functions that have a single input and output, and don't need to access the document repeatedly.
- **Contact us**

  If you're surprised by something taking a long time (e.g. you're only changing the opacity of a hundred nodes), contact us! We can help you diagnose the issue, it could be one of our APIs that is unnecessarily slow. As always, sample code + a sample file will greatly speed up the process.

- [I accidentally caused an infinite loop. What do I do?](#i-accidentally-caused-an-infinite-loop-what-do-i-do)
- [My plugin needs to do a long-running task. What do I do?](#my-plugin-needs-to-do-a-long-running-task-what-do-i-do)