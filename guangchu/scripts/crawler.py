#!/usr/bin/env python3
"""
Guangchu 爬虫 - 国家能源局直爬版
正则匹配新闻列表页
"""

import sqlite3
import os
import re
import time
from datetime import datetime
import urllib.request

# ========== 配置 ==========
DB_PATH = os.path.join(os.path.dirname(__file__), "../data/guangchu.db")

# 国家能源局新闻/政策页面
NEA_SOURCES = [
    {
        "name": "国家能源局-新闻中心",
        "url": "https://www.nea.gov.cn/news/index.htm",
        "category": "enterprise",
        "filter_kw": []  # 不过滤，全部收录
    },
    {
        "name": "国家能源局-最新文件",
        "url": "https://www.nea.gov.cn/policy/zxwj.htm",
        "category": "policy",
        "filter_kw": ["光伏", "储能", "新能源", "可再生能源", "补贴", "并网", "分布式", "充电", "电力", "能源", "通知", "办法", "规定"]
    },
    {
        "name": "国家能源局-通知公告",
        "url": "https://www.nea.gov.cn/policy/tz.htm",
        "category": "policy",
        "filter_kw": ["光伏", "储能", "新能源", "补贴", "并网", "分布式", "充电", "电力"]
    },
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9",
}

# ========== 数据库操作 ==========
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def article_exists(conn, url):
    cur = conn.execute("SELECT id FROM articles WHERE url = ?", (url,))
    return cur.fetchone() is not None

def insert_article(conn, article):
    conn.execute("""
        INSERT OR IGNORE INTO articles (title, url, source_name, source_url, published_at, category, summary)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        article["title"],
        article["url"],
        article["source_name"],
        article.get("source_url"),
        article.get("published_at"),
        article.get("category"),
        article.get("summary", "")
    ))

def detect_category(text):
    policy_kw = ["补贴", "政策", "规划", "通知", "管理办法", "规定", "条例", "复函", "能源局", "发布", "办法", "意见", "关于"]
    project_kw = ["项目", "签约", "开工", "并网", "投产", "落地", "建设", "启动", "启用", "工程", "签署"]
    for kw in policy_kw:
        if kw in text:
            return "policy"
    for kw in project_kw:
        if kw in text:
            return "project"
    return "enterprise"

# ========== 页面抓取 ==========
def fetch_page(url, timeout=15):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        charset = "utf-8"
        content_type = resp.headers.get("content-type", "")
        if "charset=" in content_type:
            charset = content_type.split("charset=")[-1].split(";")[0].strip()
        return resp.read().decode(charset, errors="replace")

# ========== 正则解析 ==========
# 国家能源局新闻列表格式: <li><a href="URL">标题</a><span class="date">(YYYY-MM-DD)</span></li>
PATTERN = re.compile(
    r'<li[^>]*>.*?<a[^>]+href=["\']([^"\']+)["\'][^>]*>([^<]+)</a><span[^>]+>\((\d{4}-\d{2}-\d{2})\)</span>.*?</li>',
    re.DOTALL
)

def parse_list_page(html):
    """从列表页提取新闻条目"""
    items = []
    for m in PATTERN.finditer(html):
        url = m.group(1).strip()
        title = m.group(2).strip()
        date = m.group(3).strip()
        
        # 补全相对链接
        if url.startswith("/"):
            url = "https://www.nea.gov.cn" + url
        elif url.startswith("http://www.nea.gov.cn") and not url.startswith("https"):
            url = url.replace("http://", "https://")
        
        items.append({"url": url, "title": title, "date": date})
    return items

def crawl_source(source):
    """爬取单个源"""
    print(f"  抓取 {source['name']}...")
    articles = []
    
    try:
        html = fetch_page(source["url"])
        items = parse_list_page(html)
        
        for item in items:
            title = item["title"]
            url = item["url"]
            date = item["date"]
            
            if not title or not url:
                continue
            
            # 关键词过滤
            if source.get("filter_kw"):
                if not any(kw in title for kw in source["filter_kw"]):
                    continue
            
            # 自动分类
            category = source["category"]
            if category == "enterprise":
                category = detect_category(title)
            
            articles.append({
                "title": title,
                "url": url,
                "source_name": source["name"],
                "source_url": source["url"],
                "published_at": date + " 00:00:00" if date else None,
                "category": category,
                "summary": f"来源: {source['name']}，日期: {date}"
            })
        
        print(f"    解析到 {len(items)} 条，收录 {len(articles)} 条（过滤后）")
        
    except Exception as e:
        print(f"    [ERROR] {e}")
    
    return articles

def crawl_all():
    """爬取所有配置的源"""
    conn = get_db()
    total_new = 0
    
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 开始抓取...")
    
    for source in NEA_SOURCES:
        articles = crawl_source(source)
        
        for article in articles:
            if not article_exists(conn, article["url"]):
                insert_article(conn, article)
                total_new += 1
        
        if articles:
            conn.commit()
        
        time.sleep(2)
    
    conn.close()
    print(f"\n抓取完成，共新增 {total_new} 条")
    return total_new

def get_stats():
    """显示数据库统计"""
    conn = get_db()
    cur = conn.execute("SELECT category, COUNT(*) as count FROM articles GROUP BY category")
    stats = dict(cur.fetchall())
    total = conn.execute("SELECT COUNT(*) FROM articles").fetchone()[0]
    unprocessed = conn.execute("SELECT COUNT(*) FROM articles WHERE is_processed = 0").fetchone()[0]
    conn.close()
    return {"total": total, "unprocessed": unprocessed, "by_category": stats}

def show_recent(limit=10):
    """显示最近的文章"""
    conn = get_db()
    cur = conn.execute("""
        SELECT id, title, source_name, published_at, category, is_processed
        FROM articles
        ORDER BY crawled_at DESC
        LIMIT ?
    """, (limit,))
    rows = cur.fetchall()
    conn.close()
    return rows

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "--stats":
            stats = get_stats()
            print(f"数据库统计:")
            print(f"  总文章数: {stats['total']}")
            print(f"  未处理: {stats['unprocessed']}")
            for cat, cnt in stats["by_category"].items():
                print(f"  {cat}: {cnt}")
        elif sys.argv[1] == "--recent":
            rows = show_recent(int(sys.argv[2]) if len(sys.argv) > 2 else 10)
            print(f"最近 {len(rows)} 条文章:")
            for r in rows:
                flag = "✓" if r["is_processed"] else "✗"
                print(f"  [{r['category']}][{flag}] {r['published_at']} {r['title'][:60]}")
    else:
        crawl_all()
