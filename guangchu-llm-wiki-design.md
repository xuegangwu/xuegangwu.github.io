# Guangchu LLM Wiki 设计方案

> 光储行业知识库：爬虫 → SQLite → LLM Wiki → 结构化洞察

---

## 目录结构

```
guangchu/
├── data/
│   └── guangchu.db          # SQLite 主库
├── raw/                     # 原始来源（可选存档）
│   └── sources.md
├── wiki/                    # LLM Wiki 层
│   ├── index.md             # 内容索引（LLM 维护）
│   ├── log.md               # 操作日志（LLM 维护）
│   ├── _schema.md           # LLM 工作流指令（本文件）
│   ├── entities/            # 实体页面
│   │   ├── companies/       # 企业
│   │   │   ├── 隆基绿能.md
│   │   │   ├── 宁德时代.md
│   │   │   └── ...
│   │   ├── policies/        # 政策
│   │   │   ├── 分布式光伏补贴政策.md
│   │   │   └── ...
│   │   └── projects/        # 项目
│   │       └── ...
│   ├── topics/              # 主题/概念
│   │   ├── 光储充一体化.md
│   │   ├── 虚拟电厂VPP.md
│   │   └── ...
│   ├── timelines/           # 时间线（企业动态追踪）
│   │   ├── 隆基绿能动态.md
│   │   └── ...
│   └── syntheses/           # 综合分析
│       ├── 2026-Q1行业总结.md
│       └── ...
├── scripts/
│   ├── crawler.py           # 爬虫
│   ├── ingest.py            # 入库脚本
│   └── lint.py              # 健康检查
└── AGENTS.md                # LLM 维基管家指令
```

---

## SQLite Schema

### 原始文章表
```sql
CREATE TABLE articles (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    url         TEXT UNIQUE NOT NULL,
    source_name TEXT NOT NULL,        -- 来源媒体
    source_url  TEXT,                  -- 来源网站
    published_at DATETIME,            -- 发布时间
    crawled_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    category    TEXT DEFAULT 'unknown', -- enterprise | policy | project
    summary     TEXT,                  -- LLM 提取的摘要
    is_processed BOOLEAN DEFAULT 0,    -- 是否已入 wiki
    raw_content TEXT                   -- 原始文本（可选）
);
```

### 实体表
```sql
CREATE TABLE entities (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT UNIQUE NOT NULL,
    type        TEXT NOT NULL,         -- company | policy | project
    alias       TEXT,                  -- 别名/简称
    description TEXT,
    metadata    TEXT,                  -- JSON 扩展字段
    wiki_page   TEXT,                  -- 对应 wiki 页面路径
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 事件表
```sql
CREATE TABLE events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_id   INTEGER REFERENCES entities(id),
    article_id  INTEGER REFERENCES articles(id),
    title       TEXT NOT NULL,
    event_date  DATETIME,
    description TEXT,
    significance TEXT DEFAULT 'normal', -- high | normal | low
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 关系表
```sql
CREATE TABLE relations (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    from_entity INTEGER REFERENCES entities(id),
    to_entity   INTEGER REFERENCES entities(id),
    rel_type    TEXT NOT NULL,         -- invests | partners | competes | parent_of
    description TEXT,
    article_id  INTEGER REFERENCES articles(id),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Wiki 页面规范

### 企业页面 (`wiki/entities/companies/隆基绿能.md`)
```markdown
---
type: company
name: 隆基绿能
alias: 隆基
sector: 光伏
founded: 2000
wiki_page: wiki/entities/companies/隆基绿能.md
updated: 2026-04-05
tags: [光伏, 单晶硅, TOPCon]
---

# 隆基绿能

## 简介
全球最大的单晶硅光伏制造商。

## 核心业务
- 单晶硅片（全球第一）
- 电池组件
- 分布式光伏系统

## 近期动态
> [!dynamic]
> - [[2026-03-28]] 隆基绿能宣布新型 TOPCon 电池效率突破 27.5%
> - [[2026-03-15]] 与华为签署全面战略合作协议
> ...

## 关联实体
- [[宁德时代]] - 战略合作伙伴（光储一体化项目）
- [[华为]] - 数字能源战略合作

## 竞争关系
- [[通威股份]] - 同为光伏龙头，存在硅片/电池竞争

## 相关政策
- [[分布式光伏补贴政策]] - 受政策直接影响

## 数据来源
- [[articles/128]] - 2026-03-28 文章
```

### 政策页面 (`wiki/entities/policies/分布式光伏补贴政策.md`)
```markdown
---
type: policy
name: 分布式光伏补贴政策
jurisdiction: 国家能源局
effective_date: 2026-01-01
wiki_page: wiki/entities/policies/分布式光伏补贴政策.md
updated: 2026-04-05
tags: [补贴, 分布式, 光伏]
---

# 分布式光伏补贴政策

## 核心内容
- 补贴标准：0.05元/千瓦时
- 适用范围：装机容量≤6MW的分布式项目
- 发放方式：按实际发电量结算

## 政策演变
- [[2024-2025]] 初始政策，补贴0.10元/千瓦时
- [[2026-01-01]] 补贴退坡至0.05元/千瓦时

## 受影响企业
- [[隆基绿能]] - 分布式产品线直接受益
- [[阳光电源]] - 分布式逆变器需求增长

## 相关项目
- [[某园区光储充一体化项目]]

