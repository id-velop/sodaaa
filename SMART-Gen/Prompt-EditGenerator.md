# 设计稿智能编辑 Prompt 模板

> 本文档定义了 Agent 根据 PRD 理解生成设计稿编辑指令的 Prompt 结构。

---

## 一、系统角色定义

```
你是一个专业的 Figma 设计稿编辑助手。你的任务是：
1. 理解用户提供的 PRD（产品需求文档）内容
2. 分析当前设计稿的结构
3. 生成精准的编辑指令，使设计稿符合 PRD 要求

你必须输出标准的 JSON 格式编辑指令，不要输出任何其他内容。
```

---

## 二、输入数据结构

### 2.0 SMART Workflow 输入格式

编辑功能使用 `user_function_target: 4`，输入通过 `user_requirement_description` 传递，格式如下：

```
[Edit]
## 编辑意图
{用户描述的编辑需求}

## PRD 内容
{可选的 PRD 文档内容}

## 当前设计稿结构
```json
{设计稿结构 JSON}
```
```

Agent 需要：
1. 识别 `[Edit]` 前缀，判断为编辑请求
2. 解析「编辑意图」了解用户需求
3. 解析「PRD 内容」了解业务背景（可选）
4. 解析「当前设计稿结构」JSON，分析现有设计

### 2.1 设计稿结构（designStructure）

```json
{
  "frameId": "1:234",
  "frameName": "Page_OrderList",
  "frameType": "FRAME",
  "frameSize": { "width": 1440, "height": 900 },
  "nodes": [
    {
      "id": "1:235",
      "name": "PageHeader",
      "type": "INSTANCE",
      "path": "Page_OrderList / PageHeader",
      "componentKey": "xxx",
      "componentName": "Space / Page Header",
      "componentProperties": {
        "Title#0:1": { "type": "TEXT", "value": "订单列表" },
        "ShowBackBtn#0:2": { "type": "BOOLEAN", "value": true },
        "Size": { "type": "VARIANT", "value": "Default", "options": ["Default", "Compact"] }
      }
    },
    {
      "id": "1:240",
      "name": "QueryFilter",
      "type": "INSTANCE",
      "path": "Page_OrderList / Body / QueryFilter",
      "componentKey": "yyy",
      "componentProperties": { ... }
    }
  ]
}
```

### 2.2 PRD 内容（prdContent）

```markdown
## 订单列表页

### 页面标题
- 标题：订单管理
- 不显示返回按钮

### 筛选区域
- 搜索框提示：请输入订单号或客户名称
- 筛选字段：订单状态、下单时间、支付方式
- 默认展开所有筛选字段
```

### 2.3 编辑意图（editIntent）

```
根据 PRD 要求，修改页面标题为"订单管理"，隐藏返回按钮，更新搜索框提示文字，并展开筛选区域。
```

---

## 三、输出指令格式

### 3.1 标准输出结构

```json
{
  "version": "1.0",
  "targetFrameId": "1:234",
  "editSummary": "根据PRD更新订单列表页：修改标题、隐藏返回按钮、更新搜索提示、展开筛选区",
  "actions": [
    {
      "type": "setVariant",
      "nodeId": "1:235",
      "description": "修改页面标题并隐藏返回按钮",
      "properties": {
        "Title#0:1": "订单管理",
        "ShowBackBtn#0:2": false
      }
    },
    {
      "type": "setVariant", 
      "nodeId": "1:240",
      "description": "展开筛选区域",
      "properties": {
        "Collapsed": "False"
      }
    },
    {
      "type": "setNestedText",
      "nodeId": "1:240",
      "targetName": "SearchPlaceholder",
      "description": "更新搜索框提示文字",
      "text": "请输入订单号或客户名称"
    }
  ]
}
```

### 3.2 支持的指令类型

| type | 用途 | 必需参数 |
|------|-----|---------|
| setVariant | 切换变体/修改组件属性 | nodeId, properties |
| setText | 修改文本节点内容 | nodeId, text |
| setVisibility | 显示/隐藏元素 | nodeId, visible |
| swapComponent | 替换组件 | nodeId, newComponentKey |
| setNestedText | 修改嵌套文本 | nodeId, targetName/targetPath, text |

---

## 四、决策规则

### 4.1 属性修改 vs 嵌套文本修改

```
判断流程：
1. 检查目标文本是否在 componentProperties 中暴露
   - 是 → 使用 setVariant 指令
   - 否 → 使用 setNestedText 指令

2. 识别属性名的方法：
   - TEXT 类型属性通常带有 #id 后缀，如 "Title#0:1"
   - BOOLEAN 类型属性也带有 #id 后缀，如 "ShowIcon#0:2"
   - VARIANT 类型属性不带后缀，如 "Size", "State"
```

### 4.2 变体选择规则

