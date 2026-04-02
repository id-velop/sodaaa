# Working with Images

**Source:** https://developers.figma.com/docs/plugins/working-with-images/

---

On this page

Figma plugins are a powerful way to add and manipulate images in Figma files. In the following sections, we show how to add images to your Figma files and modify images within your plugin.

In this guide, you'll learn how to create a plugin that can:

- [Add images](#add-images)
- [Manipulate images](#manipulate-images)

note

This guide assumes that you’re familiar with the basics of creating Figma plugins. If you’re new to developing plugins, check out the [Build your first plugin](https://help.figma.com/hc/en-us/articles/4407260620823--BYFP-1-Overview) course — you can copy and paste the code from this guide into the plugin you build.

---

## Add images[​](#add-images "Direct link to Add images")

In this section, we’ll use a plugin to add images to a Figma file. We can do this a couple of ways:

- [Add an image from a known source](#add-image-server) such as an s3 bucket or web server.
- [Add an image from user input](#add-image-user).

To use a plugin to add images to a Figma file, an image must be:

- `PNG`, `JPG`, or `GIF` format.
- A maximum of 4096 x 4096 px.
- Available to the Figma plugin. For example, a server’s [Cross-Origin Resource Sharing](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) (CORS) configuration can sometimes [block requests for image files](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image). To avoid network requests altogether, you can include images in your plugin as Base64-encoded data.

### Add an image with a known size[​](#add-image-known-size "Direct link to Add an image with a known size")

The following code sample gets an image from a URL, and inserts a rectangle with the image as a fill.

Render image of known size

```
figma.createNodeFromJSXAsync(  
  <figma.widget.Image  
    src="https://picsum.photos/200/300"  
    width={200}  
    height={300}  
  />  
)
```

Render image of known size (without JSX)

```
figma.createNodeFromJSXAsync(  
  figma.widget.h(  
    figma.widget.Image,  
    {  
      src: "https://picsum.photos/200/300",  
      width: 200,  
      height: 300  
    }  
  )  
)
```

### Add an image from a known source[​](#add-image-server "Direct link to Add an image from a known source")

The following code sample gets an image from a URL, creates a rectangle, and then renders the image by adding the image as a fill to the rectangle.

Render image in file

```
// Get an image from a URL.  
figma.createImageAsync(  
  'https://picsum.photos/200'  
).then(async (image: Image) => {  
	// Create a rectangle that's the same dimensions as the image.  
  const node = figma.createRectangle()  
  
  const { width, height } = await image.getSizeAsync()  
  node.resize(width, height)  
  
  // Render the image by filling the rectangle.  
  node.fills = [  
    {  
      type: 'IMAGE',  
      imageHash: image.hash,  
      scaleMode: 'FILL'  
    }  
  ]  
})
```

Here’s an explanation of what the code is doing:

1. To get image data into our plugin, we use the [`figma.createImageAsync` method](/docs/plugins/api/properties/figma-createimageasync/). The method returns a Promise that contains an [image object](/docs/plugins/api/Image/).
2. Because `createImageAsync` returns a Promise, we use `.then()` to take action on the image returned by the method.
3. In Figma, images don’t exist on their own — images are rendered by adding an image as a fill to a node., we create a rectangle node (`figma.createRectangle`) that will be used to render the image.
4. The image object returned by `createImageAsync` has a built-in method named `getSizeAsync`. Rather than hardcoding dimensions for the image into the plugin, we use `getSizeAsync` to get the dimensions of the image we requested in the first step. Then, we set the rectangle node to those dimensions.
5. To render the image onto the canvas, we add the image to the rectangle node using the `.fills` property. Then, we use `imageHash` to provide the hashed version of the image, `image.hash`, that was returned by `createImageAsync`.

This code sample hardcodes a URL for `createImageAsync`. For an example that allows different URLs, check out the next section.

### Add an image from user input[​](#add-image-user "Direct link to Add an image from user input")

The following code sample expands the previous method. Rather than hardcoding an image URL for `createImageAsync`, we’re going accept user input from the quick actions menu using [plugin parameters](/docs/plugins/plugin-parameters/). To implement parameters, we need to update our plugin's `manifest.json` file, as well as the plugin code.

#### manifest.json[​](#manifestjson "Direct link to manifest.json")

To accept user input, we add the `parameters` property to our plugin’s `manifest.json` file:

Modified manifest.json

```
{  
  "name": "Example Name",  
  ...,  
  "parameters": [  
    {  
      "name": "URL",  
      "key": "url",  
      "description": "A URL for a PNG, JPG, or GIF no larger than 4096x4096 px."  
    }  
  ]  
}
```

The `parameters` property lets us define a parameter that will store the URL provided by the user.

#### code.ts[​](#codets "Direct link to code.ts")

To handle the user’s input, we do a few things to the code for our plugin:

- Add `figma.parameters.on('input')` so that the plugin can listen for input from the quick actions menu.
- Add `figma.on('run')` to pass the URL from the user into our plugin’s existing code.
- Wrap the original `figma.createImageAsync(...).then(...)` call in a function named `startPluginWithParameters`, which takes the user’s URL from our parameters as input.
- In `figma.createImageAsync(...)`, we replace the hardcoded URL with a reference to `parameters.url`.

Render a user-provided image in a file

```
// Listen for input from the quick actions menu.  
figma.parameters.on('input', ({query, result}: ParameterInputEvent) => {  
  result.setSuggestions([query, 'https://picsum.photos/256', 'https://picsum.photos/512'])  
})  
  
// When input is done, run the plugin with the user input as a parameter.  
figma.on('run', ({parameters}: RunEvent) => {  
  startPluginWithParameters(parameters)  
})  
  
// Start the plugin with parameters. Parameters are defined in manifest.json.  
async function startPluginWithParameters(parameters: ParameterValues) {  
  try {  
    await figma.createImageAsync(  
      parameters.url  
    ).then(async (image: Image) => {  
      const node = figma.createRectangle()  
  
      const { width, height } = await image.getSizeAsync()  
      node.resize(width, height)  
  
      // Your image is added to the canvas  
      node.fills = [  
        {  
          type: 'IMAGE',  
          imageHash: image.hash,  
          scaleMode: 'FILL'  
        }  
      ]  
    })  
	// If there's an error, notify the user.  
  } catch (error) {  
    figma.notify(error)  
  } finally {  
    figma.closePlugin()  
  }  
}
```

Now that you can add images to a Figma file using a plugin, you’re ready to start making changes to those images. To learn about manipulating images with a plugin, check out the next section.

---

## Manipulate images[​](#manipulate-images "Direct link to Manipulate images")

In this section we will look at how to manipulate images within a Figma plugin. We will learn how to retrieve an image from a document, how to decode the image to manipulate its bytes, and how to write a modified image back to the document. As a concrete example, we will show you how to invert the colors of an image.

As you probably know, images in Figma are stored inside the **fills** of an object. So we first need to retrieve the fills off the current selection.

Retrieve fills from current selection

```
async function invertImages(node) {  
  const newFills = []  
  for (const paint of node.fills) {  
    if (paint.type === 'IMAGE') {  
      // Get the (encoded) bytes for this image.  
      const image = figma.getImageByHash(paint.imageHash)  
      const bytes = await image.getBytesAsync()  
  
      // TODO: Do something with the bytes!  
    }  
  }  
  node.fills = newFills  
}  
  
// Assume the current selection has fills.  
// In an actual plugin, this won't necessarily be true!  
const selected = figma.currentPage.selection[0] as GeometryMixin  
invertImages(selected)
```

Calling [`getBytesAsync`](/docs/plugins/api/Image/#getbytesasync) returns the raw bytes of the image, as it is stored on disk. This can be useful if you want to download the image or upload it somewhere else. However, in our case, we want to manipulate the image pixel-by-pixel, as a matrix of RGBA samples. Doing so requires **decoding** the image.

This could be done by importing some image decoding library. Instead, what we'll do is ask the browser to decode the image for us. We can do this by putting the image in a `<canvas>` element which will give us access to the `getImageData` and `putImageData` functions provided by browsers.

You may recall from the [execution model](/docs/plugins/how-plugins-run/) section that you will need to create an `<iframe>` to access browser APIs. We'll do that later: for now, here is our extended plugin code that sends the original image to the (yet-to-be-implemented) worker, receives a modified image, and replaces the image fill:

code.ts: Send image data to UI

```
async function invertImages(node) {  
  const newFills = []  
  for (const paint of node.fills) {  
    if (paint.type === 'IMAGE') {  
      // Get the (encoded) bytes for this image.  
      const image = figma.getImageByHash(paint.imageHash)  
      const bytes = await image.getBytesAsync()  
  
      // Create an invisible iframe to act as a "worker" which  
      // will do the task of decoding and send us a message  
      // when it's done.  
      figma.showUI(__html__, { visible: false })  
  
      // Send the raw bytes of the file to the worker.  
      figma.ui.postMessage(bytes)  
  
      // Wait for the worker's response.  
      const newBytes = await new Promise((resolve, reject) => {  
        figma.ui.onmessage = value => resolve(value)  
      })  
  
      // Create a new paint for the new image.  
      const newPaint = JSON.parse(JSON.stringify(paint))  
      newPaint.imageHash = figma.createImage(newBytes).hash  
      newFills.push(newPaint)  
    }  
  }  
  node.fills = newFills  
}
```

Now we will implement the worker that will actually decode, modify, and encode the image. It's possible to render UI elements directly in the call to `figma.showUI()`, but for this example the code needs to be in a separate file referred to by the `ui` section of the manifest. This worker will need to listen to messages from the plugin code and respond with a message back once it's accomplished its task. We will implement `encode` and `decode` later.

ui.html: Decode, modify, and encode image

```
<script>  
  // Create an event handler to receive messages from the main  
  // thread.  
  window.onmessage = async (event) => {  
    // Just get the bytes directly from the pluginMessage since  
    // that's the only type of message we'll receive in this  
    // plugin. In more complex plugins, you'll want to check the  
    // type of the message.  
    const bytes = event.data.pluginMessage  
  
    const canvas = document.createElement('canvas')  
    const ctx = canvas.getContext('2d')  
  
    const imageData = await decode(canvas, ctx, bytes)  
    const pixels = imageData.data  
  
    // Do the actual work of inverting the colors.  
    for (let i = 0; i < pixels.length; i += 4) {  
      pixels[i + 0] = 255 - pixels[i + 0]  
      pixels[i + 1] = 255 - pixels[i + 1]  
      pixels[i + 2] = 255 - pixels[i + 2]  
      // Don't invert the alpha channel.  
    }  
  
    const newBytes = await encode(canvas, ctx, imageData)  
    window.parent.postMessage({pluginMessage: newBytes}, '*')  
  }  
</script>
```

As you can see in the example above, we create a `<canvas>` object. The handle for the data backing `<canvas>` is called a [context](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D) and is obtained with `canvas.getContext('2d')`. The context allows us to retrieve and write [ImageData](https://developer.mozilla.org/en-US/docs/Web/API/ImageData) objects. `ImageData` objects have a `.data` field which is an array containing the colors of each sample (or pixel) in the image in sequence, stored as `[R, G, B, A, R, G, B, A, ...]`. To invert the colors in the image, we take each color channel `value` and replace it with `255 - value`.

info

To learn more about how `RGBA` and `RGB` color values are handled by Figma and plugins, see: [RGB/RGBA](/docs/plugins/api/RGB/)

Provided below are the implementations of the `encode` and `decode` functions.

Encode and decode images

```
// Encoding an image is also done by sticking pixels in an  
// HTML canvas and by asking the canvas to serialize it into  
// an actual PNG file via canvas.toBlob().  
async function encode(canvas, ctx, imageData) {  
  ctx.putImageData(imageData, 0, 0)  
  return await new Promise((resolve, reject) => {  
    canvas.toBlob(blob => {  
      const reader = new FileReader()  
      reader.onload = () => resolve(new Uint8Array(reader.result))  
      reader.onerror = () => reject(new Error('Could not read from blob'))  
      reader.readAsArrayBuffer(blob)  
    })  
  })  
}  
  
// Decoding an image can be done by sticking it in an HTML  
// canvas, as we can read individual pixels off the canvas.  
async function decode(canvas, ctx, bytes) {  
  const url = URL.createObjectURL(new Blob([bytes]))  
  const image = await new Promise((resolve, reject) => {  
    const img = new Image()  
    img.onload = () => resolve(img)  
    img.onerror = () => reject()  
    img.src = url  
  })  
  canvas.width = image.width  
  canvas.height = image.height  
  ctx.drawImage(image, 0, 0)  
  const imageData = ctx.getImageData(0, 0, image.width, image.height)  
  return imageData  
}
```

info

The example above won't work for GIFs, which are more like video files than image files. In fact, `<canvas>` doesn't really support GIFs. You will need to use a third-party Javascript library capable of encoding and decoding GIFs.

- [Add images](#add-images)
  - [Add an image with a known size](#add-image-known-size)
  - [Add an image from a known source](#add-image-server)
  - [Add an image from user input](#add-image-user)
- [Manipulate images](#manipulate-images)