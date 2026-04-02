# DropEvent

**Source:** https://developers.figma.com/docs/plugins/api/DropEvent/

---

```
interface DropEvent {  
 node: BaseNode | SceneNode  
 x: number  
 y: number  
 absoluteX: number  
 absoluteY: number  
 items: DropItem[]  
 files: DropFile[]  
 dropMetadata?: any  
}
```