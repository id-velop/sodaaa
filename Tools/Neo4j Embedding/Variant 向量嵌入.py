# Variant节点向量嵌入生成工具
# 用于将Variant节点中的文本属性转换为向量嵌入并存储到Neo4j数据库

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
    """
    调用Ollama API生成文本向量嵌入

    Args:
        text (str): 需要生成向量的文本内容

    Returns:
        list: 向量嵌入数组

    Raises:
        Exception: 当API请求失败或响应格式错误时抛出异常
    """
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

# === Variant节点向量嵌入处理函数 ===
def process_variant_embeddings():
    """
    处理所有Variant节点的向量嵌入生成和存储

    处理的属性包括：
    - description_cn: 中文描述
    - description_en: 英文描述
    - name_cn: 中文名称
    - name_en: 英文名称
    - usage_scenario_cn: 中文使用场景
    - usage_scenario_en: 英文使用场景
    """
    try:
        # 创建 Neo4j 数据库驱动连接，使用配置的 URI 和认证信息
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

        # 首先尝试连接到系统数据库查看可用数据库
        with driver.session(database="system") as test_session:
            # 查看可用的数据库
            db_result = test_session.run("SHOW DATABASES")
            databases = [record["name"] for record in db_result]
            print(f"📋 可用数据库: {databases}")

            # 选择目标数据库（优先选择非系统数据库）
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

        # 使用确定的数据库连接处理Variant节点
        with driver.session(database=target_db) as session:
            print("🔍 查询所有Variant节点...")

            # 执行 Cypher 查询：获取所有 Variant 节点及其指定属性
            result = session.run("""
            MATCH (n:Variant)
            RETURN id(n) AS id,
                   n.name_cn AS name_cn,
                   n.name_en AS name_en,
                   n.description_cn AS description_cn,
                   n.description_en AS description_en,
                   n.usage_scenario_cn AS usage_scenario_cn,
                   n.usage_scenario_en AS usage_scenario_en
            """)

            # 获取所有记录并显示总数
            records = list(result)
            total_records = len(records)
            print(f"📊 找到 {total_records} 个Variant节点，开始生成向量嵌入...")

            if total_records == 0:
                print("⚠️  未找到任何Variant节点，请检查数据库中是否存在Variant标签的节点")
                return

            # 统计成功和失败的处理次数
            success_count = 0
            error_count = 0

            # 遍历查询结果中的每条记录
            for i, record in enumerate(records, 1):
                try:
                    print(f"\n⏳ 处理第 {i}/{total_records} 个节点 (ID: {record['id']})")

                    # 将所有属性组合成一个完整的文本字符串，用于生成向量嵌入
                    text_parts = []

                    # 添加名称信息
                    if record.get('name_cn'):
                        text_parts.append(f"中文名称: {record['name_cn']}")
                    if record.get('name_en'):
                        text_parts.append(f"英文名称: {record['name_en']}")

                    # 添加描述信息
                    if record.get('description_cn'):
                        text_parts.append(f"中文描述: {record['description_cn']}")
                    if record.get('description_en'):
                        text_parts.append(f"英文描述: {record['description_en']}")

                    # 添加使用场景信息
                    if record.get('usage_scenario_cn'):
                        text_parts.append(f"中文使用场景: {record['usage_scenario_cn']}")
                    if record.get('usage_scenario_en'):
                        text_parts.append(f"英文使用场景: {record['usage_scenario_en']}")

                    # 检查是否有任何文本内容
                    if not text_parts:
                        print(f"⚠️  节点 ID {record['id']} 没有任何文本内容，跳过处理")
                        continue

                    # 将所有文本部分用换行符连接成完整文本
                    text = "\n".join(text_parts)

                    print(f"📝 生成向量嵌入的文本内容: {text[:200]}..." if len(text) > 200 else f"📝 生成向量嵌入的文本内容: {text}")

                    # 调用嵌入生成函数，为组合文本生成向量嵌入
                    embedding = generate_embedding(text)

                    # 执行更新操作：将生成的嵌入向量写入对应的节点
                    session.run("""
                        MATCH (n:Variant) WHERE id(n) = $id
                        SET n.embedding = $embedding
                    """, id=record["id"], embedding=embedding)

                    success_count += 1
                    print(f"✅ 节点 ID {record['id']} 的向量嵌入已成功写入")

                except Exception as node_error:
                    error_count += 1
                    print(f"❌ 处理节点 ID {record['id']} 时发生错误: {node_error}")
                    continue

            # 输出处理结果统计
            print(f"\n📊 处理完成统计:")
            print(f"✅ 成功处理: {success_count} 个节点")
            print(f"❌ 处理失败: {error_count} 个节点")
            print(f"📈 总处理节点: {total_records} 个")

            if success_count > 0:
                print("🎉 Variant节点向量嵌入生成完成！")
            else:
                print("⚠️  没有成功处理任何节点，请检查配置和数据")

    except Exception as e:
        # 处理所有其他异常
        print(f"❌ 处理过程中发生错误: {e}")
        raise
    finally:
        # 确保数据库连接被正确关闭
        if 'driver' in locals():
            driver.close()
            print("🔌 数据库连接已关闭")

