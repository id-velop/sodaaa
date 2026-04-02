# 组件知识库文档模板

> 本模板用于 Agent 理解组件并进行精准的设计稿生成与编辑操作。

---

## 一、基础信息（Basic Info）

### 1.1 bizComponents

| 字段 | 值 |
|-----|-----|
| id | Space / Query Filter |
| type | bizComponents |
| title | Query Filter 查询筛选 |
| tags | query, filter, search, uikit |
| updated | 2025-12-22 |
| maintainer | @design-system-team |

### 1.2 Pattern

| 字段 | 值 |
|-----|-----|
| pattern_id | Space / Query Filter |
| title | 查询筛选（容器+布局） |
| figma_key | `5e8e64f8381096ee8334cf4c3fce6be9b70e263a` |
| figma_url | https://www.figma.com/file/xxx?node-id=xxx |

---

## 二、组件定义（Definition）

### 2.1 概述

Query Filter 是页面中的查询过滤模式，提供统一的搜索与筛选能力。常用于数据列表页、监控页，帮助用户快速定位数据。

### 2.2 适用场景

| 场景 | 适用度 | 说明 |
|-----|-------|-----|
| 数据列表页 | ✅ 强烈推荐 | 标准使用场景 |
| 监控/仪表盘页 | ✅ 推荐 | 筛选监控数据 |
| 表单页 | ❌ 不适用 | 应使用表单组件 |
| 详情页 | ❌ 不适用 | 详情页无需筛选 |

### 2.3 关键词（Keywords）

```
query filter, 搜索筛选, General Search, 快速筛选, Query Filter, 
查询筛选区, 条件组合查询, 多字段搜索, 快速筛选
```

---

## 三、变体系统（Variant System）

### 3.1 变体维度（VariantDimensions）

| 维度 | 选项 | 说明 |
|-----|------|-----|
| Collapsed | True / False | 是否折叠展示 |
| Type | General Search & Quick Filter / Advanced | 筛选类型 |

### 3.2 变体列表（Variants）

| variant_id | 维度值组合 | figma_key | 适用场景 |
|------------|-----------|-----------|---------|
| QF_CollapsedTrue_GeneralQuick | Collapsed=True; Type=General Search & Quick Filter | `5e8e64f8381096ee8334cf4c3fce6be9b70e263a` | 简单筛选、字段少 |
| QF_CollapsedFalse_GeneralQuick | Collapsed=False; Type=General Search & Quick Filter | `xxx` | 需要展开更多字段 |
| QF_CollapsedTrue_Advanced | Collapsed=True; Type=Advanced | `xxx` | 复杂高级筛选 |

### 3.3 变体选择规则（VariantSelectionRules）

> **此部分是 Agent 选择正确变体的关键**

| PRD 条件 / 关键词 | 推荐变体 | 原因 |
|------------------|----------|------|
| "简单筛选"、"基础搜索"、"快速查询" | QF_CollapsedTrue_GeneralQuick | 默认选择，简洁高效 |
| "高级筛选"、"复杂条件"、"多维度" | QF_CollapsedTrue_Advanced | 支持复杂条件组合 |
| "展开显示"、"默认展开" | QF_CollapsedFalse_* | 需要展开更多字段 |
| 筛选字段 ≤ 3 个 | Collapsed=True | 字段少，折叠即可 |
| 筛选字段 > 5 个 | Collapsed=False + Expand | 需要展开/收起功能 |

---

## 四、组件属性（ComponentProperties）

> **此部分是 Agent 进行 setProperties 编辑的关键**

### 4.1 属性列表

| property_id | type | default_value | options | description |
|-------------|------|---------------|---------|-------------|
| Collapsed | VARIANT | True | True, False | 是否折叠 |
| Type | VARIANT | General Search & Quick Filter | General Search & Quick Filter, Advanced | 筛选类型 |
| SearchPlaceholder#0:1 | TEXT | "请输入搜索关键词" | - | 搜索框占位文本 |
| ShowReset#0:2 | BOOLEAN | true | true, false | 是否显示重置按钮 |
| ShowExpand#0:3 | BOOLEAN | false | true, false | 是否显示展开按钮 |
| FilterCount#0:4 | TEXT | "3" | - | 默认显示的筛选项数量 |

### 4.2 属性使用示例

```javascript
// 切换为高级筛选模式
instance.setProperties({
  "Type": "Advanced",
  "ShowExpand#0:3": true
});

// 修改搜索框提示文字
instance.setProperties({
  "SearchPlaceholder#0:1": "搜索订单号、客户名称..."
});
```

---

## 五、插槽结构（Slots）

| slot_name | component_ref | figma_key | required | notes |
|-----------|--------------|-----------|----------|-------|
| SearchField | Space / Input / Search | `xxx` | 是 | 主搜索输入框 |
| FilterFields | Space / Form / Field | `xxx` | 否 | 筛选字段（可多个） |
| ActionButtons | Space / Button / Group | `xxx` | 是 | 操作按钮组（搜索/重置） |
| ExpandArea | Space / Collapse / Panel | `xxx` | 否 | 展开区域 |

---

## 六、可编辑嵌套元素（EditableNestedElements）

> **此部分用于 setNestedText 指令定位嵌套元素**

