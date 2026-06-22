# 墨墨单词助手

一个使用 Tauri + React 开发的 Windows 桌面应用，支持英语单词划词，并添加到墨墨背单词云词本。

## 功能特性

- **划词监控** - 复制单词后自动识别并添加到词本
- **词本管理** - 查看、创建、切换云词本
- **单词验证** - 自动检查单词是否在墨墨词库中
- **剪贴板监控** - 后台监控剪贴板变化，自动处理英文单词

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19, TypeScript, Vite 7 |
| UI | Tailwind CSS 4 |
| 状态管理 | Zustand |
| 桌面框架 | Tauri 2.0 |
| 后端 | Rust |
| API | 墨墨背单词开放 API |

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
- **剪贴板监控** - 开启后自动监控复制的单词
- **快捷键** - 自定义快捷键

## 使用说明

### 划词监控

1. 点击「划词监控」标签页
2. 确保监控状态为「运行中」
3. 在任意网页或文档中复制英文单词
4. 应用自动识别并显示单词信息
5. 点击「添加到词本」完成添加

### 词本管理

1. 点击「词本管理」标签页
2. 查看已有的云词本列表
3. 点击词本卡片选择当前词本
4. 点击「新建词本」创建新词本

## 项目结构

```
mo-mo-selector/
├── src/                    # React 前端
│   ├── components/        # UI 组件
│   │   ├── Monitor.tsx    # 划词监控
│   │   ├── NotepadManager.tsx  # 词本管理
│   │   ├── Settings.tsx   # 设置
│   │   ├── HotkeyPicker.tsx    # 快捷键选择器
│   │   └── WordLookup.tsx      # 全局查词弹窗
│   ├── stores/            # 状态管理
│   │   ├── wordStore.ts
│   │   ├── notepadStore.ts
│   │   └── settingsStore.ts
│   ├── lib/               # 工具函数
│   │   └── tauri.ts       # Tauri 命令封装
│   ├── App.tsx
│   └── App.css
├── src-tauri/             # Rust 后端
│   └── src/
│       ├── lib.rs         # Tauri 命令定义
│       └── main.rs        # 入口
├── scripts/               # 脚本工具
│   └── generate-api-doc.cjs  # API 文档生成
├── docs/                  # 文档
│   ├── DESIGN.md          # 设计文档
│   ├── UI.md              # UI 设计规范
│   ├── API.md             # API 文档
│   ├── openapi.json       # OpenAPI 规范
│   ├── PROGRESS.md        # 实现进度
│   └── CHANGELOG.md       # 更新记录
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## 开发指南

### 常用命令

```bash
# 启动开发服务器
npm run tauri dev

# 构建前端
npm run build

# 检查 Rust 编译
cd src-tauri && cargo check

# 构建安装程序
npm run tauri build
```

### 添加新功能

1. 在 `src-tauri/src/lib.rs` 中添加 Rust 命令
2. 在 `src/lib/tauri.ts` 中添加 TypeScript 包装函数
3. 在 `src/components/` 中创建或修改 UI 组件
4. 在 `src/stores/` 中添加状态管理

## API 限制

墨墨背单词 API 有请求频率限制：

- 10 秒内最多 20 次
- 60 秒内最多 40 次
- 5 小时内最多 2000 次

## 文档

详细文档请参考 [docs/](docs/) 目录：

- [设计文档](docs/DESIGN.md) - 架构设计、技术选型
- [UI 设计规范](docs/UI.md) - 颜色、组件、布局规范
- [API 文档](docs/API.md) - 墨墨 API 接口说明
- [OpenAPI 规范](docs/openapi.json) - 机器可读的 API 定义
- [实现进度](docs/PROGRESS.md) - 开发进度、功能状态
- [更新记录](docs/CHANGELOG.md) - 版本变更历史

## API 文档导出

项目提供 OpenAPI 格式的 API 文档，支持多种导出方式：

```bash
# 验证 OpenAPI 文档格式
npm run api:validate

# 查看接口统计
npm run api:stats

# 导出为 YAML 格式
npm run api:yaml

# 启动本地预览服务器（端口 3001）
npm run api:serve
```

导出的文档可用于：
- Swagger UI 预览
- Postman 导入
- 代码生成工具
- API 测试工具

## License

MIT
