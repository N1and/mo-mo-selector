# 墨墨单词助手 - API 文档

本文档描述墨墨单词助手使用的外部 API 接口。

## 目录

- [墨墨背单词 API](#墨墨背单词-api)
  - [认证](#认证)
  - [基础信息](#基础信息)
  - [词汇接口](#词汇接口)
  - [词本接口](#词本接口)
  - [错误处理](#错误处理)
- [Tauri 命令接口](#tauri-命令接口)

---

## 墨墨背单词 API

### 认证

所有请求需要在 Header 中携带 Bearer Token：

```
Authorization: Bearer {your_token}
```

Token 获取方式：墨墨背单词 App → 我的 → 更多设置 → 实验功能 → 开放 API

### 基础信息

| 项目 | 值 |
|------|-----|
| Base URL | `https://open.maimemo.com/open/api/v1` |
| 认证方式 | Bearer Token |
| 请求格式 | JSON |
| 响应格式 | JSON |

### 请求频率限制

| 时间窗口 | 最大请求数 |
|----------|------------|
| 10 秒 | 20 次 |
| 60 秒 | 40 次 |
| 5 小时 | 2000 次 |

---

### 词汇接口

#### 查询单词

获取单词的 `voc_id`，后续操作需要使用此 ID。

**请求**

```
GET /vocabulary?spelling={word}
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| spelling | string | 是 | 单词拼写 |

**响应示例**

```json
{
  "code": 0,
  "data": {
    "id": "voc_xxxxx",
    "spelling": "hello",
    "pronunciation": "/həˈloʊ/",
    "definitions": [
      {
        "type": "n.",
        "meaning": "问候；招呼"
      }
    ]
  }
}
```

**错误响应**

```json
{
  "code": 404,
  "message": "Word not found"
}
```

---

#### 批量查询单词

**请求**

```
POST /vocabulary/query
```

**请求体**

```json
{
  "spellings": ["hello", "world", "test"]
}
```

**参数说明**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| spellings | string[] | 是 | 单词列表，最多 1000 个 |

**响应示例**

```json
{
  "code": 0,
  "data": [
    {
      "id": "voc_xxxxx",
      "spelling": "hello"
    },
    {
      "id": "voc_yyyyy",
      "spelling": "world"
    }
  ]
}
```

---

#### 获取单词详情

**请求**

```
GET /vocabulary/{id}
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 单词的 voc_id |

**响应示例**

```json
{
  "code": 0,
  "data": {
    "id": "voc_xxxxx",
    "spelling": "hello",
    "pronunciation": "/həˈloʊ/",
    "definitions": [
      {
        "type": "n.",
        "meaning": "问候；招呼"
      },
      {
        "type": "v.",
        "meaning": "打招呼"
      }
    ],
    "tags": ["基础词汇", "日常用语"]
  }
}
```

---

### 词本接口

#### 获取词本列表

**请求**

```
GET /notepads
```

**响应示例**

```json
{
  "code": 0,
  "data": [
    {
      "id": "notepad_xxxxx",
      "title": "我的词本",
      "brief": "日常积累的单词",
      "tags": ["日常", "高频"],
      "wordCount": 128,
      "createdAt": "2026-01-15T10:30:00Z",
      "updatedAt": "2026-06-20T14:20:00Z"
    }
  ]
}
```

---

#### 创建词本

**请求**

```
POST /notepads
```

**请求体**

```json
{
  "title": "新词本",
  "brief": "词本描述",
  "tags": ["标签1", "标签2"]
}
```

**参数说明**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 词本名称 |
| brief | string | 否 | 词本描述 |
| tags | string[] | 否 | 标签列表 |

**响应示例**

```json
{
  "code": 0,
  "data": {
    "id": "notepad_yyyyy",
    "title": "新词本",
    "brief": "词本描述",
    "tags": ["标签1", "标签2"],
    "wordCount": 0,
    "createdAt": "2026-06-22T10:30:00Z",
    "updatedAt": "2026-06-22T10:30:00Z"
  }
}
```

---

#### 更新词本

**请求**

```
POST /notepads/{id}
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 词本 ID |

**请求体**

```json
{
  "title": "更新后的名称",
  "brief": "更新后的描述"
}
```

**响应示例**

```json
{
  "code": 0,
  "data": {
    "id": "notepad_xxxxx",
    "title": "更新后的名称",
    "brief": "更新后的描述",
    "updatedAt": "2026-06-22T11:00:00Z"
  }
}
```

---

#### 删除词本

**请求**

```
DELETE /notepads/{id}
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 词本 ID |

**响应示例**

```json
{
  "code": 0,
  "message": "Notepad deleted successfully"
}
```

---

#### 向词本添加单词

**请求**

```
POST /notepads/{id}/words
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 词本 ID |

**请求体**

```json
{
  "voc_ids": ["voc_xxxxx", "voc_yyyyy"]
}
```

**参数说明**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| voc_ids | string[] | 是 | 单词 ID 列表 |

**响应示例**

```json
{
  "code": 0,
  "message": "Words added successfully",
  "data": {
    "addedCount": 2,
    "duplicateCount": 0
  }
}
```

---

#### 从词本移除单词

**请求**

```
DELETE /notepads/{id}/words
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 词本 ID |

**请求体**

```json
{
  "voc_ids": ["voc_xxxxx"]
}
```

**响应示例**

```json
{
  "code": 0,
  "message": "Words removed successfully"
}
```

---

### 错误处理

#### 错误响应格式

```json
{
  "code": 400,
  "message": "Error description"
}
```

#### 常见错误码

| 错误码 | 说明 | 处理建议 |
|--------|------|----------|
| 0 | 成功 | - |
| 400 | 请求参数错误 | 检查请求参数 |
| 401 | 认证失败 | 检查 Token 是否正确 |
| 404 | 资源不存在 | 检查 ID 是否正确 |
| 429 | 请求频率超限 | 等待后重试 |
| 500 | 服务器错误 | 稍后重试 |

---

## Tauri 命令接口

以下是本应用定义的 Tauri 命令，用于前端调用 Rust 后端。

### get_clipboard_text

获取系统剪贴板中的文本内容。

**调用方式**

```typescript
import { invoke } from '@tauri-apps/api/core';

const text = await invoke<string>('get_clipboard_text');
```

**返回值**

- `string` - 剪贴板文本内容

---

### check_vocabulary

检查单词是否在墨墨词库中。

**调用方式**

```typescript
const result = await invoke('check_vocabulary', { 
  spelling: 'hello', 
  token: 'your_maimemo_token' 
});
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| spelling | string | 是 | 单词拼写 |
| token | string | 是 | 墨墨 API Token |

**返回值**

- `object` - 单词信息，包含 `id`、`spelling` 等字段

---

### get_notepads

获取用户的所有云词本。

**调用方式**

```typescript
const result = await invoke('get_notepads', { 
  token: 'your_maimemo_token' 
});
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| token | string | 是 | 墨墨 API Token |

**返回值**

- `object[]` - 词本列表

---

## 使用示例

### 完整的单词添加流程

```typescript
import { invoke } from '@tauri-apps/api/core';

async function addWordToNotepad(word: string, notepadId: string, token: string) {
  // 1. 检查单词是否在词库中
  const vocabulary = await invoke('check_vocabulary', { spelling: word, token });
  
  if (!vocabulary?.data?.id) {
    throw new Error('单词不在词库中');
  }
  
  // 2. 获取词本列表（验证词本存在）
  const notepads = await invoke('get_notepads', { token });
  const notepad = notepads?.data?.find(n => n.id === notepadId);
  
  if (!notepad) {
    throw new Error('词本不存在');
  }
  
  // 3. 添加单词到词本（需要直接调用墨墨 API）
  const response = await fetch(`https://open.maimemo.com/open/api/v1/notepads/${notepadId}/words`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      voc_ids: [vocabulary.data.id]
    })
  });
  
  return response.json();
}
```

---

## 参考链接

- [墨墨背单词开放 API 官方文档](https://open.maimemo.com/document)
- [maimemo-sdk（非官方 SDK）](https://github.com/fuhan666/maimemo-sdk)
