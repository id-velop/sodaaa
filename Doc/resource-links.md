# Resource Links

**Source:** https://developers.figma.com/docs/plugins/resource-links/

---

The main suggested solution for using external resources is using the embedding method described in the webpack section. Alternatively to this, you can link to external resources. However this comes with several constraints:

You have to use absolute URLs starting with `http://` or `https://` and host the resources on your own server. It is currently not possible to ship other resources with the plugin and link to them. To ship additional resources they have to be embedded.

It is only possible to link to external resources from within the `<iframe>` created using `figma.showUI()`. It is not possible to directly load javascript libraries or other resources directly from the main thread JavaScript code.

Using external resources likely means that the plugin will not work if the user is offline when they run the plugin. The Figma editor currently is able maintain limited functionality and run plugins even if the user loses connectivity after having opened the editor. However if the plugin tries to load external resources, accessing those will likely require connectivity.

In order to link to external resources from within the `<iframe>`, put normal HTML markup in your UI, such as `<img src="...">`, `<link href="..." rel="stylesheet">` or `<script src="..."></script>`. However you have to use absolute URLs starting with `http://` or `https://` and host the resources on a server reachable by the plugin user.

Additionally, since `eval()` works in the main thread JavaScript, it is possible to use `fetch()` or `XMLHttpRequest` to load a script from the network inside the `figma.showUI()` `<iframe>`, send the script to the main thread using `postMessage`, and then `eval()` the string.