# 导入 requests 库，用于发送 HTTP 请求到 Ollama API
import requests
# 导入 Neo4j 的 Python 驱动程序，用于连接和操作 Neo4j 数据库
from neo4j import GraphDatabase
# 导入 json 库，用于处理 JSON 数据格式
import json
# 导入 os 库，用于文件操作
import os

# === 配置部分：定义连接参数 ===
# Ollama 嵌入 API 的 URL 地址，用于生成文本向量嵌入
OLLAMA_URL = "http://localhost:11434/api/embeddings"
# Neo4j 数据库的连接 URI，使用 bolt 协议连接本地数据库
NEO4J_URI = "bolt://localhost:7687"
# Neo4j 数据库的用户名
NEO4J_USER = "neo4j"
# Neo4j 数据库的密码
NEO4J_PASSWORD = "s19930609"

# === 嵌入生成函数：将文本转换为向量 ===
def generate_embedding(text):
    try:
        # 向 Ollama API 发送 POST 请求，获取文本的向量嵌入
        response = requests.post(OLLAMA_URL, json={
            "model": "bge-m3",  # 指定使用的嵌入模型为 bge-m3
            "prompt": text      # 要生成嵌入的文本内容
        })
        # 检查响应状态码
        response.raise_for_status()
        # 从响应的 JSON 数据中提取并返回嵌入向量
        return response.json()["embedding"]
    except requests.exceptions.RequestException as e:
        # 处理网络请求异常
        print(f"❌ API 请求失败: {e}")
        raise
    except KeyError as e:
        # 处理响应数据格式异常
        print(f"❌ 响应数据格式错误: {e}")
        raise

# === 写入嵌入到 Neo4j：主要处理函数 ===
def write_embeddings_to_neo4j():
    try:
        # 创建 Neo4j 数据库驱动连接，使用配置的 URI 和认证信息
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        # 使用数据库会话上下文管理器，确保连接正确关闭
        # 尝试使用默认数据库或指定数据库名称
        with driver.session(database="system") as test_session:
            # 先查看可用的数据库
            db_result = test_session.run("SHOW DATABASES")
            databases = [record["name"] for record in db_result]
            print(f"📋 可用数据库: {databases}")
            
            # 选择第一个用户数据库（非系统数据库）
            target_db = None
            for db in databases:
                if db not in ["system", "neo4j"]:
                    target_db = db
                    break
            if not target_db and "neo4j" in databases:
                target_db = "neo4j"
            elif not target_db:
                target_db = databases[0] if databases else "neo4j"
            
            print(f"🎯 使用数据库: {target_db}")
        
        # 使用确定的数据库连接
        with driver.session(database=target_db) as session:
            # 执行 Cypher 查询：获取所有 IconIntent 节点及其所有属性
            result = session.run("""
            MATCH (n:IconIntent)
            RETURN id(n) AS id, 
                   n.name_cn AS name_cn, 
                   n.name_en AS name_en, 
                   n.description_cn AS description_cn, 
                   n.description_en AS description_en,
                   n.iconAction AS iconAction,
                   n.userIntent AS userIntent,
                   n.synonymousExpressions AS synonymousExpressions
            """)
            # 获取所有记录并显示总数
            records = list(result)
            total_records = len(records)
            print(f"📊 找到 {total_records} 个 IconIntent 节点，开始生成向量嵌入...")
            
            # 遍历查询结果中的每条记录
            for i, record in enumerate(records, 1):
                # 将所有属性组合成一个完整的文本字符串，用于生成向量嵌入
                # 包含中英文名称、中英文描述、图标动作、用户意图和同义词表达
                text_parts = []
                
                # 添加中文名称（如果存在）
                if record['name_cn']:
                    text_parts.append(f"中文名称: {record['name_cn']}")
                
                # 添加英文名称（如果存在）
                if record['name_en']:
                    text_parts.append(f"英文名称: {record['name_en']}")
                
                # 添加中文描述（如果存在）
                if record['description_cn']:
                    text_parts.append(f"中文描述: {record['description_cn']}")
                    
                # 添加英文描述（如果存在）
                if record['description_en']:
                    text_parts.append(f"英文描述: {record['description_en']}")
                
                # 添加图标动作（如果存在）
                if record['iconAction']:
                    text_parts.append(f"图标动作: {record['iconAction']}")
                
                # 添加用户意图（如果存在）
                if record['userIntent']:
                    text_parts.append(f"用户意图: {record['userIntent']}")
                
                # 添加同义词表达（如果存在）
                if record['synonymousExpressions']:
                    text_parts.append(f"同义词: {record['synonymousExpressions']}")
                
                # 将所有文本部分用换行符连接成完整文本
                text = "\n".join(text_parts)
                
                # 可选：为了更好的跨语言检索，也可以将所有内容合并为一个段落
                # text = " ".join(text_parts)
                
                # 调用嵌入生成函数，为组合文本生成向量嵌入
                embedding = generate_embedding(text)
                # 执行更新操作：将生成的嵌入向量写入对应的节点
                session.run("""
                    MATCH (n:IconIntent) WHERE id(n) = $id
                    SET n.embedding = $embedding
                """, id=record["id"], embedding=embedding)
                
                # 显示处理进度
                print(f"⏳ 进度: {i}/{total_records} - 已处理节点 ID: {record['id']}")
        # 打印完成消息，表示所有嵌入已成功写入数据库
        print("✅ 嵌入已写入 Neo4j")
    except Exception as e:
        # 处理所有其他异常
        print(f"❌ 处理过程中发生错误: {e}")
        raise
    finally:
        # 确保数据库连接被正确关闭
        if 'driver' in locals():
            driver.close()

# 执行主函数，开始向量嵌入的生成和写入过程
write_embeddings_to_neo4j()
