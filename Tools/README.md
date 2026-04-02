# 数据处理工具集

这个目录包含了项目所需的各种数据处理工具，主要用于Neo4j数据库的数据导出和向量嵌入处理。

## 🛠️ 工具概览

### Neo4j Export - 数据导出工具
**位置**: `Neo4j Export/`

高质量的Neo4j数据导出工具，支持批量导出、属性过滤和性能监控。

**主要功能**:
- ✅ 批量导出避免内存溢出
- ✅ 属性过滤排除embedding相关属性
- ✅ 性能监控和详细日志记录
- ✅ 配置驱动支持JSON配置文件
- ✅ 结构化JSON输出

**快速使用**:
```bash
cd Neo4j\ Export
pip install -r requirements.txt
python neo4j_export.py --uri bolt://localhost:7687 --username neo4j --password your_password
```

### Neo4j Embedding - 向量嵌入工具
**位置**: `Neo4j Embedding/`

完整的向量嵌入解决方案，将文本属性转换为向量形式以支持语义搜索。

**主要功能**:
- ✅ 多节点类型支持（Page、Variant等）
- ✅ 综合向量和属性级向量两种模式
- ✅ 基于Ollama和bge-m3模型的高质量嵌入
- ✅ 批量处理和错误恢复机制

**快速使用**:
```bash
cd Neo4j\ Embedding
pip install requests neo4j
python page向量嵌入.py
```

## 📋 工具对比

| 特性 | Neo4j Export | Neo4j Embedding |
|------|-------------|-----------------|
| **主要用途** | 数据导出备份 | 向量嵌入生成 |
| **输入** | Neo4j数据库 | Neo4j节点文本属性 |
| **输出** | JSON文件 | 向量嵌入属性 |
| **依赖服务** | Neo4j | Neo4j + Ollama |
| **处理模式** | 批量导出 | 实时嵌入 |
| **配置方式** | 命令行/JSON配置 | Python脚本配置 |

## 🔄 典型工作流程

### 1. 数据导出和备份
```bash
# 1. 导出现有数据
cd Neo4j\ Export
python neo4j_export.py --config config.json

# 2. 查看导出结果
ls exports/
```

### 2. 向量嵌入生成
```bash
# 1. 确保Ollama服务运行
ollama serve
ollama pull bge-m3

# 2. 生成Page节点向量嵌入
cd Neo4j\ Embedding
python page向量嵌入.py

# 3. 生成Variant节点向量嵌入
python "Variant 向量嵌入.py"
```

### 3. 数据验证和测试
```bash
# 运行测试工具验证嵌入效果
cd Neo4j\ Embedding
python test_page_embedding.py
```

## 🔧 环境要求

### 通用要求
- Python 3.8+
- Neo4j数据库实例
- 网络连接（用于API调用）

### Neo4j Export 特定要求
```bash
pip install neo4j python-dotenv
```

### Neo4j Embedding 特定要求
```bash
pip install requests neo4j
# 需要Ollama服务和bge-m3模型
ollama serve
ollama pull bge-m3
```

## 📊 性能建议

### 大数据集处理
- **导出工具**: 使用较小的batch_size（如50-100）避免内存溢出
- **嵌入工具**: 分批处理节点，避免长时间运行导致的连接超时

### 资源优化
- **内存使用**: 监控系统内存使用，必要时重启服务
- **网络稳定**: 确保Neo4j和Ollama服务的网络连接稳定
- **磁盘空间**: 导出大量数据前确保有足够的磁盘空间

## 🛡️ 安全注意事项

1. **数据库密码**: 不要在代码中硬编码密码，使用环境变量或配置文件
2. **数据备份**: 在运行任何修改数据库的操作前先备份数据
3. **网络安全**: 确保Neo4j和Ollama服务的网络访问安全
4. **日志管理**: 避免在日志中记录敏感信息

## 📖 详细文档

- [Neo4j Export 详细说明](Neo4j%20Export/README.md)
- [Neo4j Embedding 详细说明](Neo4j%20Embedding/README.md)
- [Page向量嵌入专用说明](Neo4j%20Embedding/README_Page向量嵌入.md)

## 🤝 贡献指南

### 添加新工具
1. 在Tools目录下创建新的子目录
2. 添加相应的README.md说明文档
3. 更新本文档的工具概览部分
4. 确保新工具遵循项目的命名和代码规范

### 改进现有工具
1. 保持向后兼容性
2. 更新相应的文档
3. 添加适当的测试
4. 遵循现有的错误处理模式

---

**最后更新时间**: 2025年9月15日