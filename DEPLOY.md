# 🚀 部署指南

## 快速部署步骤

### 步骤 1: 在 GitHub 上创建仓库

1. 访问：https://github.com/new
2. **Repository name**: `xuegangwu.github.io`
3. **Visibility**: Public（必须公开！）
4. ❌ 不要勾选 "Add a README file"
5. 点击 **Create repository**

### 步骤 2: 推送代码

在终端执行以下命令：

```bash
cd /home/admin/openclaw/workspace/projects/xuegangwu.github.io

# 初始化 Git（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit - Personal homepage"

# 设置主分支
git branch -M main

# 添加远程仓库（替换为您的 GitHub 用户名）
git remote add origin https://github.com/xuegangwu/xuegangwu.github.io.git

# 推送
git push -u origin main
```

### 步骤 3: 配置 GitHub Pages

1. 访问：https://github.com/xuegangwu/xuegangwu.github.io/settings/pages
2. **Source**: Deploy from a branch
3. **Branch**: main
4. **Folder**: / (root)
5. 点击 **Save**

### 步骤 4: 等待部署

等待 1-2 分钟，GitHub 会自动部署。

### 步骤 5: 访问

```
https://xuegangwu.github.io/
```

---

## 📁 文件说明

- `index.html` - 个人主页（包含日记 Link）
- `DEPLOY.md` - 本部署指南

---

## 🔗 日记 Link 位置

个人主页上有一个醒目的蓝色卡片：

```
📔 开发日记
参考 sanwan.ai (3 万点 AI) 设计风格

记录每一天的工作进展...

[🏠 访问日记首页] [📖 查看日记列表]
```

点击按钮会跳转到：
- 日记首页：https://xuegangwu.github.io/guangchu/
- 日记列表：https://xuegangwu.github.io/guangchu/diary-list.html

---

## ⚠️ 注意事项

1. **仓库名称必须是**: `xuegangwu.github.io`
   - 这是 GitHub Pages 的用户主页命名规则
   
2. **必须是 Public 仓库**
   - 免费 GitHub 账户只能公开仓库使用 Pages

3. **等待部署**
   - 首次部署需要 1-2 分钟
   - 可以在 GitHub 仓库的 Actions 标签查看部署进度

---

## 🎯 访问地址

部署完成后：

| 页面 | 地址 |
|------|------|
| **个人主页** | https://xuegangwu.github.io/ |
| **日记首页** | https://xuegangwu.github.io/guangchu/ |
| **日记列表** | https://xuegangwu.github.io/guangchu/diary-list.html |

---

## 💡 需要帮助？

如果遇到问题：

1. 检查仓库名称是否正确
2. 确认仓库是 Public
3. 检查 GitHub Pages 设置
4. 清除浏览器缓存

---

© 2026 Terry Wu
