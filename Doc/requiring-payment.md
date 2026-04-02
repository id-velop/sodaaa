# Requiring Payment

**Source:** https://developers.figma.com/docs/plugins/requiring-payment/

---

On this page

## Introduction[​](#introduction "Direct link to Introduction")

The [Payments API](/docs/plugins/api/figma-payments/) allows you to to create custom time or usage-based free trials for plugins and widgets. Here are some examples of free trial experiences you can create:

- A remove background plugin that lets you remove the background from five images before having to pay
- A stock illustration plugin that gives you free access to a library of PNG illustrations, but requires payment to access vector illustrations
- A vector editing plugin that lets you warp or bloat vectors for free, but requires payment for rendering text on a path and other more powerful vector manipulation features
- A copy-editing plugin includes a 30 day free trial

You can use this API to:

- Read metadata about a user’s payment status and usage of your resource
- Kick off a checkout flow so a user can pay for your resource

info

If you customize the free trial experience for a plugin or widget, you must include information in the resource’s description that clearly explains what’s included in the trial and how long the trial lasts (if time-based).

## Getting Started[​](#getting-started "Direct link to Getting Started")

In order to use the Payments API, you must first add `"payments"` to the `"permissions"` field in your `manifest.json`:

```
{  
  "name": "My plugin",  
  "id": "{your id here}",  
  "api": "1.0.0",  
  "main": "code.js",  
  "ui": "ui.html",  
  "permissions": ["payments"]  
  ...  
}
```

If your `manifest.json` doesn’t contain this field, Payments API methods will throw errors when called.

## An Example[​](#an-example "Direct link to An Example")

Below is a simple paid plugin implementation that checks whether the user has
paid for the plugin or is currently in a time-based free trial. If not, it kicks
off the checkout flow. Otherwise, the plugin displays a message to the user.

```
async function run() {  
  if (figma.payments.status.type === "PAID") {  
    figma.notify("USER HAS PAID");  
  } else {  
    // figma.payments.status.type === "UNPAID"  
    const ONE_DAY_IN_SECONDS = 60 * 60 * 24;  
    const secondsSinceFirstRun = figma.payments.getUserFirstRanSecondsAgo();  
    const daysSinceFirstRun = secondsSinceFirstRun / ONE_DAY_IN_SECONDS;  
    if (daysSinceFirstRun > 3) {  
      await figma.payments.initiateCheckoutAsync({  
        interstitial: "TRIAL_ENDED",  
      });  
      if (figma.payments.status.type === "UNPAID") {  
        figma.notify("USER CANCELLED CHECKOUT");  
      } else {  
        figma.notify("USER JUST PAID");  
      }  
    } else {  
      figma.notify("USER IS IN THREE DAY TRIAL PERIOD");  
    }  
  }  
  figma.closePlugin();  
}  
  
run();
```

You can find more examples of using the Payments API [here](/docs/plugins/api/figma-payments/#code-examples).

## When to call `initiateCheckoutAsync`[​](#when-to-call-initiatecheckoutasync "Direct link to when-to-call-initiatecheckoutasync")

The main way to kick off the checkout flow is to call [`figma.payments.initiateCheckoutAsync`](/docs/plugins/api/figma-payments/#initiatecheckoutasync). When called, the user will be prompted to enter their payment information and purchase your resource.

There are certain cases where calling [`figma.payments.initiateCheckoutAsync`](/docs/plugins/api/figma-payments/#initiatecheckoutasync) will throw an exception and this table describes how to avoid them:

| Case | Workaround |
| --- | --- |
| Query mode with [Plugin Parameters](/docs/plugins/plugin-parameters/) | Put calls to this function inside your "run" event handler. |
| Query mode with [Text Review Plugins](/docs/plugins/textreview-plugins/) | Use [`figma.payments.requestCheckout`](/docs/plugins/api/figma-payments/#requestcheckout) instead. |
| During widget rendering | Put calls to this function inside your widget event handlers. |

- [Introduction](#introduction)
- [Getting Started](#getting-started)
- [An Example](#an-example)
- [When to call `initiateCheckoutAsync`](#when-to-call-initiatecheckoutasync)