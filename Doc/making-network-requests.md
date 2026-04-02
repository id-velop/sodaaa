# Making Network Requests

**Source:** https://developers.figma.com/docs/plugins/making-network-requests/

---

On this page

This guide describes how to make basic network requests, test network access, and specify the scope of your plugin's network access. As a best practice, Figma recommends that your plugin only allows domains that are needed for your plugin to work.

In practice, you first develop your plugin and implement all the required network requests. Then, before publishing, you can use the instructions in this guide to specify access to only the domains used by your plugin.

- [Make network requests](#make-network-requests)
- [Test network access](#test-network-access)
- [Specify network access](#specify-network-access)

---

## Make network requests[​](#make-network-requests "Direct link to Make network requests")

To make network requests from within a plugin, such as calls to your own API or to request resources from a server, use Figma's [Fetch API](/docs/plugins/api/properties/global-fetch/). The Figma Fetch API is used in a similar way to the WhatWG Fetch API that is standard in most browsers.

note

This guide assumes that you’re familiar with the basics of creating Figma plugins. If you’re new to developing plugins, check out the [Build your first plugin](https://help.figma.com/hc/en-us/articles/4407260620823--BYFP-1-Overview) course — you can copy and paste the code from this guide into the plugin you build.

The following code sample makes a request to an external API and returns the JSON response to the console.

Fetch to the console

```
(async () => {  
  const response = await fetch('https://httpbin.org/get?success=true')  
  const json = await response.json()  
  
  console.log(JSON.stringify(json.args, null, 2))  
  
  figma.closePlugin()  
})()
```

By adding a text node to the canvas, we can deliver content from the response directly into a Figma file.

Fetch to the canvas

```
(async () => {  
  const response = await fetch("https://httpbin.org/get?success=true");  
  const json = await response.json();  
  
  const textNode = figma.createText();  
  await figma.loadFontAsync(textNode.fontName as FontName);  
  
  // success=true!  
  textNode.characters = JSON.stringify(json.args, null, 2);  
  
  figma.closePlugin();  
})();
```

Because plugins run inside a browser environment, [Cross-Origin Resource Sharing](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) policies apply. Plugin iframes have a `null` origin. This means that they will only be able to call APIs with `Access-Control-Allow-Origin: *` (i.e., those that allow access from any origin).

info

Previously, to make network requests within a plugin, you had to implement an iframe to handle sending requests and receiving data. While plugins implemented this way will continue to function normally and do not need to be modified, we recommend using the simpler [Fetch API](/docs/plugins/api/properties/global-fetch/) approach.

---

## Test network access[​](#test-network-access "Direct link to Test network access")

After you've implemented network requests in your plugin (e.g. calling an API or getting images from a server), test the impact of limiting your plugin's network access. Then, use the results of your testing to build the list of domains you need to appropriately [limit network access](#limit-network-access).

To test the impact of limiting your plugin's network access:

1. In your plugin's `manifest.json`, add the `networkAccess` key with the `allowedDomains` property set to `["none"]`.

   Manifest.json

   ```
   {  
     "name": "MyPlugin",  
     "id": "737805260747778092",  
     "api": "1.0.0",  
     "main": "code.js",  
     "ui": "ui.html",  
     "networkAccess": {  
       "allowedDomains": ["none"]  
     }  
   }
   ```
2. In Figma, try to use your plugin as normal. In the developer console, note any content-security policy (CSP) errors. For example, if the request in [Make network requests](#make-network-requests) was blocked:

   CSP error

   ```
   Refused to connect to 'https://httpsbin.org/' because it violates the following Content Security Policy directive: "default-src data:".  
   Note that 'connect-src' was not explicitly set, so 'default-src' is used as a fallback.
   ```
3. As you identify CSP errors, follow the [Limit network access](#limit-network-access) steps to remove `"none"` and add the domains that your plugin requires to the `allowedDomains` list.

When you're confident that all the required domains are listed in `allowedDomains` and you no longer encounter CSP errors, testing is complete.

---

## Specify network access[​](#specify-network-access "Direct link to Specify network access")

To specify a list of domains that your plugin is allowed to access, you update the plugin's `manifest.json` file:

1. In your plugin's `manifest.json`, add the `networkAccess` key. `networkAccess` has the following properties: `allowedDomains`, `reasoning`, and `devAllowedDomains`.

   Manifest.json

   ```
   {  
     "name": "MyPlugin",  
     "id": "737805260747778092",  
     "api": "1.0.0",  
     "main": "code.js",  
     "ui": "ui.html",  
     "networkAccess": {  
       "allowedDomains": [],  
       "reasoning": "",  
       "devAllowedDomains": []  
     }  
   }
   ```
2. Add domains to the `allowedDomains` list. The domains that you add to the list should correspond to the domains that you are making requests to. This includes any requests you make for external resources using methods like createImageAsnyc().

   For example, to limit a plugin's access to only the `httpbin.org` domain used in [Make network requests](#make-network-requests):

   Manifest.json

   ```
   {  
     "name": "MyPlugin",  
     "id": "737805260747778092",  
     "api": "1.0.0",  
     "main": "code.js",  
     "ui": "ui.html",  
     "networkAccess": {  
       "allowedDomains": ["httpbin.org"],  
       "reasoning": "",  
       "devAllowedDomains": []  
     }  
   }
   ```

   If the only endpoint the plugin uses is `/get`, make the string in the `allowedDomains` list even more granular:

   Manifest.json

   ```
   {  
     "name": "MyPlugin",  
     "id": "737805260747778092",  
     "api": "1.0.0",  
     "main": "code.js",  
     "ui": "ui.html",  
     "networkAccess": {  
       "allowedDomains": ["httpbin.org/get"],  
       "reasoning": "",  
       "devAllowedDomains": []  
     }  
   }
   ```

   This way, no unexpected requests can be made to other endpoints on the domain.

   note

   There are several patterns that can be used to specify domains for `allowedDomains`. For a complete list, see [Plugin Manifest](/docs/plugins/manifest/). You can also specify:

   - `["none"]`: `none` is a special keyword that prevents all network access. Use this if your plugin doesn't make any network requests.
   - `["*"]`: `*` is a special character that permits your plugin to access any domain. If your plugin includes `*` in `allowedDomains`, then `reasoning` is required.
3. For `reasoning`, provide a brief explanation for the access scope permitted by `allowedDomains`. When you publish your plugin, this explanation is visible on your plugin's Community page along with the list of allowed domains.

   For example:

   Manifest.json

   ```
   {  
     "name": "MyPlugin",  
     "id": "737805260747778092",  
     "api": "1.0.0",  
     "main": "code.js",  
     "ui": "ui.html",  
     "networkAccess": {  
       "allowedDomains": ["httpbin.org/get"],  
       "reasoning": "MyPlugin queries httpbin.org/get for example responses.",  
       "devAllowedDomains": []  
     }  
   }
   ```
4. If you need to access a local or development web server to build your plugin, add its domain(s) to the `devAllowedDomains` list. The domains that you add to the list should correspond to the local URL(s) for your development server. If you want to access a local or development web server in `allowedDomains`, then `reasoning` is required.

   For example:

   Manifest.json

   ```
   {  
     "name": "MyPlugin",  
     "id": "737805260747778092",  
     "api": "1.0.0",  
     "main": "code.js",  
     "ui": "ui.html",  
     "networkAccess": {  
       "allowedDomains": ["httpbin.org/get"],  
       "reasoning": "MyPlugin queries httpbin.org/get for example responses.",  
       "devAllowedDomains": ["http://localhost:3000"]  
     }  
   }
   ```
5. Save the changes to your manifest.

After `networkAccess` is implemented, Figma enforces the list of domains that you gave for `allowedDomains`. If a request originates from your plugin to a domain not in `allowedDomains`, Figma blocks the request and throws a [content-security policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) error.

For example, if our plugin attempts to make a request to `httpbin.org/post`, we get the following error:

CSP error

```
Refused to connect to 'https://httpbin.org/post' because it violates the following Content Security Policy directive: "default-src data:". Note that 'connect-src' was not explicitly set, so 'default-src' is used as a fallback.
```

- [Make network requests](#make-network-requests)
- [Test network access](#test-network-access)
- [Specify network access](#specify-network-access)