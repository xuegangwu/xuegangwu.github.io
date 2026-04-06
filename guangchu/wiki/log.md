# Guangchu Wiki 操作日志

> 格式说明: 每个条目以 `## [日期] action | 描述` 开头
> 可用命令: `grep "^## \[" log.md | tail -10` 查看最近 10 条

---

## [2026-04-05] setup | Guangchu LLM Wiki 初始化

**操作:**
- 创建数据库 `data/guangchu.db` (articles, entities, events, relations 四张表)
- 创建爬虫 `scripts/crawler.py` (支持 RSS 源抓取)
- 创建 Wiki 层目录结构
- 创建 `wiki/_schema.md` (LLM 工作流指令)
- 创建 `wiki/index.md` (内容索引)
- 创建本文件 `wiki/log.md` (操作日志)

**当前状态:**
- 数据库: 空，待首次爬取
- Wiki: 初始化完成，待填充内容

---

## [2026-04-05] deploy | 部署至 GitHub Pages

**操作:**
- 域名: wuxuegang.com (待备案)
- 同时服务: xuegangwu.github.io/guangchu/
- 维基站: https://github.com/xuegangwu/guangchu

---

## [2026-04-05] ingest | 首次批量 ingest

**操作:**
- 处理文章: 46 条
- 发现实体: 17 个
- 更新 wiki 页面: 11 个

**实体列表:**
- 国家能源局: 46 条相关
- 国家电网: 6 条相关
- 抽水蓄能: 1 条相关
- 中国石油: 2 条相关
- 能源法: 2 条相关
- 哈萨克斯坦: 1 条相关
- 中俄东线天然气管道: 1 条相关
- 浙江省电网转型: 1 条相关
- 氢能: 1 条相关
- 煤层气: 1 条相关
- 可再生能源: 5 条相关
- 白鹤滩至浙江特高压: 1 条相关
- 特高压: 1 条相关
- 光伏: 1 条相关
- 土库曼斯坦: 1 条相关
- 储能: 1 条相关
- 清洁取暖: 1 条相关

**Wiki 页面:**
- [policy] [[国家能源局]]
- [company] [[国家电网]]
- [topic] [[抽水蓄能]]
- [company] [[中国石油]]
- [topic] [[能源法]]
- [topic] [[氢能]]
- [topic] [[煤层气]]
- [topic] [[可再生能源]]
- [topic] [[光伏]]
- [topic] [[储能]]
- [topic] [[清洁取暖]]

> 自动生成 by Javis 🤖