| element_name | path | type | description | editable |
|--------------|------|------|-------------|----------|
| SearchPlaceholder | SearchField/Input/Placeholder | TEXT | 搜索框占位文本 | ✅ |
| ResetButtonLabel | ActionButtons/ResetBtn/Label | TEXT | 重置按钮文字 | ✅ |
| SearchButtonLabel | ActionButtons/SearchBtn/Label | TEXT | 搜索按钮文字 | ✅ |
| ExpandLabel | ExpandArea/Toggle/Label | TEXT | 展开/收起文字 | ✅ |

### 6.1 嵌套元素编辑示例

```javascript
// 修改重置按钮文字
{
  "type": "setNestedText",
  "nodeId": "1:300",
  "targetName": "ResetButtonLabel",
  "text": "清空条件"
}

// 通过路径修改
{
  "type": "setNestedText",
  "nodeId": "1:300",
  "targetPath": "ActionButtons/ResetBtn/Label",
  "text": "清空条件"
}
```

---

## 七、布局规范（Layout）

### 7.1 尺寸与间距

| 属性 | 值 | 说明 |
|-----|-----|-----|
| 容器左右内边距 | 24px | 随页面 container 对齐 |
| 字段栅格 | 等宽列 | 响应式布局 |
| 列间距 | 16px | 字段之间的水平间距 |
| 行间距 | 16px | 字段之间的垂直间距 |
| 操作区对齐 | 右对齐 | 按钮组右对齐，与字段区垂直居中 |

### 7.2 响应式规则

| 断点 | 列数 | 说明 |
|-----|------|-----|
| ≤ 768px | 1 列 | 移动端 |
| 769px - 1024px | 2 列 | 平板 |
| ≥ 1025px | 3-4 列 | 桌面端 |

---

## 八、约束与规则（Constraints）

### 8.1 布局约束

- **Search** 固定在最右
- **Reset** 常驻显示
- **Expand** 管理额外字段
- 字段上限按一行排布，超过则收起到 Expand
- 保持默认视图简洁

### 8.2 交互约束

- 字段与按钮对齐在同一基线
- 不同控件高度保持一致
- 搜索操作需要有明确的反馈

---

## 九、最佳实践（BestPractices）

### 9.1 设计建议

| 建议 | 说明 |
|-----|-----|
| General Search 置最左 | 高频操作优先展示 |
| 高频字段前置 | 常用筛选条件靠前 |
| Rare 字段藏于 Expand | 避免一次性平铺过多字段 |
| 复杂动作归入按钮组 | 自定义筛选、保存方案等统一呈现 |

### 9.2 反模式（避免）

| 反模式 | 说明 |
|-------|-----|
| 筛选字段过多 | 单行超过 5 个字段应折叠 |
| 无重置按钮 | 用户需要快速清空条件 |
| 搜索按钮不明显 | 主操作应突出显示 |

---

## 十、多语言支持（i18n）

### 10.1 默认文本

| 元素 | 中文 | English |
|-----|------|---------|
| SearchPlaceholder | 请输入搜索关键词 | Enter search keywords |
| SearchButton | 搜索 | Search |
| ResetButton | 重置 | Reset |
| ExpandLabel | 展开 | Expand |
| CollapseLabel | 收起 | Collapse |

### 10.2 文本替换示例

```javascript
// 切换为英文
{
  "actions": [
    { "type": "setNestedText", "nodeId": "1:300", "targetName": "SearchButtonLabel", "text": "Search" },
    { "type": "setNestedText", "nodeId": "1:300", "targetName": "ResetButtonLabel", "text": "Reset" }
  ]
}
```

---

## 十一、版本历史（Changelog）

| 版本 | 日期 | 变更内容 |
|-----|------|---------|
| v1.0.0 | 2025-12-01 | 初始版本 |
| v1.1.0 | 2025-12-15 | 新增 Advanced 类型 |
| v1.2.0 | 2025-12-22 | 添加编辑功能支持 |

---

## 附录

### A. Agent 快速决策树

```
用户需求是否包含「筛选」「查询」「搜索」关键词？
  ├─ 是 → 使用 Query Filter 组件
  │      ├─ 字段数 ≤ 3 且无复杂条件 → QF_CollapsedTrue_GeneralQuick
  │      ├─ 字段数 > 3 或需要展开 → QF_CollapsedFalse_GeneralQuick
  │      └─ 需要复杂条件组合 → QF_CollapsedTrue_Advanced
  └─ 否 → 考虑其他组件
```

### B. 编辑指令模板

```json
{
  "version": "1.0",
  "targetFrameId": "1:234",
  "actions": [
    {
      "type": "setVariant",
      "nodeId": "1:300",
      "properties": {
        "Type": "Advanced",
        "Collapsed": "False"
      }
    },
    {
      "type": "setText",
      "nodeId": "1:301",
      "text": "搜索订单号..."
    },
    {
      "type": "setVisibility",
      "nodeId": "1:302",
      "visible": false
    }
  ]
}
```

### C. 常见编辑场景

| 场景 | 指令类型 | 示例 |
|-----|---------|-----|
| 修改搜索提示文字 | setText / setNestedText | 更新 placeholder |
| 切换为高级筛选 | setVariant | Type=Advanced |
| 隐藏重置按钮 | setVisibility | visible=false |
| 更换搜索图标 | swapComponent | 替换 Icon 组件 |

