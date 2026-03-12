# 🚀 GitHub Pages 部署说明

**更新时间**: 2026-03-12 15:55

---

## ⚠️ 重要：GitHub Pages 配置步骤

由于 GitHub Pages 需要手动配置，请按以下步骤操作：

---

## 📋 第 1 步：访问仓库

**打开**: https://github.com/xuegangwu/portfolio

**确认**:
- ✅ 可以看到 index.html 文件
- ✅ 可以看到 README.md 文件
- ✅ 仓库是 **Public**（不是 Private）

---

## 📋 第 2 步：配置 GitHub Pages

### 方法 A：使用 Settings（推荐）

1. **访问**: https://github.com/xuegangwu/portfolio/settings/pages

2. **Source 配置**:
   - **Deploy from a branch**
   - **Branch**: main
   - **Folder**: / (root)

3. **点击 Save**

4. **等待 1-2 分钟**

5. **访问**: https://xuegangwu.github.io/portfolio/

---

### 方法 B：如果 Settings 页面无法访问

1. **访问**: https://github.com/xuegangwu/portfolio

2. **点击 Settings 标签**（顶部导航）

3. **左侧菜单找到 Pages**

4. **配置**:
   - Source: Deploy from a branch
   - Branch: main
   - Folder: / (root)

5. **点击 Save**

---

## ⚠️ 如果仓库是 Private

**GitHub 免费账户无法为 Private 仓库启用 Pages！**

**解决**:

1. 访问：https://github.com/xuegangwu/portfolio/settings
2. 滚动到 **Danger Zone**
3. 点击 **Change visibility**
4. 选择 **Make public**
5. 确认

---

## ✅ 验证部署

### 1. 检查部署状态

访问：https://github.com/xuegangwu/portfolio/deployments

应该看到：
- ✅ github-pages 部署
- ✅ 状态：Success

### 2. 访问 Pages

访问：https://xuegangwu.github.io/portfolio/

应该看到：
- 👤 个人头像（TW）
- 📛 Terry Wu
- 🗺️ 投资地图项目
- 🦞 光储龙虾项目
- 💡 技术栈

---

## 🔧 故障排查

### 还是 404？

**原因**: 
1. Pages 还未配置
2. 仓库是 Private
3. 部署还未完成

**解决**:
1. 确认已按上述步骤配置 Pages
2. 将仓库改为 Public
3. 等待 1-2 分钟

### Settings 页面无法访问？

**原因**: 浏览器缓存或网络问题

**解决**:
1. 清除浏览器缓存（Ctrl+Shift+Delete）
2. 使用无痕模式访问
3. 或者直接访问：https://github.com/xuegangwu/portfolio/settings/pages

---

## 📞 快速链接

| 功能 | 链接 |
|------|------|
| **仓库主页** | https://github.com/xuegangwu/portfolio |
| **Pages 设置** | https://github.com/xuegangwu/portfolio/settings/pages |
| **部署状态** | https://github.com/xuegangwu/portfolio/deployments |
| **GitHub Pages** | https://xuegangwu.github.io/portfolio/ |

---

## 🎯 总结

**代码已推送**: ✅ main 分支已包含 index.html

**需要配置**: 在 GitHub 上配置 Pages 从 main 分支部署

**配置后等待**: 1-2 分钟

**访问**: https://xuegangwu.github.io/portfolio/

---

**请按上述步骤在 GitHub 上配置 Pages！** 🚀
