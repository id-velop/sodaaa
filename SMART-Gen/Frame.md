# Frames

| id             | type  | title                   |
| -------------- | ----- | ----------------------- |
| Frame_AppShell | Frame | Application Shell（壳） |

# Frame

| id             | type  | title                   | tags                                  | updated    |
| -------------- | ----- | ----------------------- | ------------------------------------- | ---------- |
| Frame_AppShell | Frame | Application Shell（壳） | frame, appshell, layout, sidebar, ids | 2025-10-20 |

# Definition

AppShell 是应用级骨架。提供 Topbar、Sidebar、Content 三类位型（SlotType）。多个业务 Page 复用同一壳。布局与尺寸通过 VisualRule 集中治理，可按变体下发并版本化。

# UseCases

- 后台列表、详情页：使用 WithSidebar
- 表单、结果、登录等轻量页：使用 NoSidebar
- 多主题或多密度：切换 VisualRule 组

# SlotTypes

| frame_id       | slot_type | notes                              |
| -------------- | --------- | ---------------------------------- |
| Frame_AppShell | Topbar    | 顶部区：品牌、全局搜索、通知、用户 |
| Frame_AppShell | Sidebar   | 侧栏导航，仅在 WithSidebar 出现    |
| Frame_AppShell | Content   | 业务 Page 的装配范围               |

# SlotDefaults

| frame_id       | slot_type | component       | props                         | figma_key                                | notes                 |
| -------------- | --------- | --------------- | ----------------------------- | ---------------------------------------- | --------------------- |
| Frame_AppShell | Topbar    | Space / Topbar  | variant=Default               | ed9a09eb32ac0c6d39a2e8ecfc3408064852df4f | 默认顶栏。Page 可覆盖 |
| Frame_AppShell | Sidebar   | Space / Sidebar | type=Default; collapsed=false | ae0c3382bfeccfcecd8ead96ac16c8fece1cd5b3 | 仅 WithSidebar 生效   |

# VariantDimensions

| frame_id       | dimension   | options                | guidance             |
| -------------- | ----------- | ---------------------- | -------------------- |
| Frame_AppShell | SidebarMode | WithSidebar, NoSidebar | 后台导航 vs 轻量场景 |

# Variants

| frame_id       | variant_id           | dimension_values        | notes               |
| -------------- | -------------------- | ----------------------- | ------------------- |
| Frame_AppShell | AppShell_WithSidebar | SidebarMode=WithSidebar | 顶栏+侧栏+内容      |
| Frame_AppShell | AppShell_NoSidebar   | SidebarMode=NoSidebar   | 顶栏+内容（无侧栏） |

# VisualRules
说明：规则：`rule_id = "VR." + <主题键> + "." + <后缀>`，全局唯一且不可变。

后缀含义：

-   纯数字＝常量值快照。例：`VR.viewport.1728`（画布宽 1728）、`VR.sidebar.240`（侧栏宽 240）。
    
-   字母代码＝变体/情境代码。例：`VR.content.ws`（WithSidebar）、`VR.content.ns`（NoSidebar）、`VR.bg.default`（默认皮肤）。
    
-   组合时优先“主题→情境/值”。例：`VR.container.ws`、必要时再加层级：`VR.pageheader.ns`.

| rule_id          | scope         | rule                                                         | applies_to  | version | priority | notes                                                        |
| ---------------- | ------------- | ------------------------------------------------------------ | ----------- | ------- | -------- | ------------------------------------------------------------ |
| VR.viewport.1728 | Page          | pageFrame.width=1728                                         | all         | v1      | 100      | 固定画布宽度（由 viewport=1728 改写为 Figma Frame 宽度属性） |
| VR.sidebar.240   | Page          | sidebarFrame.width=240                                       | WithSidebar | v1      | 100      | 侧栏固定宽度（一致）                                         |
| VR.content.ws    | Page          | contentFrame.width=1488                                      | WithSidebar | v1      | 100      | 内容宽度（由 content=1488 改写为 Figma 属性）                |
| VR.container.ws  | Slot(Content) | containerFrame.width=1440; contentFrame.counterAxisAlignItems="CENTER" | WithSidebar | v1      | 100      | 内容区居中（align=center → counterAxisAlignItems）           |
| VR.margin.ws     | Slot(Content) | contentFrame.paddingLeft=24; contentFrame.paddingRight=24; contentFrame.itemSpacing=16 | WithSidebar | v1      | 90       | 左右内边距 24，块间距 16（margin 转 padding 与 itemSpacing） |
| VR.grid.ws       | Page          | pageFrame.layoutGrids=[<br/>  {pattern:"GRID", sectionSize:24, visible:true},<br/>  {pattern:"COLUMNS", count:12, gutterSize:24, alignment:"STRETCH", visible:true}<br/>] | WithSidebar | v1      | 80       | 栅格 12 列（grid.step 与 grid.columns 转为 layoutGrids）     |
| VR.content.ns    | Page          | contentFrame.width=1728                                      | NoSidebar   | v1      | 100      | 无侧栏满宽                                                   |
| VR.container.ns  | Slot(Content) | containerFrame.width=1440; contentFrame.counterAxisAlignItems="CENTER" | NoSidebar   | v1      | 100      | 居中容器                                                     |
| VR.pageheader.ns | Slot(Content) | pageHeader.paddingLeft=144; pageHeader.paddingRight=144      | NoSidebar   | v1      | 90       | 顶部区内边距（header.paddingX → padding 属性）               |
| VR.pagefoot.ns   | Slot(Content) | pageFoot.paddingLeft=144; pageFoot.paddingRight=144          | NoSidebar   | v1      | 90       | 底部区内边距（foot.paddingX → padding 属性）                 |
| VR.bg.default    | Page          | pageFrame.fillStyleId=getPaintStyleId("colorBgLayout")       | all         | v1      | 70       | 布局底色（bg=colorBgLayout → Figma paintStyle）              |

# Constraints

- Page 必须先选择 Frame；只允许使用该 Frame 暴露的 SlotType
- 每个 Slot 必须唯一绑定一个 SlotType，且同一时刻仅挂一个活动 Component
- 所有 Page 继承本 Frame 的 VisualRule；差异只在 Page 的 Layout.overrides 中声明
- WithSidebar：content=1488，container=1440，marginX=24
- NoSidebar：content=1728，container=1440 居中，PageHeader/PageFoot paddingX=144

# BestPractices

- ✅ Frame 只定义 SlotType 与 VisualRule，不承载业务组件
- ✅ Page 以 Slot 粒度装配与覆盖，便于校验与差异对比
- ✅ 规则版本化（v1/v2）用于主题与密度切换
- ❌ 不在 Page 重复书写已由 Frame 定义的规则

# Keywords

## Figma 组件标识

- Space / Topbar, Space / Sidebar

## 场景关键词

AppShell, 应用外壳, 布局, WithSidebar, NoSidebar, 1728, 240, 1488, 1440, margin24, grid24

# Aliases

NoSidebar: ["nosidebar","withoutsidebar","no_sidebar"]
 WithSidebar: ["withsidebar","with_sidebar"]
