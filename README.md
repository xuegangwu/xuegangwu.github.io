# Terry Wu - Portfolio

个人项目展示页面 - GitHub Pages

**访问地址**: https://xuegangwu.github.io/portfolio/

---

## 🚀 部署到 GitHub Pages

### 方法 1：使用 gh-pages 分支（推荐）

```bash
# 1. 进入项目目录
cd /home/admin/openclaw/workspace/projects/portfolio

# 2. 初始化 git（如果还没有）
git init

# 3. 添加所有文件
git add .

# 4. 提交
git commit -m "Initial commit - Portfolio website"

# 5. 添加远程仓库
git remote add origin git@github.com:xuegangwu/portfolio.git

# 6. 创建 gh-pages 分支并推送
git checkout -b gh-pages
git push -u origin gh-pages
```

### 方法 2：使用 main 分支

```bash
# 1. 进入项目目录
cd /home/admin/openclaw/workspace/projects/portfolio

# 2. 初始化 git
git init
git add .
git commit -m "Initial commit"

# 3. 添加远程仓库
git remote add origin git@github.com:xuegangwu/portfolio.git

# 4. 推送到 main 分支
git branch -M main
git push -u origin main
```

---

## ⚙️ GitHub Pages 配置

### 如果使用 gh-pages 分支

1. 访问：https://github.com/xuegangwu/portfolio/settings/pages
2. Source 选择：**Deploy from a branch**
3. Branch 选择：**gh-pages**
4. Folder 选择：**/ (root)**
5. 点击 **Save**

### 如果使用 main 分支

1. 访问：https://github.com/xuegangwu/portfolio/settings/pages
2. Source 选择：**Deploy from a branch**
3. Branch 选择：**main**
4. Folder 选择：**/ (root)**
5. 点击 **Save**

---

## 📁 文件结构

```
portfolio/
├── index.html      # 主页
└── README.md       # 说明文档
```

---

## 🎨 页面内容

### Header
- 个人头像（首字母缩写）
- 姓名：Terry Wu
- 职位：光储投资分析系统开发者
- 社交链接：GitHub、项目链接

### Projects
- 🗺️ 光储电站投资地图系统
- 🦞 光储龙虾

### Skills
- 🌐 前端开发
- 🗺️ 地图可视化
- 🔧 后端开发
- 💾 数据库
- 🤖 自动化
- 📊 数据分析

---

## 🎯 特性

- ✅ 响应式设计（支持手机、平板、桌面）
- ✅ 现代化渐变背景
- ✅ 悬停动画效果
- ✅ 项目卡片展示
- ✅ 技术栈网格布局
- ✅ 社交链接集成

---

## 🔗 链接

- **GitHub**: https://github.com/xuegangwu
- **投资地图**: https://github.com/xuegangwu/china-solar-storage
- **光储龙虾**: https://github.com/xuegangwu/guangchu

---

## 📝 自定义

### 修改个人信息

编辑 `index.html`：
- 修改姓名、职位
- 替换头像（可以使用图片链接）
- 更新社交链接

### 添加更多项目

复制 `.project-card` 块，修改内容：
```html
<div class="project-card">
    <div class="project-icon">🚀</div>
    <h3>新项目名称</h3>
    <p>项目描述...</p>
    <div class="project-tags">
        <span class="tag">技术 1</span>
        <span class="tag">技术 2</span>
    </div>
    <div class="project-links">
        <a href="#">GitHub</a>
        <a href="#">演示</a>
    </div>
</div>
```

---

## 📊 部署状态

部署后访问：https://xuegangwu.github.io/portfolio/

---

**祝您使用愉快！** 🎉
