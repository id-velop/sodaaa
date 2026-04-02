# SlidesViewChangeEvent

**Source:** https://developers.figma.com/docs/plugins/api/SlidesViewChangeEvent/

---

This event is triggered when the user toggles between grid view and single slide view in Figma Slides.

```
interface SlidesViewChangeEvent {  
  view: 'GRID' | 'SINGLE_SLIDE'  
}
```

To read the current view, use the [`figma.viewport.slidesView`](/docs/plugins/api/properties/figma-viewport-slidesview/) property.