#!/usr/bin/env python3
"""
Guangchu Ingest 脚本
从 articles 表读取未处理文章，提取实体，更新 wiki
"""

import sqlite3
import os
import re
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "../data/guangchu.db")
WIKI_PATH = os.path.join(os.path.dirname(__file__), "../wiki")

# ========== 实体识别规则 ==========
COMPANY_PATTERNS = [
    (r"国家电网", "国家电网", "company"),
    (r"中国石油", "中国石油", "company"),
    (r"国家能源局", "国家能源局", "policy_org"),
    (r"哈萨克斯坦", "哈萨克斯坦", "country"),
    (r"土库曼斯坦|土（库曼斯坦）", "土库曼斯坦", "country"),
    (r"俄罗斯", "俄罗斯", "country"),
    (r"中俄东线", "中俄东线天然气管道", "project"),
    (r"白鹤滩", "白鹤滩至浙江特高压", "project"),
    (r"国家电网|电网", "国家电网", "company"),
    (r"浙江方案", "浙江省电网转型", "project"),
]

TOPIC_KEYWORDS = {
    "抽水蓄能": "抽水蓄能",
    "氢能": "氢能",
    "海上风电|海上.风光": "海上风电",
    "煤层气": "煤层气",
    "分布式光伏": "分布式光伏",
    "储能": "储能",
    "清洁取暖": "清洁取暖",
    "可再生能源": "可再生能源",
    "能源法": "能源法",
    "特高压": "特高压",
    "碳达峰|碳中和": "碳达峰碳中和",
    "光伏": "光伏",
}

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def ensure_entity(conn, name, etype, description=""):
    """确保实体存在，不存在则创建"""
    cur = conn.execute("SELECT id FROM entities WHERE name = ?", (name,))
    row = cur.fetchone()
    if row:
        return row["id"]
    conn.execute("""
        INSERT INTO entities (name, type, description, metadata)
        VALUES (?, ?, ?, '{}')
    """, (name, etype, description))
    return conn.execute("SELECT last_insert_rowid()").fetchone()[0]

def detect_entities(title, content=""):
    """从标题/内容中提取实体（去重）"""
    text = title + " " + (content or "")
    found = []  # (name, etype)
    seen_names = set()
    
    for pattern, name, etype in COMPANY_PATTERNS:
        if re.search(pattern, text) and name not in seen_names:
            found.append((name, etype))
            seen_names.add(name)
    
    for kw, topic_name in TOPIC_KEYWORDS.items():
        if kw in text and topic_name not in seen_names:
            found.append((topic_name, "topic"))
            seen_names.add(topic_name)
    
    return found

def entity_type_for(name):
    """根据名称返回默认实体类型"""
    if name in ["国家能源局"]:
        return "policy_org"
    if name in ["国家电网", "中国石油"]:
        return "company"
    if "省" in name or "市" in name:
        return "region"
    if name in ["哈萨克斯坦", "土库曼斯坦", "俄罗斯"]:
        return "country"
    if "特高压" in name or "管道" in name or "工程" in name:
        return "project"
    if name in ["储能", "氢能", "光伏", "海上风电", "煤层气", "可再生能源", "能源法", "碳达峰碳中和", "分布式光伏", "清洁取暖", "抽水蓄能"]:
        return "topic"
    return "company"

def format_wiki_date(date_str):
    """2024-12-15 -> [[2024-12-15]]"""
    if not date_str:
        return "[[未知日期]]"
    return f"[[{date_str[:10]}]]"

def build_dynamic_entry(article_row, entity_names):
    """构建 wiki 动态条目"""
    date = format_wiki_date(article_row["published_at"])
    title = article_row["title"]
    source = article_row["source_name"]
    article_id = article_row["id"]
    entities_str = "、".join(entity_names) if entity_names else ""
    
    entry = f"> - {date} {title}\n"
    entry += f">   - 来源: [[articles/{article_id}]]\n"
    if entities_str:
        entry += f">   - 涉及: {entities_str}\n"
    return entry

