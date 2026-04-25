# MEMORY.md - Long-Term Memory

## Terry Wu (伍学纲)
- **Name:** Terry Wu
- **Contact:** wuxuegang@gmail.com, GitHub/xuegangwu, LinkedIn
- **Timezone:** America/Los_Angeles (PDT)
- **Background:** CIO/VP/CEO at Risen (2019–2026), Software Dev at Ricoh (2002–2019, 17年软件开发)
- **Education:** AI Master (in progress) at U of Colorado, EMBA at CEIBS (2023–2025, 已毕业), Master's at ECUST (1999–2002)
- **Language:** Japanese N2 (理光17年日本工作经验)
- **Focus:** Solar + energy storage investment systems, AI applications, Agent Harness Engineer 目标

## Terry's Active Projects

### 1. xuegangwu.github.io (个人主页)
- **Repo:** https://github.com/xuegangwu/xuegangwu.github.io
- **Main site:** served at xuegangwu.github.io
- **Guangchu project:** separate repo (xuegangwu/guangchu), served at xuegangwu.github.io/guangchu/
- **Tech:** Plain HTML/CSS/JS, Apple-style design, Inter font, Leaflet, Three.js
- **Deploy:** GitHub Pages (main branch, /root folder)
- **Language:** Bilingual (EN/ZH)

### 2. Solaripple (光储数字基础设施)
- **Site:** https://www.solaripple.com
- **Platform:** https://enos.solaripple.com
- **GitHub org:** https://github.com/solaripple (no public repos yet)
- **Focus:** Industrial clean energy digital infrastructure
- **Products:** 光储充一体化, 数字孪生平台, 虚拟电厂(VPP), AI调度引擎
- **Stats:** 500+ MW capacity, 50+ parks, 15-25% electricity savings

### 3. SmartSolar (光储电站运维平台)
- **Dir:** `/Users/terry/.openclaw/workspace/smartsolar/`
- **Repo:** https://github.com/xuegangwu/smartsolar
- **Deploy:** https://smartsolar.solaripple.com（服务器 47.100.20.52，端口 3003）
- **Focus:** 面向运维服务商和电站业主的智能运维平台
- **Core:** 设备台账 + 工单管理 + 巡检计划 + KPI统计 + AI分析 + **渠道商积分体系**
- **Tech:** React + Vite + TS + Ant Design + Express + MongoDB
- **渠道体系新增（ITER-11）：**
  - `Partner` / `PartnerUser` / `PointRule` / `PointTransaction` / `PointRedemption` 模型
  - `/api/partners/*` 路由：登录、仪表盘、积分流水、兑换
  - 工单关联 `partnerId`，关闭时触发积分赚取
  - 演示账号：`dist_admin / partner123`（华东新能源分销，金牌）
  - 等级：铜牌→银牌(5000分)→金牌(20000分)→钻牌(50000分)，积分倍数 1.0~2.0
  - 前端页面：/partner-login, /partner-dashboard, /partner-transactions, /partner-mall, /partner-admin
  - AI 故障分析：接入 Kimi API（需配置 KIMI_API_KEY），工单详情页可直接分析
  - Markdown 渲染：react-markdown + remark-gfm

### 4. 光储龙虾 (Guangchu - Solar-Storage News)
- **IP:** 47.90.138.136 (domain pending)
- **Repo:** https://github.com/xuegangwu/guangchu
- **Also served at:** xuegangwu.github.io/guangchu/ (from separate repo)
- **Focus:** 光储行业信息聚合 - solar + storage industry news/policy/project aggregation
- **Stats:** 128 today, 3,856 total, 9 published

## Site Maintenance (xuegangwu.github.io)
- **Repo:** https://github.com/xuegangwu/xuegangwu.github.io
- **Main site:** This repo, served at xuegangwu.github.io
- **Guangchu project:** Separate repo (xuegangwu/guangchu), served at xuegangwu.github.io/guangchu/
- **Tech:** Plain HTML/CSS/JS, Apple-style design, Inter font, Leaflet, Three.js
- **Deploy:** GitHub Pages (main branch, /root folder)
- **Language:** Bilingual (EN/ZH), switches based on user preference

## Me
- **Name:** Javis 🤖
