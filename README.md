# wechat-agent — 微信公众号 AI 智能助手

基于 DeepSeek AI 的微信公众号智能对话系统，支持实时消息流、任务调度和管理后台。

## 技术栈

| 端 | 技术 |
|---|------|
| 前端 | React 18 + Vite 5 + TypeScript 5 |
| 后端 | Express 4 + TypeScript 5 |
| 数据库 | SQLite (better-sqlite3) |
| 实时通信 | WebSocket (ws) |
| AI | DeepSeek API |
| 测试 | Vitest + Playwright |

## 项目结构

```
wechat-agent/
├── frontend/          # React 管理后台
│   └── src/
│       ├── components/   # QRCodeDisplay, ConversationHistory, TaskMonitor, AgentConfig
│       ├── hooks/        # useWebSocket, useErrorMonitor
│       └── services/     # API 封装
├── backend/           # Express 后端
│   └── src/
│       ├── services/     # wechat, deepseek, dispatcher, message-processor, task-manager
│       └── routes/       # /api/wechat (webhook), /api (REST)
└── e2e-tests/         # Playwright 端到端测试
```

## 功能

- **微信公众号对接** — QR 码登录、消息 Webhook
- **AI 智能回复** — DeepSeek 驱动的对话生成
- **任务调度** — 多 Agent 任务分发和监控
- **实时消息流** — WebSocket 推送对话和状态更新
- **管理后台** — 仪表盘、对话历史、任务监控、Agent 配置

## 快速开始

### 后端
```bash
cd backend
npm install
npm run dev
```

### 前端
```bash
cd frontend
npm install
npm run dev
```

### 测试
```bash
npm run test        # 单元测试
npx playwright test # E2E 测试
```

## 架构

```
微信用户 → 公众号 → Express Webhook → DeepSeek AI → 回复
                                    ↓
                              WebSocket → React 管理后台（实时展示）
```

## 环境变量

| 变量 | 说明 |
|------|------|
| WECHAT_TOKEN | 微信公众号 Token |
| WECHAT_APPID | 微信 AppID |
| WECHAT_SECRET | 微信 AppSecret |
| DEEPSEEK_API_KEY | DeepSeek API Key |
| PORT | 后端端口（默认 3000）|
