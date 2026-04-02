# Page向量嵌入测试脚本
# 用于验证Page向量嵌入脚本的基本功能和配置

import requests
from neo4j import GraphDatabase

# 测试配置（与主脚本相同）
OLLAMA_URL = "http://localhost:11434/api/embeddings"
NEO4J_URI = "bolt://localhost:7687"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = "s19930609"

def test_ollama_connection():
    """测试Ollama API连接"""
    print("🔍 测试Ollama API连接...")
    try:
        response = requests.post(OLLAMA_URL, json={
            "model": "bge-m3",
            "prompt": "测试文本"
        })
        response.raise_for_status()
        embedding = response.json()["embedding"]
        print(f"✅ Ollama API连接成功，向量维度: {len(embedding)}")
        return True
    except Exception as e:
        print(f"❌ Ollama API连接失败: {e}")
        return False

def test_neo4j_connection():
    """测试Neo4j数据库连接"""
    print("🔍 测试Neo4j数据库连接...")
    try:
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

        # 测试系统数据库连接
        with driver.session(database="system") as session:
            result = session.run("SHOW DATABASES")
            databases = [record["name"] for record in result]
            print(f"✅ Neo4j连接成功，可用数据库: {databases}")

        # 测试是否有Page节点
        target_db = None
        for db in databases:
            if db not in ["system", "neo4j"]:
                target_db = db
                break
        if not target_db and "neo4j" in databases:
            target_db = "neo4j"

        if target_db:
            with driver.session(database=target_db) as session:
                result = session.run("MATCH (n:Page) RETURN count(n) as page_count")
                record = result.single()
                page_count = record["page_count"]
                print(f"✅ 找到 {page_count} 个Page节点")

                if page_count > 0:
                    # 显示一个示例节点
                    result = session.run("""
                    MATCH (n:Page)
                    RETURN n.name as name, n.name_cn as name_cn,
                           n.description_cn as description_cn
                    LIMIT 1
                    """)
                    record = result.single()
                    print("📋 示例Page节点数据:")
                    for key, value in record.items():
                        if value:
                            print(f"  {key}: {value[:100]}..." if len(str(value)) > 100 else f"  {key}: {value}")

        driver.close()
        return True

    except Exception as e:
        print(f"❌ Neo4j连接失败: {e}")
        return False

def test_embedding_generation():
    """测试向量嵌入生成功能"""
    print("🔍 测试向量嵌入生成...")

    # 测试文本
    test_texts = [
        "数据表格查询页面",
        "A General Data List Page in Enterprise-level Management Systems",
        "用户管理 数据列表 表格查询"
    ]

    for text in test_texts:
        try:
            response = requests.post(OLLAMA_URL, json={
                "model": "bge-m3",
                "prompt": text
            })
            response.raise_for_status()
            embedding = response.json()["embedding"]
            print(f"✅ 文本: '{text[:30]}...' -> 向量维度: {len(embedding)}")
        except Exception as e:
            print(f"❌ 文本: '{text[:30]}...' -> 生成失败: {e}")
            return False

    return True

def main():
    """主测试函数"""
    print("🚀 Page向量嵌入测试开始")
    print("=" * 50)

    tests = [
        ("Ollama API连接", test_ollama_connection),
        ("Neo4j数据库连接", test_neo4j_connection),
        ("向量嵌入生成", test_embedding_generation)
    ]

    passed = 0
    total = len(tests)

    for test_name, test_func in tests:
        print(f"\n📋 测试: {test_name}")
        print("-" * 30)
        if test_func():
            passed += 1
        print()

    print("=" * 50)
    print(f"📊 测试结果: {passed}/{total} 通过")

    if passed == total:
        print("🎉 所有测试通过！可以正常运行Page向量嵌入脚本")
        print("\n💡 使用提示:")
        print("1. 运行 python page向量嵌入.py 开始处理")
        print("2. 选择适合的处理方式（推荐选择3：两种方式都执行）")
        print("3. 首次运行可能需要一些时间，请耐心等待")
    else:
        print("⚠️  部分测试失败，请检查配置后重试")
        print("\n🔧 故障排除:")
        print("1. 确保Ollama服务正在运行: ollama serve")
        print("2. 确保已下载bge-m3模型: ollama pull bge-m3")
        print("3. 检查Neo4j数据库连接参数")
        print("4. 确认Neo4j数据库中存在Page节点")

if __name__ == "__main__":
    main()
