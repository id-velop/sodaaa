# Get Help

**Source:** https://developers.figma.com/docs/plugins/get-help/

---

On this page

To ask questions about how to use the API, and get resources and help from fellow plugin developers, join our [community-driven Discord server](https://discord.gg/xzQhe2Vcvx).

If you have a feature request or bug reports that are not already documented, use our [support form](https://help.figma.com/hc/en-us/requests/new).

Issues with specific plugins should be sent directly to the plugin author using the contact information provided on that plugin's page.

### How to get your issue resolved faster[​](#how-to-get-your-issue-resolved-faster "Direct link to How to get your issue resolved faster")

When you run into an issue building a plugin, you will get a better & faster answer if you provide more information.

## Include the error message[​](#include-the-error-message "Direct link to Include the error message")

❌ Bad example: "I tried to call node.appendChild, but it ran into an error. What can I do?"

✅ Good example: "I tried to call node.appendChild, but I got an error message 'Cannot move node. Node is an internal, readonly-only node'. I don't understand this error -- what does it mean for a node to be internal?"

## Show the code that didn't do what you expected[​](#show-the-code-that-didnt-do-what-you-expected "Direct link to Show the code that didn't do what you expected")

❌ Bad example: "Is creating boolean operations with plugins broken? I can't see anything after creating one."

✅ Good example: "I'm having difficulties with using figma.createBooleanOperation(). I expected the following to be the equivalent of selecting a rectangle and circle, and unioning them, but instead I see nothing

```
const node = figma.createBooleanOperation()  
node.appendChild(figma.createRectangle())  
node.appendChild(figma.createEllipse())
```

Am I doing something wrong?"

## Provide code and a series of reproducible steps[​](#provide-code-and-a-series-of-reproducible-steps "Direct link to Provide code and a series of reproducible steps")

❌ Bad example: "This error seems to come from internal Figma code, can you fix it?"

✅ Good example: "When I use figma.someAPI, I get an error which I suspect is a bug. Here is the code that I am currently running [attached zip]. To reproduce, open a file containing an image, select the image, run the plugin, and click on the "analyze" button."

- [How to get your issue resolved faster](#how-to-get-your-issue-resolved-faster)
- [Include the error message](#include-the-error-message)
- [Show the code that didn't do what you expected](#show-the-code-that-didnt-do-what-you-expected)
- [Provide code and a series of reproducible steps](#provide-code-and-a-series-of-reproducible-steps)