# === 批量处理多个属性作为单独向量 ===
def process_variant_embeddings_separate():
    """
    为Page节点的每个属性分别生成向量嵌入

    这将为每个属性创建单独的向量字段：
    - embedding_description_cn
    - embedding_description_en
    - embedding_name
    - embedding_name_cn
    - embedding_usage_scenario_cn
    - embedding_usage_scenario_en
    """
    try:
        # 属性映射：属性名 -> 嵌入字段名
        property_mappings = {
            'description_cn': 'embedding_description_cn',
            'description_en': 'embedding_description_en',
            'name': 'embedding_name',
            'name_cn': 'embedding_name_cn',
            'usage_scenario_cn': 'embedding_usage_scenario_cn',
            'usage_scenario_en': 'embedding_usage_scenario_en'
        }

        # 创建 Neo4j 数据库驱动连接
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

        # 获取目标数据库
        with driver.session(database="system") as test_session:
            db_result = test_session.run("SHOW DATABASES")
            databases = [record["name"] for record in db_result]
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
        print("🔍 开始为每个属性分别生成向量嵌入...")

        with driver.session(database=target_db) as session:
            # 查询Page节点
            result = session.run("""
            MATCH (n:Page)
            RETURN id(n) AS id,
                   n.name AS name,
                   n.name_cn AS name_cn,
                   n.description_cn AS description_cn,
                   n.description_en AS description_en,
                   n.usage_scenario_cn AS usage_scenario_cn,
                   n.usage_scenario_en AS usage_scenario_en
            """)

            records = list(result)
            total_records = len(records)
            print(f"📊 找到 {total_records} 个Page节点")

            total_processed = 0
            total_embeddings = 0

            for i, record in enumerate(records, 1):
                print(f"\n⏳ 处理第 {i}/{total_records} 个节点 (ID: {record['id']})")

                node_updates = {}
                embeddings_created = 0

                # 为每个属性生成向量
                for prop_name, embedding_field in property_mappings.items():
                    prop_value = record.get(prop_name)

                    if prop_value and isinstance(prop_value, str) and prop_value.strip():
                        try:
                            print(f"  📝 为属性 '{prop_name}' 生成向量...")
                            embedding = generate_embedding(prop_value)
                            node_updates[embedding_field] = embedding
                            embeddings_created += 1
                            print(f"  ✅ 属性 '{prop_name}' 向量生成成功")
                        except Exception as e:
                            print(f"  ❌ 属性 '{prop_name}' 向量生成失败: {e}")
                    else:
                        print(f"  ⏭️  属性 '{prop_name}' 为空或不存在，跳过")

                # 更新节点
                if node_updates:
                    set_clause = ", ".join([f"n.{field} = ${field}" for field in node_updates.keys()])

                    session.run(f"""
                        MATCH (n:Page) WHERE id(n) = $id
                        SET {set_clause}
                    """, id=record["id"], **node_updates)

                    print(f"✅ 节点 ID {record['id']} 更新了 {embeddings_created} 个向量字段")
                    total_embeddings += embeddings_created
                else:
                    print(f"⚠️  节点 ID {record['id']} 没有生成任何向量")

                total_processed += 1

            print(f"\n📊 批量处理完成:")
            print(f"📈 处理节点数: {total_processed}")
            print(f"🔢 生成向量总数: {total_embeddings}")
            print("🎉 Variant节点属性级向量嵌入生成完成！")

    except Exception as e:
        print(f"❌ 批量处理过程中发生错误: {e}")
        raise
    finally:
        if 'driver' in locals():
            driver.close()
            print("🔌 数据库连接已关闭")

# === 主函数 ===
if __name__ == "__main__":
    print("🚀 开始Page节点向量嵌入处理...")
    print("=" * 50)

    # 询问用户选择处理方式
    print("请选择处理方式:")
    print("1. 生成综合向量 (将所有属性组合成一个向量)")
    print("2. 生成属性级向量 (为每个属性分别生成向量)")
    print("3. 两种方式都执行")

    choice = input("请输入选择 (1/2/3): ").strip()

    if choice == "1":
        print("\n🔄 执行方式1: 生成综合向量")
        process_variant_embeddings()
    elif choice == "2":
        print("\n🔄 执行方式2: 生成属性级向量")
        process_variant_embeddings_separate()
    elif choice == "3":
        print("\n🔄 执行方式3: 两种方式都执行")
        print("首先执行综合向量处理...")
        process_variant_embeddings()
        print("\n" + "=" * 50)
        print("然后执行属性级向量处理...")
        process_variant_embeddings_separate()
    else:
        print("❌ 无效选择，程序退出")

    print("\n🎯 所有处理完成！")