def update_company_wiki(entity_name, articles_by_entity, wiki_dir):
    """更新企业 wiki 页面"""
    path = os.path.join(wiki_dir, "entities", "companies", f"{entity_name}.md")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    
    # 收集动态
    dynamics = []
    for _, row in articles_by_entity:
        date = format_wiki_date(row["published_at"])
        dynamics.append(f"> - {date} {row['title']}\n>   - 来源: [[articles/{row['id']}]]")
    
    dynamics_str = "\n".join(dynamics) if dynamics else "> （暂无动态）"
    
    content = f"""---
type: company
name: {entity_name}
updated: {datetime.now().strftime('%Y-%m-%d')}
tags: [企业]
---

# {entity_name}

## 近期动态

{dynamics_str}

## 关联实体

> （待补充）

## 相关政策

> （待补充）

---

*最后更新: [[{datetime.now().strftime('%Y-%m-%d')}]] by Javis 🤖*
"""
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    return path

def update_topic_wiki(topic_name, articles_by_topic, wiki_dir):
    """更新主题 wiki 页面"""
    path = os.path.join(wiki_dir, "topics", f"{topic_name}.md")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    
    dynamics = []
    for _, row in articles_by_topic:
        date = format_wiki_date(row["published_at"])
        dynamics.append(f"> - {date} {row['title']}\n>   - 来源: [[articles/{row['id']}]]")
    
    dynamics_str = "\n".join(dynamics) if dynamics else "> （暂无动态）"
    
    content = f"""---
type: topic
name: {topic_name}
updated: {datetime.now().strftime('%Y-%m-%d')}
tags: [{topic_name}]
---

# {topic_name}

## 近期动态

{dynamics_str}

## 行业概况

> （待补充）

## 关联企业

> （待补充）

## 关联政策

> （待补充）

---

*最后更新: [[{datetime.now().strftime('%Y-%m-%d')}]] by Javis 🤖*
"""
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    return path

def update_policy_wiki(entity_name, articles_by_entity, wiki_dir):
    """更新政策 wiki 页面"""
    path = os.path.join(wiki_dir, "entities", "policies", f"{entity_name}.md")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    
    dynamics = []
    for _, row in articles_by_entity:
        date = format_wiki_date(row["published_at"])
        dynamics.append(f"> - {date} {row['title']}\n>   - 来源: [[articles/{row['id']}]]")
    
    dynamics_str = "\n".join(dynamics) if dynamics else "> （暂无动态）"
    
    content = f"""---
type: policy
name: {entity_name}
updated: {datetime.now().strftime('%Y-%m-%d')}
tags: [政策]
---

# {entity_name}

## 近期动态

{dynamics_str}

## 政策背景

> （待补充）

---

*最后更新: [[{datetime.now().strftime('%Y-%m-%d')}]] by Javis 🤖*
"""
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    return path

def ingest_all():
    """处理所有未处理文章"""
    conn = get_db()
    
    # 读取所有未处理文章
    cur = conn.execute("""
        SELECT id, title, source_name, published_at, category, summary
        FROM articles
        WHERE is_processed = 0
        ORDER BY published_at DESC
    """)
    articles = cur.fetchall()
    
    if not articles:
        print("没有待处理文章")
        conn.close()
        return
    
    print(f"开始 ingest {len(articles)} 篇文章...")
    
    # 按实体分组文章
    entity_articles = {}  # {entity_name: [(entity_id, article_row), ...]}
    
    processed_count = 0
    new_entities = []
    
    for article in articles:
        title = article["title"]
        entities = detect_entities(title, article["summary"] or "")
        
        article_entity_names = []
        for entity_name, etype in entities:
            # 确保实体存在
            eid = ensure_entity(conn, entity_name, etype)
            article_entity_names.append(entity_name)
            
            if entity_name not in entity_articles:
                entity_articles[entity_name] = []
            entity_articles[entity_name].append((eid, article))
            
            # 记录事件
            conn.execute("""
                INSERT INTO events (entity_id, article_id, title, event_date, description, significance)
                VALUES (?, ?, ?, ?, ?, 'normal')
            """, (eid, article["id"], title, article["published_at"], article["summary"] or ""))
        
        # 标记文章为已处理
        conn.execute("UPDATE articles SET is_processed = 1 WHERE id = ?", (article["id"],))
        processed_count += 1
    
    conn.commit()
    
    # 更新 wiki 页面
    wiki_updated = []
    for entity_name, earticles in entity_articles.items():
        etype = entity_type_for(entity_name)
        
        if etype == "company":
            path = update_company_wiki(entity_name, earticles, WIKI_PATH)
            wiki_updated.append((entity_name, "company", path))
        elif etype == "topic":
            path = update_topic_wiki(entity_name, earticles, WIKI_PATH)
            wiki_updated.append((entity_name, "topic", path))
        elif etype == "policy_org":
            path = update_policy_wiki(entity_name, earticles, WIKI_PATH)
            wiki_updated.append((entity_name, "policy", path))
    
    conn.close()
    
    print(f"\n✅ ingest 完成:")
    print(f"   处理文章: {processed_count}")
    print(f"   发现实体: {len(entity_articles)}")
    print(f"   更新 wiki:")
    for name, etype, path in wiki_updated:
        print(f"     [{etype}] {name}")
    
    # 更新 index.md
    update_index(wiki_updated)
    
    # 更新 log.md
    update_log(processed_count, entity_articles, wiki_updated)
    
    return processed_count, entity_articles, wiki_updated

