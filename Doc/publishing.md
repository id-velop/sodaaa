# Publishing

**Source:** https://developers.figma.com/docs/plugins/publishing/

---

When developing a plugin, it's reasonable (sometimes even advisable) to focus on the core use case of your plugin and make sure that it works when the user does what you expect. That's the "first 80% of the work".

However, there's often a "second 80% of the work" needed to make sure that your plugin does something reasonable in situations that you didn't expect. Here's a checklist of things worth thinking about. This list is not meant to be exhaustive, and we will add to it over time:

- Have you loaded all the data your plugin needs?
  - Do you need to [access pages](/docs/plugins/accessing-document/#loading-pages-and-nodes) other than the user's current page?
- If your plugin is only meant to do something if a certain [type of nodes](/docs/plugins/api/nodes/) is selected, what happens when:
  - The user has nothing selected?
  - The wrong type of node selected?
  - Multiple things selected?
  - A component selected? Are you alright with the change propagating to potentially hundreds of instances?
- If your plugin modifies a text layer, what happens [if the font for that text layer is missing?](/docs/plugins/working-with-text/#missing-fonts)
- If your plugin can edit a [component](/docs/plugins/api/ComponentNode/), what happens if the component comes from the team library?
- If your plugin needs to load resources over the network, what happens if the user is temporary offline when they run your plugin?
- If your plugin stays open for a while:
  - What happens if the user [deletes a node](/docs/plugins/api/properties/nodes-removed/) you currently have a reference to?
  - What happens a multiplayer even causes changes in the document?
- If your plugin is concerned with the position of layers, what happens if something is rotated?
- If your plugin can traverse large parts of the document (e.g. search for a node), what happens if the document is [very large](/docs/plugins/frozen-plugins/)?
  - Can you [load pages only as needed](/docs/plugins/how-plugins-run/#file-loading) instead of loading the whole document?
- If you're using a bundler, have you checked the output size of your plugin? Could you make it smaller (e.g. by running your bundler in release mode)?

Read more about our [plugin review guidelines](https://help.figma.com/hc/en-us/articles/360039958914).