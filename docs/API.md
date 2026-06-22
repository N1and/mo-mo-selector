# 墨墨单词助手 - API 文档

本文档描述墨墨单词助手使用的外部 API 接口及内部 Tauri 命令。

## 目录

- [外部 API](#外部-api)
  - [墨墨背单词 API](#墨墨背单词-api)
  - [有道词典 API](#有道词典-api)
- [Tauri 命令接口](#tauri-命令接口)

---

## 外部 API

### 墨墨背单词 API

#### 基础信息

| 项目 | 值 |
|------|-----|
| Base URL | `https://open.maimemo.com/open` |
| 认证方式 | Bearer Token |
| 请求格式 | JSON |
| 响应格式 | JSON（包裹在 `data` 字段中） |

所有请求需要在 Header 中携带 Bearer Token：

```
Authorization: Bearer {your_token}
```

Token 获取方式：
1. 墨墨背单词 App → 我的 → 更多设置 → 实验功能 → 开放 API
2. 或点击[此处](https://open.maimemo.com/open/api/v1/tokens/openapi)获取

#### 请求频率限制

| 时间窗口 | 最大请求数 |
|----------|------------|
| 10 秒 | 20 次 |
| 60 秒 | 40 次 |
| 5 小时 | 2000 次 |

#### 词汇查询

```
GET /api/v1/vocabulary?spelling={word}
```

返回单词的 `id` 和 `spelling`，用于后续操作。

响应示例：
```json
{
  "data": {
    "voc": {
      "id": "5a7BFf4F63612e5AD9fdebB7a50D3881",
      "spelling": "hello"
    }
  }
}
```

#### 批量查询词汇

```
POST /api/v1/vocabulary/query
```

请求体：
```json
{ "ids": ["voc_id_1", "voc_id_2"] }
```

#### 获取词本列表

```
GET /api/v1/notepads?limit={limit}&offset={offset}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| limit | integer | 是 | 查询数量（最大 10） |
| offset | integer | 是 | 分页偏移量 |

#### 获取词本详情

```
GET /api/v1/notepads/{id}
```

返回 `content`（原始内容）和 `list`（结构化列表）字段。

#### 创建词本

```
POST /api/v1/notepads
```

请求体：
```json
{
  "notepad": {
    "title": "词本名称",
    "brief": "词本描述",
    "tags": ["考研"],
    "content": "hello\nworld",
    "status": "UNPUBLISHED"
  }
}
```

预定义标签：`小学` `初中` `高中` `大学教科书` `四级` `六级` `专四` `专八` `考研` `新概念` `SAT` `托福` `雅思` `GRE` `GMAT` `托业` `BEC` `词典` `词频` `其他`

#### 更新词本

```
POST /api/v1/notepads/{id}
```

需提供所有必填字段，不支持部分更新。修改 `content` 字段来增删单词。

#### 删除词本

```
DELETE /api/v1/notepads/{id}
```

#### 获取释义

```
GET /api/v1/interpretations?voc_id={id}
```

#### 获取助记

```
GET /api/v1/notes?voc_id={id}
```

#### 获取例句

```
GET /api/v1/phrases?voc_id={id}
```

#### 加入学习（公测）

```
POST /api/v1/study/add_words
```

请求体：
```json
{
  "words": [{ "id": "voc_id" }],
  "advance": false
}
```

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 400 | 请求参数错误 |
| 401 | 认证失败 |
| 404 | 资源不存在 |
| 429 | 请求频率超限 |
| 500 | 服务器错误 |

---

### 有道词典 API

无需 API Key，用于获取单词释义、音标、例句、词形变化。

```
GET https://dict.youdao.com/jsonapi?q={word}
```

响应结构（简化）：
```json
{
  "ec": {
    "word": [{
      "usphone": "həˈloʊ",
      "ukphone": "həˈləʊ",
      "trs": [{ "tr": [{ "l": { "i": ["int. 你好"] } }] }],
      "wfs": [{ "wf": { "name": "复数", "value": "hellos" } }]
    }]
  },
  "blng_sents_part": {
    "sentence-pair": [{
      "sentence": "Hello, how are you?",
      "sentence-translation": "你好，你好吗？"
    }]
  }
}
```

---

## Tauri 命令接口

以下是应用内部的 Tauri 命令，前端通过 `invoke` 调用。

所有命令返回格式：`{ "data": { ... } }`

### get_clipboard_text

获取系统剪贴板文本。

```typescript
const text = await invoke<string>('get_clipboard_text');
```

### load_settings

加载本地设置。

```typescript
const settings = await invoke('load_settings');
```

返回 `Settings` 对象，包含 `maimemoToken`、`hotkey`、`selectedNotepadId` 等字段。

### save_settings

保存本地设置。

```typescript
await invoke('save_settings', { settings });
```

### check_vocabulary

查询单词是否在墨墨词库中，返回 `voc_id`。

```typescript
const result = await invoke('check_vocabulary', { spelling: 'hello', token: '...' });
// result.data.voc.id → voc_id
```

### lookup_dictionary

通过有道词典查询单词释义（免费，无需 API Key）。

```typescript
const result = await invoke('lookup_dictionary', { word: 'hello' });
// result.data.definitions → string[]
// result.data.phonetic → 美式音标
// result.data.uk_phonetic → 英式音标
// result.data.examples → { sentence, translation }[]
// result.data.word_forms → { form, value }[]
```

### register_hotkey

注册系统级全局快捷键。

```typescript
await invoke('register_hotkey', { hotkey: 'Ctrl+Shift+A' });
```

### unregister_all_hotkeys

注销所有已注册的全局快捷键。

```typescript
await invoke('unregister_all_hotkeys');
```

### show_popup_window

创建独立弹窗窗口显示单词释义，以鼠标位置为中心显示。

```typescript
await invoke('show_popup_window', {
  x: 600, y: 400,
  word: 'hello',
  definitions: ['int. 你好', 'n. 问候'],
  examples: ['Hello, how are you?'],
  phonetic: 'həˈloʊ',
  ukPhonetic: 'həˈləʊ',
  vocId: 'voc_id...',
  token: '...'
});
```

窗口特性：无边框、置顶、不显示在任务栏、不可调整大小。

### close_popup_window

关闭弹窗窗口。

```typescript
await invoke('close_popup_window');
```

### get_notepads

获取用户所有云词本（自动分页遍历）。

```typescript
const result = await invoke('get_notepads', { token: '...' });
// result.data.notepads → { id, title, brief, tags, ... }[]
```

### get_notepad_detail

获取词本详情（含 content 和 list）。

```typescript
const result = await invoke('get_notepad_detail', { notepadId: '...', token: '...' });
// result.data.notepad.content → 原始内容
// result.data.notepad.list → 结构化列表
```

### create_notepad

创建新词本。

```typescript
const result = await invoke('create_notepad', {
  title: '新词本',
  brief: '描述',
  tags: ['考研'],
  content: ' ',
  token: '...'
});
```

### update_notepad

更新词本（需提供完整内容）。

```typescript
await invoke('update_notepad', {
  notepadId: '...',
  title: '名称',
  brief: '描述',
  tags: ['考研'],
  content: 'hello\nworld',
  token: '...'
});
```

### delete_notepad

删除词本。

```typescript
await invoke('delete_notepad', { notepadId: '...', token: '...' });
```

### add_words_to_notepad

向词本添加单词（自动去重）。

```typescript
const result = await invoke('add_words_to_notepad', {
  notepadId: '...',
  vocIds: ['voc_id_1', 'voc_id_2'],
  token: '...'
});
// result.data.added_count → 实际添加数量
```

### add_words_to_study

将单词加入学习列表。

```typescript
await invoke('add_words_to_study', {
  vocIds: ['voc_id_1'],
  advance: false,
  token: '...'
});
```

### get_word_details

批量获取单词详情（释义、助记、例句）。

```typescript
const result = await invoke('get_word_details', {
  spellings: ['hello', 'world'],
  token: '...'
});
// result.data.words → [{ spelling, voc_id, interpretations, notes, phrases }]
```

### get_cursor_position

获取鼠标光标屏幕坐标（仅 Windows）。

```typescript
const pos = await invoke('get_cursor_position');
// pos.x, pos.y
```

---

## 参考链接

- [墨墨背单词开放 API 官方文档](https://open.maimemo.com/document)
- [maimemo-sdk（非官方 SDK）](https://github.com/fuhan666/maimemo-sdk)
