# Proposed API

**Source:** https://developers.figma.com/docs/plugins/proposed-api/

---

On this page

## What are proposed APIs?[​](#what-are-proposed-apis "Direct link to What are proposed APIs?")

Proposed APIs are APIs that are only available during development. This allows plugin authors to try out new APIs and provide the Figma team feedback about whether the API satisfies their needs, and/or behaves in any unexpected ways. The list of APIs in "proposed" stage is listed on this page below. Having APIs in a proposed stage allows us to change the API based on feedback without breaking published plugins.

APIs will remain in "proposed" stage for 2-4 weeks, depending on the feedback received. Giving us feedback can accelerate the process, as we're looking to see that developers have tested them out! See the [updates](/docs/plugins/updates/) to check if it's been released.

## How do I use proposed APIs?[​](#how-do-i-use-proposed-apis "Direct link to How do I use proposed APIs?")

In the manifest, add `"enableProposedApi": true`. This flag is only meant for development, and will not work in published plugins! You may want to create a separate branch that uses these news APIs if you intend to release regular plugin updates during that time, or hide uses of the API behind if statements.

If you use TypeScript, get the [latest typings](/docs/plugins/api/typings/) with these APIs.

## Current proposed APIs[​](#current-proposed-apis "Direct link to Current proposed APIs")

None at this time.

- [What are proposed APIs?](#what-are-proposed-apis)
- [How do I use proposed APIs?](#how-do-i-use-proposed-apis)
- [Current proposed APIs](#current-proposed-apis)