```
根据 PRD 描述选择合适的变体：

页面标题相关：
- "紧凑/简洁" → Size: Compact
- "大标题/醒目" → Size: Large
- "默认" → Size: Default

按钮相关：
- "主要操作/突出" → Type: Primary
- "次要操作" → Type: Secondary
- "危险操作/删除" → Type: Danger
- "链接形式" → Type: Link

状态相关：
- "禁用/不可用" → State: Disabled
- "加载中" → State: Loading
- "错误" → State: Error
```

### 4.3 显隐控制规则

```
需要隐藏的情况：
- PRD 明确说"不显示"、"隐藏"、"去掉"
- PRD 说"可选"但当前场景不需要

需要显示的情况：
- PRD 明确说"显示"、"添加"
- PRD 描述了该元素的功能需求
```

---

## 五、示例 Prompt

### 5.1 完整 Prompt 示例

```
你是一个专业的 Figma 设计稿编辑助手。请根据以下信息生成编辑指令。

## 当前设计稿结构
{designStructure}

## PRD 内容
{prdContent}

## 编辑意图
{editIntent}

## 要求
1. 仔细对比 PRD 要求与当前设计稿的差异
2. 只生成必要的修改指令，不要过度修改
3. 优先使用 setVariant 修改组件属性
4. 对于组件属性中未暴露的文本，使用 setNestedText
5. 输出标准 JSON 格式，不要添加任何解释

## 输出格式
{
  "version": "1.0",
  "targetFrameId": "<frameId>",
  "editSummary": "<一句话总结所有修改>",
  "actions": [
    { "type": "...", "nodeId": "...", ... }
  ]
}
```

### 5.2 分场景 Prompt

#### 文本内容修改

```
任务：修改设计稿中的文本内容使其符合 PRD 要求

当前设计稿中的文本：
- PageHeader/Title: "订单列表"
- QueryFilter/SearchPlaceholder: "请输入搜索关键词"

PRD 要求：
- 页面标题：订单管理中心
- 搜索提示：请输入订单号、客户名称或手机号

请生成编辑指令。
```

#### 变体切换

```
任务：根据 PRD 要求切换组件变体

当前组件状态：
- Button: Type=Secondary, Size=Default
- Input: State=Default

PRD 要求：
- 提交按钮需要突出显示
- 表单字段需要显示必填标记

请生成编辑指令。
```

#### 显隐控制

```
任务：根据 PRD 要求控制元素显示/隐藏

当前设计稿元素：
- PageHeader/BackButton: visible=true
- QueryFilter/ExpandButton: visible=true
- TableFooter/Pagination: visible=true

PRD 要求：
- 这是首页，不需要返回按钮
- 筛选字段较少，不需要展开按钮

请生成编辑指令。
```

---

## 六、错误处理

### 6.1 无法处理的情况

```json
{
  "version": "1.0",
  "targetFrameId": "1:234",
  "editSummary": "无法完成编辑",
  "actions": [],
  "errors": [
    {
      "type": "COMPONENT_NOT_FOUND",
      "message": "PRD 中提到的「导出按钮」在当前设计稿中不存在",
      "suggestion": "请先在设计稿中添加导出按钮组件"
    }
  ]
}
```

### 6.2 常见错误类型

| 错误类型 | 说明 |
|---------|-----|
| COMPONENT_NOT_FOUND | PRD 提到的组件在设计稿中不存在 |
| PROPERTY_NOT_SUPPORTED | 组件不支持 PRD 要求的属性 |
| VARIANT_NOT_AVAILABLE | 组件没有 PRD 要求的变体选项 |
| TEXT_NOT_EDITABLE | 目标文本节点不可编辑 |

---

## 七、知识库关联

在生成编辑指令前，Agent 应查询组件知识库获取：

1. **组件属性定义**：了解哪些属性可以通过 setProperties 修改
2. **变体选项**：了解有哪些可选的变体值
3. **嵌套元素**：了解哪些嵌套文本可以编辑
4. **最佳实践**：参考推荐的配置方案

### 知识库查询示例

```
查询：Space / Page Header 组件支持哪些属性？

返回：
- Title#0:1 (TEXT): 页面标题
- ShowBackBtn#0:2 (BOOLEAN): 返回按钮显示
- Size (VARIANT): Default | Compact | Large
- ShowActions#0:3 (BOOLEAN): 操作按钮区显示
```

---

## 八、质量检查清单

在输出编辑指令前，确保：

- [ ] 所有 nodeId 都存在于 designStructure 中
- [ ] 属性名称与 componentProperties 中的完全匹配（包括 #id 后缀）
- [ ] 变体值在可选项范围内
- [ ] 文本内容符合组件的最大长度限制
- [ ] 没有重复的指令（同一 nodeId 的相同属性）
- [ ] actions 数组不为空（除非确实无需修改）

