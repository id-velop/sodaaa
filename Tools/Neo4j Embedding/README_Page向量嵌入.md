# Page节点向量嵌入工具

这个工具专门用于处理Neo4j数据库中Page节点的向量嵌入生成，将文本属性转换为向量形式以支持语义搜索和相似度匹配。

## 📋 功能特性

- ✅ **多属性支持**：处理Page节点的所有文本属性
- ✅ **灵活处理方式**：提供综合向量和属性级向量两种模式
- ✅ **错误处理**：完善的异常处理和错误恢复机制
- ✅ **进度监控**：实时显示处理进度和统计信息
- ✅ **批量处理**：高效处理大量节点数据

## 🎯 处理的属性

脚本会处理Page节点的以下属性：

| 属性名 | 说明 | 中文说明 |
|--------|------|----------|
| `name` | 页面名称 | 页面英文名称 |
| `name_cn` | 中文页面名称 | 页面的中文名称 |
| `description_cn` | 中文描述 | 页面的详细中文描述 |
| `description_en` | 英文描述 | 页面的详细英文描述 |
| `usage_scenario_cn` | 中文使用场景 | 中文使用场景描述 |
| `usage_scenario_en` | 英文使用场景 | 英文使用场景描述 |

## 🔧 配置要求

### 1. Ollama服务
确保Ollama服务正在运行，并已下载`bge-m3`模型：

```bash
# 启动Ollama服务
ollama serve

# 下载bge-m3模型（如果还没有）
ollama pull bge-m3
```

### 2. Neo4j数据库
确保Neo4j数据库正在运行，并且包含Page节点数据。

### 3. Python依赖
安装所需的Python包：

```bash
pip install requests neo4j
```

## 🚀 使用方法

### 方式一：运行主脚本（推荐）

```bash
cd /path/to/your/neo4j/folder
python page向量嵌入.py
```

运行后会显示选择菜单：

```
请选择处理方式:
1. 生成综合向量 (将所有属性组合成一个向量)
2. 生成属性级向量 (为每个属性分别生成向量)
3. 两种方式都执行
```

### 方式二：直接调用函数

```python
from page向量嵌入 import process_page_embeddings, process_page_embeddings_separate

# 生成综合向量
process_page_embeddings()

# 生成属性级向量
process_page_embeddings_separate()
```

## 📊 处理方式详解

### 1. 综合向量模式
- 将所有文本属性组合成一个完整的文本
- 生成一个统一的向量嵌入
- 存储在节点的`embedding`属性中
- 适用于整体语义相似度搜索

**示例文本组合**：
```
页面名称: List Data Management Page
中文页面名称: 数据表格查询页面
中文描述: 企业级管理系统的通用数据列表页...
英文描述: A General Data List Page in Enterprise-level Management Systems...
中文使用场景: 1. DNS 服务组管理：用户可查看已注册的 DNS 命名服务...
英文使用场景: 1. DNS Service Group Management: Users can view registered DNS naming services...
```

### 2. 属性级向量模式
- 为每个属性单独生成向量
- 分别存储在对应的嵌入属性中
- 支持属性级别的精确匹配
- 适用于细粒度的语义搜索

**生成的向量字段**：
- `embedding_name` - 页面名称向量
- `embedding_name_cn` - 中文页面名称向量
- `embedding_description_cn` - 中文描述向量
- `embedding_description_en` - 英文描述向量
- `embedding_usage_scenario_cn` - 中文使用场景向量
- `embedding_usage_scenario_en` - 英文使用场景向量

## 📈 输出结果

### 处理日志示例

```
🚀 开始Page节点向量嵌入处理...
==================================================
请选择处理方式:
1. 生成综合向量 (将所有属性组合成一个向量)
2. 生成属性级向量 (为每个属性分别生成向量)
3. 两种方式都执行
请输入选择 (1/2/3): 3

🔄 执行方式3: 两种方式都执行
📋 可用数据库: ['system', 'neo4j', 'your_database']
🎯 使用数据库: your_database
🔍 查询所有Page节点...
📊 找到 5 个Page节点，开始生成向量嵌入...

⏳ 处理第 1/5 个节点 (ID: 123)
📝 生成向量嵌入的文本内容: 页面名称: List Data Management Page
中文页面名称: 数据表格查询页面
...
✅ 节点 ID 123 的向量嵌入已成功写入

📊 处理完成统计:
✅ 成功处理: 5 个节点
❌ 处理失败: 0 个节点
📈 总处理节点: 5 个
🎉 Page节点向量嵌入生成完成！
```

## 🔍 查询示例

### 使用综合向量进行相似度搜索

```cypher
// 查找语义相似的页面
MATCH (p:Page)
WHERE p.embedding IS NOT NULL
WITH p, gds.similarity.cosine(p.embedding, $query_embedding) AS similarity
WHERE similarity > 0.7
RETURN p.name, p.name_cn, similarity
ORDER BY similarity DESC
```

### 使用属性级向量进行精确搜索

```cypher
// 根据描述语义查找页面
MATCH (p:Page)
WHERE p.embedding_description_cn IS NOT NULL
WITH p, gds.similarity.cosine(p.embedding_description_cn, $query_embedding) AS similarity
WHERE similarity > 0.8
RETURN p.name, p.name_cn, p.description_cn, similarity
ORDER BY similarity DESC
```

## ⚠️ 注意事项

1. **数据备份**：在运行脚本前建议备份Neo4j数据库
2. **网络连接**：确保能够访问Ollama API (http://localhost:11434)
3. **内存使用**：处理大量节点时注意内存使用情况
4. **向量维度**：bge-m3模型生成的向量维度为1024
5. **性能考虑**：大量节点的处理可能需要较长时间

## 🛠️ 故障排除

### 常见问题

1. **连接Neo4j失败**
   - 检查Neo4j服务是否正在运行
   - 验证连接参数（URI、用户名、密码）

2. **Ollama API不可用**
   - 确保Ollama服务正在运行：`ollama serve`
   - 检查API地址是否正确

3. **模型未找到**
   - 下载bge-m3模型：`ollama pull bge-m3`

4. **内存不足**
   - 减少批量处理的大小
   - 增加系统内存或使用分页处理

## 📝 技术说明

- **向量模型**：使用bge-m3嵌入模型，支持中英文混合内容
- **相似度算法**：使用余弦相似度进行向量比较
- **存储格式**：向量以float数组形式存储在Neo4j节点属性中
- **性能优化**：支持批量处理和错误恢复机制

## 🤝 贡献

如有问题或建议，请提交Issue或Pull Request。

---

**最后更新时间**: 2024年12月
**版本**: v1.0.0
