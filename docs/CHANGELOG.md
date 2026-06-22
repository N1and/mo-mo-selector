# 墨墨单词助手 - 更新记录

本文件记录项目的所有重要变更。

## [0.2.0] - 2026-06-22

### 新增

#### 独立弹窗窗口

- 新增 `show_popup_window` Rust 命令，通过 `WebviewWindowBuilder` 创建独立窗口
- 新增 `close_popup_window` Rust 命令关闭弹窗
- 弹窗特性：无边框、置顶、不可调整大小、不显示在任务栏
- 弹窗显示在鼠标光标位置
- 通过 URL hash 参数传递单词数据
- 按 Escape 或点击窗口外部自动关闭
- 标题栏可拖动

#### 有道词典集成

- 新增 `lookup_dictionary` Rust 命令，调用 `dict.youdao.com/jsonapi`
- 无需 API Key，免费获取音标、释义、例句、词形变化
- 替代墨墨 API 的释义接口（墨墨 API 仅返回用户创建的解读，通常为空）

#### 词本详情查看

- 新增 `get_notepad_detail` Rust 命令获取词本详情
- 新增 `NotepadViewer` 组件，展示词本中的单词列表
- 单词详情显示有道词典释义、助记、例句
- 支持"加入学习"和"添加到词本"操作

#### 词本管理增强

- 新增 `update_notepad` Rust 命令更新词本
- 新增 `delete_notepad` Rust 命令删除词本
- 新增编辑词本弹窗（修改标题、简介、标签、内容）
- 新增管理模式：支持批量选择和删除词本
- 词本卡片显示标签，支持按标签筛选

#### 加入学习

- 新增 `add_words_to_study` Rust 命令，调用 `POST /api/v1/study/add_words`
- 弹窗和词本详情中均可将单词加入学习列表

#### 添加到词本

- 新增 `add_words_to_notepad` Rust 命令
- 弹窗中可选择词本并添加单词
- 自动去重，追加到词本 content

### 修复

#### 弹窗关闭问题

- 修复 `window.close()` 在 Tauri webview 中无效的问题
- 改用 Rust 后端 `close_popup_window` 命令关闭窗口

#### 弹窗数据传递

- 修复 hash 路由下 `window.location.search` 为空的问题
- 改为从 `window.location.hash` 解析查询参数

#### 弹窗内容显示

- 修复弹窗显示主窗口内容而非释义的问题
- 修复 `window.location.hash === "#/popup"` 精确匹配失败的问题
- 改用 `startsWith` 判断 hash 路由

#### API 文档修正

- 修正 Base URL：`https://open.maimemo.com/open`
- 修正所有 API 响应格式：包裹在 `{ "data": {...} }` 中
- 修正 `GET /notepads` 需要 `limit`（最大 10）和 `offset` 参数
- 移除不存在的 `GET /vocabulary/{id}` 端点
- 移除不存在的 `POST /notepads/{id}/words` 端点

---

## [0.1.0] - 2026-06-22

### 新增

#### 创建词本功能

- 新增 `create_notepad` Rust 命令，调用墨墨 API `POST /notepads`
- 新增 `createNotepad` TypeScript 封装函数
- 词本管理界面新增「新建词本」弹窗：
  - 词本名称（必填）
  - 简介（必填）
  - 标签（预定义 20 个标签，支持多选）
  - 内容（可选）
- 弹窗宽度 560px，支持滚动

#### 标签系统

- 词本卡片展示标签
- 新增标签筛选栏，自动收集所有不重复标签
- 点击标签筛选，再点取消，「全部」按钮重置

#### Toast 全局提示

- 新增 `Toast` 组件和 `toastStore`
- 替代 `alert()` 避免 Tauri webview 白屏
- 支持 success / error / info 三种类型，3 秒自动消失

### 修复

#### 设置持久化

- Rust `Settings` 结构体添加 `#[serde(rename_all = "camelCase")]`
- 修复 snake_case/camelCase 字段名不匹配导致 Token 重启后丢失

#### Tauri 兼容性

- 所有 Tauri API 调用收口到 `src/lib/tauri.ts`
- 移除组件中直接 `import { invoke } from '@tauri-apps/api/core'`
- 新增 `window.__TAURI_INTERNALS__` 环境检测，浏览器安全降级
- 修复 `alert()` 导致的白屏问题

#### API 响应适配

- 修正词本列表取值路径：`result.data.notepads`
- 修正创建词本响应取值：`result.data.notepad`
- 修正创建词本请求体格式：`{ notepad: { title, brief, tags, content, status } }`
- 词本字段名适配 API：`created_time` / `updated_time`

#### 其他修复

- 修复 `Settings.tsx` 未使用的 `loadSettings` 导入警告
- 词本数量超限时的错误处理

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