def update_index(wiki_updated):
    """更新 wiki/index.md"""
    index_path = os.path.join(WIKI_PATH, "index.md")
    
    companies = [(n, p) for n, t, p in wiki_updated if t == "company"]
    topics = [(n, p) for n, t, p in wiki_updated if t == "topic"]
    policies = [(n, p) for n, t, p in wiki_updated if t == "policy"]
    
    date = datetime.now().strftime("%Y-%m-%d")
    
    lines = [
        "# Guangchu Wiki 索引\n",
        f"> ⚠️ 本文件由 LLM 维护，上次更新: {date}\n",
        "---\n",
        "## 企业 (entities/companies/)\n",
        "| 名称 | 领域 | 更新日期 |\n",
        "|------|------|----------|\n",
    ]
    for name, _ in companies:
        lines.append(f"| [[{name}]] | 企业 | {date} |\n")
    if not companies:
        lines.append("| （暂无） | — | — |\n")
    
    lines.extend(["\n## 主题 (topics/)\n", "| 主题 | 更新日期 |\n", "|------|----------|\n"])
    for name, _ in topics:
        lines.append(f"| [[{name}]] | {date} |\n")
    if not topics:
        lines.append("| （暂无） | — |\n")
    
    lines.extend(["\n## 政策 (entities/policies/)\n", "| 名称 | 更新日期 |\n", "|------|----------|\n"])
    for name, _ in policies:
        lines.append(f"| [[{name}]] | {date} |\n")
    if not policies:
        lines.append("| （暂无） | — |\n")
    
    lines.append(f"\n---\n*由 Javis 🤖 自动生成*\n")
    
    with open(index_path, "w", encoding="utf-8") as f:
        f.writelines(lines)
    
    print(f"   更新 index.md")

def update_log(processed_count, entity_articles, wiki_updated):
    """追加到 wiki/log.md"""
    log_path = os.path.join(WIKI_PATH, "log.md")
    date = datetime.now().strftime("%Y-%m-%d")
    
    entry = f"\n## [{date}] ingest | 首次批量 ingest\n\n"
    entry += f"**操作:**\n"
    entry += f"- 处理文章: {processed_count} 条\n"
    entry += f"- 发现实体: {len(entity_articles)} 个\n"
    entry += f"- 更新 wiki 页面: {len(wiki_updated)} 个\n\n"
    entry += "**实体列表:**\n"
    for name, arts in entity_articles.items():
        entry += f"- {name}: {len(arts)} 条相关\n"
    entry += "\n**Wiki 页面:**\n"
    for name, etype, path in wiki_updated:
        entry += f"- [{etype}] [[{name}]]\n"
    entry += f"\n> 自动生成 by Javis 🤖\n"
    
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(entry)
    
    print(f"   更新 log.md")

if __name__ == "__main__":
    ingest_all()
