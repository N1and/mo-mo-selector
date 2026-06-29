# 墨墨单词助手

一个使用 Tauri 2 + React + Rust 开发的 Windows 桌面应用，支持快捷键查词，并添加到墨墨背单词云词本。

## 功能特性

- **快捷键查词** - 按 `Ctrl+Shift+A` 查询剪贴板中的单词
- **有道词典** - 免费获取音标、释义、例句、词形变化
- **独立弹窗** - 在鼠标位置显示查词结果，无边框置顶窗口
- **加入学习** - 一键将单词加入墨墨学习列表
- **词本管理** - 查看、创建、编辑、删除云词本
- **词本详情** - 查看词本中的单词列表和释义
- **系统托盘** - 最小化到托盘，托盘菜单显示/退出
- **开机自启动** - 支持开机自动启动，设置页面可开关
- **今日新增** - 查看今日新增的单词列表
- **运行日志** - 记录查词、词本操作等日志

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19, TypeScript, Vite 7 |
| UI | Tailwind CSS 4 |
| 状态管理 | Zustand |
| 桌面框架 | Tauri 2.0 |
| 后端 | Rust |
| API | 墨墨背单词开放 API、有道词典 API |

## 安装方法

### 环境要求

- Node.js 18+
- Rust 1.70+
- Windows 10/11

### 安装步骤

1. 克隆项目

```bash
git clone https://github.com/your-username/mo-mo-selector.git
cd mo-mo-selector
```

2. 安装依赖

```bash
npm install
```

3. 启动开发

```bash
npm run tauri dev
```

4. 构建安装程序

```bash
npm run tauri build
```

## 配置说明

### 获取 API 密钥

1. **墨墨背单词 API Token**
   - 打开墨墨背单词 App
   - 进入「我的」→「更多设置」→「实验功能」→「开放 API」
   - 复制 API Token

### 应用设置

启动应用后，点击「设置」标签页，填写 API 密钥：

- **墨墨背单词 API Token** - 必填
- **快捷键** - 默认 `Ctrl+Shift+A`
- **默认词本** - 选择默认添加单词的词本

## 使用说明

### 查词

1. 复制任意英文单词到剪贴板
2. 按 `Ctrl+Shift+A` 触发查词
3. 在鼠标位置弹出查词窗口
4. 查看单词释义、音标
5. 点击「加入学习」或「添加到词本」

### 词本管理

1. 点击左侧「词本管理」
2. 左侧查看词本列表，支持搜索和标签筛选
3. 点击词本卡片查看词本详情
4. 支持创建、编辑、删除词本
5. 在词本详情中查看单词释义

## 开发指南

### 常用命令

```bash
# 启动开发服务器
npm run tauri dev

# 构建前端
npm run build

# 检查 Rust 编译
cd src-tauri && cargo check

# TypeScript 类型检查
npx tsc --noEmit

# 构建安装程序
npm run tauri build
```
