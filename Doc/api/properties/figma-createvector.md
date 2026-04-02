# createVector

**Source:** https://developers.figma.com/docs/plugins/api/properties/figma-createvector/

---

On this page

Creates a new, empty vector network with no vertices.

## Signature[​](#signature "Direct link to Signature")

### [createVector](/docs/plugins/api/properties/figma-createvector/)(): [VectorNode](/docs/plugins/api/VectorNode/)

## Remarks[​](#remarks "Direct link to Remarks")

By default, parented under `figma.currentPage`. Without setting additional properties, the vector has a bounding box but doesn't have any vertices. There are two ways to assign vertices to a vector node - [`vectorPaths`](/docs/plugins/api/VectorNode/#vectorpaths) and [`setVectorNetworkAsync`](/docs/plugins/api/VectorNode/#setvectornetworkasync). Please refer to the documentation of those properties for more details.

- [Signature](#signature)
- [Remarks](#remarks)