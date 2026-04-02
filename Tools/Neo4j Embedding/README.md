# Neo4j 向量嵌入工具集

这个工具集提供了完整的Neo4j节点向量嵌入解决方案，支持将文本属性转换为向量形式以实现语义搜索和相似度匹配。

## 🎯 工具概览

| 工具文件 | 功能说明 | 适用节点类型 |
|---------|----------|-------------|
| `向量嵌入.py` | 通用向量嵌入工具 | 所有节点类型 |
| `page向量嵌入.py` | Page节点专用向量嵌入 | Page节点 |
| `Variant 向量嵌入.py` | Variant节点专用向量嵌入 | Variant节点 |
| `test_page_embedding.py` | Page节点嵌入测试工具 | 测试用途 |

## 📋 功能特性

- ✅ **多节点类型支持**：支持Page、Variant等不同类型的节点
- ✅ **多属性处理**：处理节点的所有文本属性
- ✅ **灵活嵌入模式**：支持综合向量和属性级向量两种模式
- ✅ **错误处理**：完善的异常处理和错误恢复机制
- ✅ **进度监控**：实时显示处理进度和统计信息
- ✅ **批量处理**：高效处理大量节点数据

## 🔧 环境要求

### 1. Ollama服务
确保Ollama服务正在运行，并已下载`bge-m3`模型：

```bash
# 启动Ollama服务
ollama serve

# 下载bge-m3模型（如果还没有）
ollama pull bge-m3
```

### 2. Neo4j数据库
确保Neo4j数据库正在运行，并且包含相应的节点数据。

### 3. Python依赖
安装所需的Python包：

```bash
pip install requests neo4j
```

## 🚀 使用指南

### Page节点向量嵌入

```bash
# 运行Page节点专用工具
python page向量嵌入.py
```

处理的属性包括：
- `name` - 页面名称
- `name_cn` - 中文页面名称  
- `description_cn` - 中文描述
- `description_en` - 英文描述
- `usage_scenario_cn` - 中文使用场景
- `usage_scenario_en` - 英文使用场景

### Variant节点向量嵌入

```bash
# 运行Variant节点专用工具
python "Variant 向量嵌入.py"
```

处理Variant节点的相关文本属性，生成语义向量用于变体匹配。

### 通用向量嵌入

```bash
# 运行通用向量嵌入工具
python 向量嵌入.py
```

支持自定义节点类型和属性的向量嵌入生成。

### 测试工具

```bash
# 运行测试工具验证嵌入效果
python test_page_embedding.py
```

## 📊 嵌入模式

### 1. 综合向量模式
- 将所有文本属性组合成一个完整的文本
- 生成一个统一的向量嵌入
- 存储在节点的`embedding`属性中
- 适用于整体语义相似度搜索

### 2. 属性级向量模式
- 为每个属性单独生成向量
- 分别存储在对应的嵌入属性中（如`embedding_name`、`embedding_description_cn`等）
- 支持属性级别的精确匹配
- 适用于细粒度的语义搜索

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

## ⚙️ 配置说明

所有工具都使用相同的配置参数：

```python
# Ollama API配置
OLLAMA_URL = "http://localhost:11434/api/embeddings"

# Neo4j数据库配置
NEO4J_URI = "bolt://localhost:7687"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = "your_password"  # 请修改为实际密码
```

## 📈 性能优化

- **批量处理**：工具支持批量处理多个节点，提高处理效率
- **错误恢复**：遇到单个节点处理失败时，继续处理其他节点
- **进度显示**：实时显示处理进度，便于监控长时间运行的任务
- **内存管理**：合理管理内存使用，避免大数据集处理时的内存溢出

## ⚠️ 注意事项

1. **数据备份**：在运行脚本前建议备份Neo4j数据库
2. **网络连接**：确保能够访问Ollama API (http://localhost:11434)
3. **密码安全**：请修改脚本中的数据库密码为实际密码
4. **向量维度**：bge-m3模型生成的向量维度为1024
5. **处理时间**：大量节点的处理可能需要较长时间，请耐心等待

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
- **API协议**：使用Ollama的标准嵌入API接口

## 🤝 贡献

如有问题或建议，请提交Issue或Pull Request。

---

**最后更新时间**: 2025年9月15日
**版本**: v2.0.0