#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Neo4j高级数据导出工具
功能：支持配置文件、灵活的属性过滤、多种输出格式
作者：为Linus Torvalds定制的企业级工具

架构设计哲学：
- 配置驱动：所有参数可通过配置文件管理
- 可扩展性：支持多种输出格式和过滤策略
- 监控友好：详细的进度报告和性能指标
- 容错性：优雅的错误处理和恢复机制
"""

import json
import logging
import os
import sys
import time
from pathlib import Path
from typing import Dict, List, Any, Optional, Set, Callable
from datetime import datetime
from dataclasses import dataclass
from neo4j import GraphDatabase
from neo4j.exceptions import ServiceUnavailable, AuthError


@dataclass
class ExportConfig:
    """导出配置数据类"""
    uri: str = "bolt://localhost:7687"
    username: str = "neo4j"
    password: str = "s19930609"
    database: str = "soda"  # 数据库名称
    batch_size: int = 100
    output_directory: str = "./exports"
    exclude_properties: List[str] = None
    include_metadata: bool = True
    compress_output: bool = False
    
    def __post_init__(self):
        if self.exclude_properties is None:
            self.exclude_properties = ["embedding", "vector", "embeddings"]


class PerformanceMonitor:
    """性能监控器 - 追踪导出性能指标"""
    
    def __init__(self):
        self.start_time = None
        self.metrics = {}
        
    def start(self):
        """开始监控"""
        self.start_time = time.time()
        
    def record_batch(self, batch_type: str, count: int, duration: float):
        """记录批次处理指标"""
        if batch_type not in self.metrics:
            self.metrics[batch_type] = {
                "total_count": 0,
                "total_duration": 0,
                "batch_count": 0,
                "avg_per_item": 0
            }
        
        self.metrics[batch_type]["total_count"] += count
        self.metrics[batch_type]["total_duration"] += duration
        self.metrics[batch_type]["batch_count"] += 1
        
        if count > 0:
            self.metrics[batch_type]["avg_per_item"] = (
                self.metrics[batch_type]["total_duration"] / 
                self.metrics[batch_type]["total_count"]
            )
    
    def get_summary(self) -> Dict[str, Any]:
        """获取性能摘要"""
        total_duration = time.time() - self.start_time if self.start_time else 0
        
        return {
            "total_duration_seconds": round(total_duration, 2),
            "batch_metrics": self.metrics,
            "items_per_second": {
                batch_type: round(metrics["total_count"] / total_duration, 2) 
                if total_duration > 0 else 0
                for batch_type, metrics in self.metrics.items()
            }
        }


class Neo4jAdvancedExporter:
    """Neo4j高级数据导出器
    
    设计原则：
    1. 单一职责：每个方法专注于一个特定功能
    2. 开闭原则：通过配置和策略模式支持扩展
    3. 依赖倒置：依赖抽象的配置而非具体实现
    """
    
    def __init__(self, config: ExportConfig):
        """初始化导出器
        
        Args:
            config: 导出配置对象
        """
        self.config = config
        self.driver = None
        self.monitor = PerformanceMonitor()
        
        # 确保输出目录存在
        Path(self.config.output_directory).mkdir(parents=True, exist_ok=True)
        
        # 配置日志
        self._setup_logging()
        
        # 编译属性过滤器
        self._compile_property_filters()
        
    def _setup_logging(self):
        """配置高级日志系统"""
        log_file = Path(self.config.output_directory) / "neo4j_export.log"
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger(__name__)
        
        # 添加性能日志记录器
        perf_logger = logging.getLogger('performance')
        perf_handler = logging.FileHandler(Path(self.config.output_directory) / "performance.log")
        perf_handler.setFormatter(logging.Formatter('%(asctime)s - %(message)s'))
        perf_logger.addHandler(perf_handler)
        perf_logger.setLevel(logging.INFO)
        
        self.perf_logger = perf_logger
        
    def _compile_property_filters(self):
        """编译属性过滤器为高效的检查函数"""
        exclude_patterns = [pattern.lower() for pattern in self.config.exclude_properties]
        
        def should_exclude_property(prop_name: str) -> bool:
            prop_lower = prop_name.lower()
            return any(pattern in prop_lower for pattern in exclude_patterns)
        
        self._property_filter = should_exclude_property
        
    def connect(self) -> bool:
        """建立数据库连接"""
        try:
            self.driver = GraphDatabase.driver(
                self.config.uri, 
                auth=(self.config.username, self.config.password),
                max_connection_lifetime=30 * 60,  # 30分钟连接生命周期
                max_connection_pool_size=50,
                connection_acquisition_timeout=60
            )
            
            # 测试连接并获取数据库信息
            with self.driver.session(database=self.config.database) as session:
                result = session.run("CALL dbms.components() YIELD name, versions, edition")
                db_info = result.single()
                
                self.logger.info(f"成功连接到Neo4j数据库: {self.config.uri}")
                self.logger.info(f"数据库名称: {self.config.database}")
                self.logger.info(f"数据库版本: {db_info['name']} {db_info['versions'][0]} ({db_info['edition']})")
            
            return True
            
        except AuthError as e:
            self.logger.error(f"认证失败: {e}")
            return False
        except ServiceUnavailable as e:
            self.logger.error(f"服务不可用: {e}")
            return False
        except Exception as e:
            self.logger.error(f"连接失败: {e}")
            return False
    
    def disconnect(self):
        """关闭数据库连接"""
        if self.driver:
            self.driver.close()
            self.logger.info("数据库连接已关闭")
    
    def _filter_properties(self, properties: Dict[str, Any]) -> Dict[str, Any]:
        """使用编译后的过滤器过滤属性"""
        return {
            key: value for key, value in properties.items() 
            if not self._property_filter(key)
        }
    
    def _get_database_statistics(self) -> Dict[str, Any]:
        """获取数据库统计信息"""
        with self.driver.session(database=self.config.database) as session:
            # 获取节点统计
            node_result = session.run("""
                MATCH (n)
                RETURN labels(n) as labels, count(n) as count
            """)
            
            node_stats = {}
            total_nodes = 0
            for record in node_result:
                label_combo = ":".join(sorted(record["labels"]))  # 转换为字符串
                node_stats[label_combo] = record["count"]
                total_nodes += record["count"]
            
            # 获取关系统计
            rel_result = session.run("""
                MATCH ()-[r]->()
                RETURN type(r) as rel_type, count(r) as count
            """)
            
            rel_stats = {}
            total_rels = 0
            for record in rel_result:
                rel_stats[record["rel_type"]] = record["count"]
                total_rels += record["count"]
            
            return {
                "total_nodes": total_nodes,
                "total_relationships": total_rels,
                "node_labels": node_stats,
                "relationship_types": rel_stats
            }
    
    def export_nodes_optimized(self) -> List[Dict[str, Any]]:
        """优化的节点导出 - 使用流式处理"""
        self.logger.info("开始优化节点导出...")
        
        query = """
        MATCH (n)
        RETURN id(n) as node_id, labels(n) as labels, properties(n) as properties
        ORDER BY id(n)
        """
        
        all_nodes = []
        processed_count = 0
        batch_start_time = time.time()
        
        with self.driver.session(database=self.config.database) as session:
            result = session.run(query)
            
            current_batch = []
            for record in result:
                node_data = {
                    "id": record["node_id"],
                    "labels": record["labels"],
                    "properties": self._filter_properties(record["properties"])
                }
                current_batch.append(node_data)
                
                # 处理批次
                if len(current_batch) >= self.config.batch_size:
                    all_nodes.extend(current_batch)
                    processed_count += len(current_batch)
                    
                    # 记录性能指标
                    batch_duration = time.time() - batch_start_time
                    self.monitor.record_batch("nodes", len(current_batch), batch_duration)
                    
                    self.logger.info(f"已处理节点: {processed_count}")
                    self.perf_logger.info(f"节点批次: {len(current_batch)} 项, 耗时: {batch_duration:.2f}s")
                    
                    current_batch = []
                    batch_start_time = time.time()
            
            # 处理最后一批
            if current_batch:
                all_nodes.extend(current_batch)
                processed_count += len(current_batch)
                
                batch_duration = time.time() - batch_start_time
                self.monitor.record_batch("nodes", len(current_batch), batch_duration)
                
                self.logger.info(f"节点导出完成，总计: {processed_count}")
        
        return all_nodes
    
    def export_relationships_optimized(self) -> List[Dict[str, Any]]:
        """优化的关系导出 - 使用流式处理"""
        self.logger.info("开始优化关系导出...")
        
        query = """
        MATCH (start_node)-[r]->(end_node)
        RETURN id(r) as rel_id, 
               type(r) as rel_type,
               properties(r) as properties,
               id(start_node) as start_node_id,
               id(end_node) as end_node_id
        ORDER BY id(r)
        """
        
        all_relationships = []
        processed_count = 0
        batch_start_time = time.time()
        
        with self.driver.session(database=self.config.database) as session:
            result = session.run(query)
            
            current_batch = []
            for record in result:
                rel_data = {
                    "id": record["rel_id"],
                    "type": record["rel_type"],
                    "properties": self._filter_properties(record["properties"]),
                    "start_node_id": record["start_node_id"],
                    "end_node_id": record["end_node_id"]
                }
                current_batch.append(rel_data)
                
                # 处理批次
                if len(current_batch) >= self.config.batch_size:
                    all_relationships.extend(current_batch)
                    processed_count += len(current_batch)
                    
                    # 记录性能指标
                    batch_duration = time.time() - batch_start_time
                    self.monitor.record_batch("relationships", len(current_batch), batch_duration)
                    
                    self.logger.info(f"已处理关系: {processed_count}")
                    self.perf_logger.info(f"关系批次: {len(current_batch)} 项, 耗时: {batch_duration:.2f}s")
                    
                    current_batch = []
                    batch_start_time = time.time()
            
            # 处理最后一批
            if current_batch:
                all_relationships.extend(current_batch)
                processed_count += len(current_batch)
                
                batch_duration = time.time() - batch_start_time
                self.monitor.record_batch("relationships", len(current_batch), batch_duration)
                
                self.logger.info(f"关系导出完成，总计: {processed_count}")
        
        return all_relationships
    
    def export_all_data(self, output_filename: str = None) -> str:
        """导出所有数据到JSON文件
        
        Args:
            output_filename: 输出文件名，默认自动生成
            
        Returns:
            str: 输出文件的完整路径
        """
        if output_filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_filename = f"neo4j_export_{timestamp}.json"
        
        output_path = Path(self.config.output_directory) / output_filename
        
        self.logger.info("🚀 开始Neo4j数据导出...")
        self.monitor.start()
        
        try:
            # 获取数据库统计信息
            db_stats = self._get_database_statistics()
            self.logger.info(f"📊 数据库统计: {db_stats['total_nodes']} 节点, {db_stats['total_relationships']} 关系")
            
            # 导出节点
            nodes = self.export_nodes_optimized()
            
            # 导出关系
            relationships = self.export_relationships_optimized()
            
            # 组装最终数据
            export_data = {
                "nodes": nodes,
                "relationships": relationships
            }
            
            # 添加元数据（如果启用）
            if self.config.include_metadata:
                export_data["metadata"] = {
                    "export_time": datetime.now().isoformat(),
                    "database_uri": self.config.uri,
                    "export_config": {
                        "batch_size": self.config.batch_size,
                        "excluded_properties": self.config.exclude_properties
                    },
                    "statistics": db_stats,
                    "performance": self.monitor.get_summary()
                }
            
            # 写入文件
            self.logger.info(f"💾 写入数据到文件: {output_path}")
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(export_data, f, ensure_ascii=False, indent=2)
            
            # 计算文件大小
            file_size = output_path.stat().st_size
            file_size_mb = file_size / (1024 * 1024)
            
            self.logger.info("✅ 数据导出完成!")
            self.logger.info(f"📁 输出文件: {output_path}")
            self.logger.info(f"📏 文件大小: {file_size_mb:.2f} MB")
            self.logger.info(f"📈 性能摘要: {self.monitor.get_summary()}")
            
            return str(output_path)
            
        except Exception as e:
            self.logger.error(f"❌ 导出失败: {e}")
            raise


def load_config_from_file(config_path: str) -> ExportConfig:
    """从JSON配置文件加载配置"""
    with open(config_path, 'r', encoding='utf-8') as f:
        config_data = json.load(f)
    
    neo4j_config = config_data.get('neo4j', {})
    export_config = config_data.get('export', {})
    
    return ExportConfig(
        uri=neo4j_config['uri'],
        username=neo4j_config['username'],
        password=neo4j_config['password'],
        batch_size=export_config.get('batch_size', 100),
        output_directory=export_config.get('output_directory', './exports'),
        exclude_properties=export_config.get('exclude_properties', ['embedding', 'vector', 'embeddings']),
        include_metadata=export_config.get('include_metadata', True),
        compress_output=export_config.get('compress_output', False)
    )


def main():
    """主函数 - 提供命令行接口"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Neo4j高级数据导出工具",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  # 使用命令行参数
  python neo4j_export_advanced.py --uri bolt://localhost:7687 --username neo4j --password password
  
  # 使用配置文件
  python neo4j_export_advanced.py --config config.json
  
  # 自定义批量大小和输出目录
  python neo4j_export_advanced.py --uri bolt://localhost:7687 --username neo4j --password password --batch-size 50 --output-dir ./my_exports
        """
    )
    
    # 配置文件选项
    parser.add_argument('--config', help='配置文件路径 (JSON格式)')
    
    # 数据库连接选项
    parser.add_argument('--uri', help='Neo4j数据库URI (例: bolt://localhost:7687)')
    parser.add_argument('--username', help='数据库用户名')
    parser.add_argument('--password', help='数据库密码')
    parser.add_argument('--database', default='soda', help='数据库名称 (默认: soda)')
    
    # 导出选项
    parser.add_argument('--batch-size', type=int, default=100, help='批处理大小 (默认: 100)')
    parser.add_argument('--output-dir', default='./exports', help='输出目录 (默认: ./exports)')
    parser.add_argument('--output-file', help='输出文件名 (默认: 自动生成)')
    parser.add_argument('--exclude-properties', nargs='*', default=['embedding'], help='要排除的属性名称模式')
    
    args = parser.parse_args()
    
    try:
        # 加载配置
        if args.config:
            config = load_config_from_file(args.config)
            print(f"📋 从配置文件加载: {args.config}")
        else:
            if not all([args.uri, args.username, args.password]):
                print("❌ 错误: 必须提供 --uri, --username, --password 或使用 --config 指定配置文件")
                sys.exit(1)
            
            config = ExportConfig(
                uri=args.uri,
                username=args.username,
                password=args.password,
                database=args.database,
                batch_size=args.batch_size,
                output_directory=args.output_dir,
                exclude_properties=args.exclude_properties
            )
        
        # 创建导出器
        exporter = Neo4jAdvancedExporter(config)
        
        # 连接数据库
        print("🔌 连接数据库...")
        if not exporter.connect():
            print("❌ 数据库连接失败，请检查连接参数")
            sys.exit(1)
        
        # 导出数据
        output_file = exporter.export_all_data(output_filename=args.output_file)
        
        print("🎉 导出完成!")
        print(f"📁 输出文件: {output_file}")
        
    except KeyboardInterrupt:
        print("\n⚠️  用户中断操作")
    except FileNotFoundError as e:
        print(f"❌ 文件未找到: {e}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ 配置文件格式错误: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ 导出失败: {e}")
        sys.exit(1)
    finally:
        if 'exporter' in locals():
            exporter.disconnect()


if __name__ == "__main__":
    main()
