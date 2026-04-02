# AnnotationCategory

**Source:** https://developers.figma.com/docs/plugins/api/AnnotationCategory/

---

On this page

## AnnotationCategory properties[​](#annotationcategory-properties "Direct link to AnnotationCategory properties")

An `AnnotationCategory` is a way to distinguish your [Annotations](/docs/plugins/api/Annotation/). Categories can be given a color and a custom label. This helps different audiences consuming Annotations, for example developers or copy writers, find the Annotations most relevant to their work.

### id: string [readonly]

The unique identifier of the annotation category.

---

### label: string [readonly]

The label of the annotation category.

---

### color: [AnnotationCategoryColor](/docs/plugins/api/AnnotationCategoryColor/) [readonly]

The color of the annotation category.

---

### isPreset: boolean [readonly]

Whether this annotation category is a preset.

---

### remove(): void

Removes this annotation category from the document.

---

### setColor(color: [AnnotationCategoryColor](/docs/plugins/api/AnnotationCategoryColor/)): void

Sets the color of the annotation category.

---

### setLabel(label: string): void

Sets the label of the annotation category.

---

- [AnnotationCategory properties](#annotationcategory-properties)