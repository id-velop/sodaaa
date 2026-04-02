# OAuth with Plugins

**Source:** https://developers.figma.com/docs/plugins/oauth-with-plugins/

---

On this page

In this section, we'll look at how to build a Figma plugin that uses a 3rd-party service which the user needs to authenticate to. For example, you might want to write a plugin that uses Google authentication to read data from one of the user’s private Google spreadsheets.

## Prerequisites[​](#prerequisites "Direct link to Prerequisites")

- This guide assumes you already have knowledge of OAuth. If not, [this guide](https://aaronparecki.com/oauth-2-simplified/) might help. We also encourage you to be familiar with the [OAuth Threat Model and Security Considerations](https://datatracker.ietf.org/doc/html/rfc6819).
- You must have a server with a publicly available HTTPS Internet address.
- You must be able to register your plugin with the OAuth provider you plan to use. This will involve configuring a redirect URL that points to your server.

## Comparison to other environments[​](#comparison-to-other-environments "Direct link to Comparison to other environments")

OAuth with Figma plugins is different from OAuth in other environments that you’re probably used to, such as on a website or in a native app:

- Usually, when you are implementing OAuth for a website, you open the authentication page with `window.open()`, the user authenticates, and then the authentication page you opened sends you the access token using `window.opener.postMessage()`.   
    
   However, this doesn't work for Figma plugins. The Figma desktop app is an Electron app, not a browser. Calling `window.open()` from a plugin in the Figma desktop app opens a new window in the browser where `window.opener` is `null`.
- Usually, when you were implementing OAuth for a native app, you open the authentication page in the browser, the user authenticates, and then the authentication page you opened sends the access token to your native app.   
    
   However, this doesn't work for Figma plugins. This is usually done either by the app registering a custom URI scheme with the system, or by the app temporarily running a local server on the network loopback interface. The OAuth provider can then navigate to that URI (either a custom scheme or a local server) with the access token as a parameter to pass it to the app. Neither of these are things you can do from within a Figma plugin for security reasons.

The only way to do OAuth in a Figma plugin is to run your own server on the public Internet and have the user authenticate your server via OAuth. You can then send the access token from your server back down to the Figma plugin.

This unfortunately requires more effort to implement in a secure way than doing everything locally. The sensitive access token can potentially be intercepted on its way to or from the server. When implementing OAuth, please be very mindful of this risk and try to ensure that access tokens do not remain on the server any longer than absolutely necessary.

info

If you know about Proof Key for Code Exchange (PKCE) and your OAuth provider supports it, we strongly recommend that you use it for improved security. This ensures that even if the read key, the write key, or the authorization code from the OAuth provider is intercepted by an attacker, they can’t use that information to redeem the authorization code for an access token.

## Authentication flow[​](#authentication-flow "Direct link to Authentication flow")

These following steps describes how you can invoke the OAuth provider from within a Figma plugin and get back a piece of information. What that information means depends on the provider.

In particular, we strongly recommend using Proof Key for Code Exchange (PKCE) if your OAuth provider supports it. In that case the information sent to the plugin will be an authorization code, not an access token. The authorization code will need to be redeemed by the plugin for an access token.

caution

Remember to test this flow both within a browser and within the Figma desktop app! Figma plugins can be used in both environments and users will expect both of them to work.

1. The plugin checks whether it’s already authenticated, by checking its local storage through `figma.clientStorage` - see below.
2. The plugin opens an iframe using the `figma.showUI(...)` API call. The iframe is necessary for accessing browser APIs for making network requests.

![](https://static.figma.com/uploads/d5dacb241c7b37a423a986afcf767a989c2ff465)

3. This plugin iframe redirects to a hostname under your control, for example a page hosted on your internet server. This will place the iframe on a non-null origin, which enables us to securely check its identity later in the flow.
4. If the user is already authenticated, communicate the existing token to the iframe so it can use it to speak to the relevant APIs, using [`figma.ui.postMessage`](/docs/plugins/api/properties/figma-ui-postmessage/). Make sure to pass an `origin` in the `options` field matching your iframe’s origin.
5. If the user isn’t already authenticated, from an API call made by your plugin iframe, your server generates a unique read/write key pair.

![](https://static.figma.com/uploads/830706cd949fc0f117d4f1def75e780dbc2baf39)

The read key allows you to read the value written by the write key. It will be used by the plugin to poll for the result of the OAuth flow. Each key is only usable once, which is why there are two different ones.

The write key allows you to write a value once to the server that can then be read by the read key. It will be used by the server to get the result back to the plugin after the user authenticates.

6. The plugin iframe opens a new window hosted on your internet server using `window.open(url, '_blank')` and passes it the write key.

caution

⚠️ Your OAuth provider should support the OAuth `state` parameter. You ***must*** use that to pass along the write key. You ***must*** also store the write key in cookies on your internet server’s origin. Note that we cannot write cookies in the UI frame, because many browsers will treat such cookies as “third-party” and block them. These must be set during the top-level navigation. We also recommend adding an interstitial at this step for users to confirm that they intend to link their accounts.

![](https://static.figma.com/uploads/4a0e76f954857d256eaa951130de188df08d4212)

7. The user authenticates with the OAuth provider. This may involve the user logging into the service if they haven’t already logged in.

![](https://static.figma.com/uploads/7449f7e0a0cacd302af3fcb3107e52739c80b3a6)

8. The OAuth provider redirects back to your server. This redirects to the URL that you have pre-registered with your OAuth provider when you set up the integration, and should pass the `state` parameter back along.

caution

⚠️ At this point, your server ***must*** verify that the write key stored in the `state` parameter fed back to the server matches the value it stored in the user’s cookie. If it doesn’t match, your server should fail the request.

![](https://static.figma.com/uploads/274b14a9495055b2b8457bc8a76b123dedbb119b)

9. Your server uses the write key to write the information you’ve received from the OAuth provider back to your server. This will not automatically re-focus the Figma desktop app. You should indicate to the user that authentication is complete and that they should switch back to the Figma desktop app.

danger

⚠️ This write ***must*** be done over HTTPS, not HTTP. The access token is very sensitive data, because it grants access to the authorized resource.

10. The plugin iframe polls your server using the read key.

danger

⚠️ This ***must*** be done over HTTPS, not HTTP. The access token is very sensitive data because it grants access to the authorized resource.
⚠️ You ***must*** ensure that only this origin, which must be a real hostname under your control, can access this polling endpoint’s response, for instance by hosting them on the same origin or by correctly configuring [CORS](https://www.w3.org/TR/2020/SPSD-cors-20200602/), or other plugins may be able to perform this flow masquerading as yours.

When the value has been written, the read will succeed.

![](https://static.figma.com/uploads/3887dbf20a92f569cc2c7b1f1b9e098d433aa5b4)

## Saving the access token locally[​](#saving-the-access-token-locally "Direct link to Saving the access token locally")

You likely won’t want the user to have to authenticate every time they run your plugin. To fix this, access tokens can be saved client-side using the client storage API once they have been obtained. First, communicate your token from your plugin iframe back to your main plugin code. See [the documentation](/docs/plugins/creating-ui/#sending-a-message-from-the-ui-to-the-plugin-code) for how to send this message.

caution

⚠️ Since your UI frame will be running on a [non-null origin](/docs/plugins/creating-ui/#non-null-origin-iframes), you ***must*** pass a `pluginId` matching your plugin when communicating the token to it from this frame. You ***must*** also restrict the audience of this postMessage to `https://www.figma.com`, so an attacker masquerading as Figma cannot get access to your authorization token from this message.

![](https://static.figma.com/uploads/7c349fd014a501e0458b488016ad2244bf8ef66f)

Then, from within the main plugin code:

```
await figma.clientStorage.setAsync('my-token', token)
```

This value is stored in local storage inside the browser and is not stored on Figma’s servers. Client storage is specific to the current user ID and plugin ID. Other plugins run by the same user and other users running the same plugin will not be able to read this value. The value can be retrieved by the main plugin code later on, from the same data store:

```
const token = await figma.clientStorage.getAsync('my-token')
```

Note that this must be done from your main plugin entry point (`"main"` in `manifest.json`) even though the entire OAuth flow must be driven by your UI entry point (`"ui"` in `manifest.json`). You will have to use message passing to allow both of these entry points to communicate. See [Creating a User Interface](/docs/plugins/creating-ui/) for more details.

- [Prerequisites](#prerequisites)
- [Comparison to other environments](#comparison-to-other-environments)
- [Authentication flow](#authentication-flow)
- [Saving the access token locally](#saving-the-access-token-locally)