## 待澄清问题
- [!open] 2026年Q2是否会进一步退坡？
```

---

## AGENTS.md（LLM 维基管家指令）

```markdown
# Guangchu LLM Wiki 管家

## 角色
你是光储行业知识库的维护者。你的职责是：
1. 将爬虫抓取的文章提炼入库，更新相关实体页面
2. 维护 wiki 的交叉引用和一致性
3. 发现矛盾、过时、缺失的内容并标记

## 数据源
- SQLite: `data/guangchu.db`
- 表：`articles`, `entities`, `events`, `relations`

## 工作流

### Ingest（新文章入库）
1. 读取新文章的 `title`, `summary`, `category`, `published_at`
2. 识别涉及的实体（公司/政策/项目）
3. 更新 `entities` 表（如有新实体，创建条目）
4. 写入 `events` 表（提取关键事件）
5. 在对应 wiki 页面追加动态，标注来源
6. 更新 `wiki/index.md` 中的实体索引
7. 在 `wiki/log.md` 记录 ingest 操作

### Query（回答问题）
1. 读取 `wiki/index.md` 定位相关页面
2. 综合多个 wiki 页面内容给出回答
3. 如回答产生新洞察，建议创建新 synthesis 页面

### Lint（健康检查）
每月执行一次：
1. 扫描 wiki 所有页面，检查矛盾陈述
2. 找出 30 天内无更新的重要页面
3. 找出无 inbound 链接的 orphan 页面
4. 对比 `articles` 表中的新文章，检查是否有实体漏更新
5. 将问题记录到 `wiki/log.md` 的 lint 段落

## 格式规范
- 页面顶部必须有 YAML frontmatter（type, name, updated, tags）
- 动态条目使用 `> [!dynamic]` callout
- 待核实问题使用 `> [!open]` callout
- 使用 `[[页面名]]` 进行 wiki 内部链接
- 日期格式：`[[2026-03-28]]`
- 文章引用格式：`[[articles/128]]`

## 约束
- 不修改 `raw/` 目录中的任何文件
- wiki 页面以 Markdown 格式保存在 `wiki/` 目录
- 所有变更记录到 `wiki/log.md`
```

---

## 爬虫设计（crawler.py）

```python
import sqlite3
import feedparser  # RSS 源
import httpx
from readability import Document
from datetime import datetime

SOURCES = [
    # 行业媒体 RSS
    "https://rsshub.app/solarbe/news",
    "https://rsshub.app/bloomberg/energy",
    # 政府政策
    "https://rsshub.app/nea/policy",
    # 企业公告（可通过搜索获取）
]

DB_PATH = "data/guangchu.db"

def crawl():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    for source_url in SOURCES:
        feed = feedparser.parse(source_url)
        for entry in feed.entries:
            # 查重
            cursor.execute("SELECT id FROM articles WHERE url = ?", (entry.link,))
            if cursor.fetchone():
                continue

            # 提取正文
            try:
                resp = httpx.get(entry.link, timeout=10)
                doc = Document(resp.text)
                summary = doc.summary()[:500]  # 取前500字符
            except:
                summary = entry.get("summary", "")[:500]

            # 入库
            cursor.execute("""
                INSERT INTO articles (title, url, source_name, published_at, summary, category)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                entry.title,
                entry.link,
                feed.feed.get("title", source_url),
                datetime.fromtimestamp(time.mktime(entry.published_parsed)) if entry.get("published_parsed") else None,
                summary,
                detect_category(entry)  # 简单规则分类
            ))
            print(f"Inserted: {entry.title}")

    conn.commit()
    conn.close()

def detect_category(entry):
    text = (entry.title + entry.get("summary", "")).lower()
    if any(k in text for k in ["补贴", "政策", "规划", "通知", "管理办法"]):
        return "policy"
    if any(k in text for k in ["项目", "签约", "开工", "并网", "投产"]):
        return "project"
    return "enterprise"
```

---

## 实施路线

### Phase 1: 数据库 + 爬虫
- [ ] 创建 SQLite schema
- [ ] 实现基础爬虫（3-5 个 RSS 源）
- [ ] 手动触发第一次 ingest

### Phase 2: Wiki 层
- [ ] 创建目录结构和 AGENTS.md
- [ ] 手动创建 3-5 个核心企业/政策页面
- [ ] 跑通 LLM ingest 流程

### Phase 3: 自动化
- [ ] cron 定时爬虫（每 6 小时）
- [ ] LLM 自动 ingest（新文章自动处理）
- [ ] 定期 lint

### Phase 4: 扩展
- [ ] 增加更多 RSS 源
- [ ] 支持新闻网站爬虫（非 RSS）
- [ ] 添加企业公告结构化提取
- [ ] 合成报告生成（季度行业总结）

---

## 关键技术选择

| 组件 | 选择 | 理由 |
|------|------|------|
| 数据库 | SQLite | 轻量、无服务 Terry 熟悉 |
| 爬虫 | httpx + feedparser | 简单可靠 |
| LLM | MiniMax-M2 | 已配置、低成本 |
| wiki 管理 | 我（通过 OpenClaw） | 直接在会话中处理 |
| 搜索 | 初期用 index.md + grep | 小规模足够 |

---

## 与现有项目的关系

- **xuegangwu.github.io/guangchu** → 前端展示（未来）
- **Solaripple** → 企业级光储解决方案（不同定位）
- **Guangchu LLM Wiki** → 行业情报基础设施
