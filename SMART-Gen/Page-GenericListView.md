# Pages
| id                   | type | title      |
| -------------------- | ---- | ---------- |
| Page_GenericListView | Page | 通用列表页 |

# Page
| id                   | type | title      | tags            | updated    | frame_id     | frame_variant |
| -------------------- | ---- | ---------- | --------------- | ---------- | ------------ | ------------- |
| Page_GenericListView | Page | 通用列表页 | page, uikit, ei | 2025-10-22 | frame.layout | WithSidebar   |

# Definition
用于展示成批业务对象并支持筛选、排序与批量处理的任务型页面。适用于用户以“定位并处理一批目标”为核心目标的场景，如审阅记录、选择对象执行操作或导出结果。不适用于需要逐一深度阅读与决策的场景（此类应使用详情页）。

# UseCases
- 浏览并快速定位目标对象
- 执行批量操作或单项操作
- 导出或交接处理结果



# Slot

| page_id              | slot    | order | component_ref        | props                                                        | figma_key                                | notes                                                        |
| -------------------- | ------- | ----- | -------------------- | ------------------------------------------------------------ | ---------------------------------------- | ------------------------------------------------------------ |
| Page_GenericListView | content | 1     | Space / Page Header  | **variant(Level=Basic, Breadcrumbs=False, Meta Info=False, Tab=False, Alert=-)**; title.description=false; title.buttongroup=false; title.tag=false | edb01aafdbf6fcbf6be112c207fd48b87ec03c1c | contentFrame.counterAxisAlignItems="STRETCH"                 |
| Page_GenericListView | content | 2     | Space / Query Filter | **variant(Collapsed=True, Type="General Search & Quick Filter")**; | 5e8e64f8381096ee8334cf4c3fce6be9b70e263a | containerFrame.width=1440; contentFrame.counterAxisAlignItems="CENTER"; |
| Page_GenericListView | content | 3     | Space / Full Table   |                                                              | 2285c34515b50309c9c12e292a2ee4641dc0b031 | containerFrame.width=1440; contentFrame.counterAxisAlignItems="CENTER"; |


# Constraints
- 暂无约束；供后续补充行为与数据依赖规则。

# Keywords
列表页, 通用列表, 数据表格, 检索, 批量操作, List View, Data Table
