# 墨墨单词助手 - 更新记录

本文件记录项目的所有重要变更。

## [0.1.0] - 2026-06-22

### 初始版本

#### 项目初始化

- 使用 `create-tauri-app` 初始化 Tauri + React + TypeScript 项目
- 配置 Tailwind CSS 4 作为样式框架
- 配置 Zustand 进行状态管理

#### 前端实现

- 创建三个主要组件：
  - `Monitor.tsx` - 划词监控界面
  - `NotepadManager.tsx` - 词本管理界面
  - `Settings.tsx` - 设置界面
- 创建三个 Zustand stores：
  - `wordStore.ts` - 单词状态管理
  - `notepadStore.ts` - 词本状态管理
  - `settingsStore.ts` - 设置状态管理
- 创建 Tauri 命令封装 `tauri.ts`

#### 后端实现

- 添加 Tauri 命令：
  - `get_clipboard_text` - 获取剪贴板文本
  - `check_vocabulary` - 检查单词是否在墨墨词库
  - `get_notepads` - 获取词本列表
  - `add_words_to_notepad` - 添加单词到词本
  - `get_cursor_position` - 获取鼠标位置
  - `load_settings` / `save_settings` - 设置持久化
- 集成 `tauri-plugin-clipboard-manager` 插件
- 集成 `reqwest` 用于 HTTP 请求

#### 依赖配置

- 添加 `@tauri-apps/plugin-store` 用于持久化存储
- 添加 `tailwindcss`、`postcss`、`autoprefixer`
- 添加 `@tailwindcss/postcss`（Tailwind CSS 4 需要）
- 添加 `reqwest`、`tokio` 用于 Rust HTTP 请求

#### 问题修复

- 修复 Tailwind CSS 4 配置问题：
  - 使用 `@tailwindcss/postcss` 替代 `tailwindcss`
  - 使用 `@import "tailwindcss"` 替代 `@tailwind` 指令
- 修复 Rust 未使用导入警告
- 修复输入 Token 时白屏问题（移除自动加载词本逻辑）
- 移除自动剪贴板监控，改为仅快捷键触发

### 文档

- 创建设计文档 `docs/DESIGN.md`
- 创建实现进度文档 `docs/PROGRESS.md`
- 创建更新记录文档 `docs/CHANGELOG.md`
- 创建 API 文档 `docs/API.md`

### 移除功能

- 移除单词归一化功能（DeepSeek API 集成）
- 移除翻译 API 集成
- 从设置界面移除 DeepSeek API Key 和翻译 API Key 配置
- 从设置存储移除 deepseekApiKey 和 translationApiKey 字段
- 移除自动剪贴板监控功能

### 设计变更

- 架构图改为 Mermaid 格式
- 添加浏览器插件架构设计（后期实现）
- 创建 UI 设计规范文档 `docs/UI.md`
- 快捷键改为仅触发查询，不再自动监控剪贴板

---

## 版本格式

本文件遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/) 格式。

### 版本号规则

- **主版本号 (X)**: 不兼容的 API 更改
- **次版本号 (Y)**: 向后兼容的功能性新增
- **修订号 (Z)**: 向后兼容的问题修复

### 变更类别

- **新增 (Added)**: 新功能
- **修改 (Changed)**: 现有功能的更改
- **弃用 (Deprecated)**: 即将移除的功能
- **移除 (Removed)**: 已移除的功能
- **修复 (Fixed)**: Bug 修复
- **安全 (Security)**: 安全相关更改
