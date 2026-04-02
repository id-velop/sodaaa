# Neo4j 数据导出工具

为Linus Torvalds定制的高质量Neo4j数据导出工具，支持批量导出、属性过滤和性能监控。

## 🎯 功能特性

- ✅ **批量导出**：分批处理避免内存溢出，默认100条记录一批
- ✅ **属性过滤**：自动排除embedding相关属性，支持自定义过滤规则
- ✅ **性能监控**：实时性能指标和详细日志记录
- ✅ **配置驱动**：支持JSON配置文件和命令行参数
- ✅ **错误处理**：优雅的错误处理和恢复机制
- ✅ **JSON输出**：结构化JSON格式，包含完整的节点和关系数据

## 📦 安装依赖

```bash
cd Tools
pip install -r requirements.txt
```

## 🚀 快速开始

### 方式1：命令行参数

```bash
# 基础用法
python neo4j_export.py --uri bolt://localhost:7687 --username neo4j --password your_password

# 自定义批量大小和输出文件
python neo4j_export.py \
  --uri bolt://localhost:7687 \
  --username neo4j \
  --password your_password \
  --batch-size 50 \
  --output my_export.json
```

### 方式2：配置文件（推荐）

1. 复制配置文件模板：
```bash
cp config.example.json config.json
```

2. 编辑配置文件：
```json
{
  "neo4j": {
    "uri": "bolt://localhost:7687",
    "username": "neo4j",
    "password": "your_password_here"
  },
  "export": {
    "batch_size": 100,
    "output_directory": "./exports",
    "exclude_properties": ["embedding", "vector", "embeddings"]
  }
}
```

3. 运行导出：
```bash
python neo4j_export_advanced.py --config config.json
```

## 📊 输出格式

导出的JSON文件结构：

```json
{
  "metadata": {
    "export_time": "2024-01-01T12:00:00",
    "total_nodes": 1000,
    "total_relationships": 2000,
    "performance": {
      "total_duration_seconds": 15.5,
      "items_per_second": {"nodes": 64.5, "relationships": 129.0}
    }
  },
  "nodes": [
    {
      "id": 0,
      "labels": ["Page"],
      "properties": {
        "name": "List Data Management Page",
        "description": "..."
      }
    }
  ],
  "relationships": [
    {
      "id": 0,
      "type": "CONTAIN",
      "properties": {},
      "start_node_id": 0,
      "end_node_id": 1
    }
  ]
}
```

## 🔧 高级用法

### 自定义属性过滤

```bash
# 排除多种属性模式
python neo4j_export_advanced.py \
  --uri bolt://localhost:7687 \
  --username neo4j \
  --password your_password \
  --exclude-properties embedding vector similarity_score
```

### 性能调优

```bash
# 大批量处理（适合高性能服务器）
python neo4j_export_advanced.py \
  --config config.json \
  --batch-size 500

# 小批量处理（适合资源受限环境）
python neo4j_export_advanced.py \
  --config config.json \
  --batch-size 25
```

## 📈 性能监控

工具会自动生成以下日志文件：

- `exports/neo4j_export.log` - 主要操作日志
- `exports/performance.log` - 性能指标日志

日志内容包括：
- 批处理进度和耗时
- 内存使用情况
- 数据库连接状态
- 错误和警告信息

## 🛡️ 错误处理

### 常见问题解决

1. **连接失败**
   ```
   ❌ 数据库连接失败，请检查连接参数
   ```
   - 检查Neo4j服务是否运行
   - 验证URI、用户名、密码是否正确
   - 确认防火墙设置

2. **内存不足**
   ```
   ❌ 导出失败: MemoryError
   ```
   - 减少batch_size参数（如改为50或25）
   - 增加系统可用内存
   - 分多次导出不同的数据子集

3. **权限错误**
   ```
   ❌ 认证失败: AuthError
   ```
   - 确认用户名密码正确
   - 检查用户是否有读取权限

## 🎨 设计哲学

这个工具遵循以下设计原则：

- **简洁性**：每个函数只做一件事，代码清晰易读
- **可靠性**：完善的错误处理，优雅的失败恢复
- **效率性**：批量处理，流式导出，避免内存溢出
- **可维护性**：模块化设计，配置驱动，易于扩展

正如Linus所说："好的代码是自解释的"，这个工具的每一行代码都力求清晰表达其意图。

## 📝 开发说明

### 文件结构

```
Tools/
├── neo4j_export.py          # 基础版本导出工具
├── neo4j_export_advanced.py # 高级版本导出工具
├── requirements.txt         # Python依赖
├── config.example.json      # 配置文件模板
└── README.md               # 使用说明
```

### 扩展开发

如需添加新功能，请遵循现有的架构模式：

1. 在`ExportConfig`中添加配置选项
2. 在`Neo4jAdvancedExporter`中实现功能
3. 更新命令行参数解析
4. 添加相应的测试和文档

---

**"Talk is cheap. Show me the code."** - Linus Torvalds

这个工具用代码说话，为你提供可靠、高效的Neo4j数据导出解决方案。
