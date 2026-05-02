# 企业服务报价系统

基于 AI 的智能报价工具，支持根据客户行业和需求自动生成定制化报价方案。

## 技术栈

- **后端**: Express + sql.js (SQLite) + Claude API (Anthropic SDK)
- **前端**: uni-app (Vue 3 + Pinia) — 支持 H5 网页端和微信小程序
- **认证**: JWT + bcryptjs

## 核心功能

- 管理员认证（登录/JWT）
- 客户管理（CRUD + 搜索）
- AI 报价生成（5 种内置风格 + 自定义 prompt 模板）
- 灵活报价结构：多项启动费、动态月度服务、可选增值项
- 报价配置编辑（手动调整 AI 生成的配置）
- 报价发布和分享（H5 链接，客户可在微信中直接打开）
- 客户端交互式报价页（高管人数选择、服务开关、实时价格计算）
- 服务模板库管理、AI Prompt 风格管理

## 本地开发

### 前置条件

- Node.js >= 18
- Anthropic API Key

### 启动后端

```bash
cd backend
cp .env.example .env    # 填入你的 ANTHROPIC_API_KEY
npm install
npm run dev
```

后端运行在 `http://localhost:3000`，默认管理员账号：`admin / admin123`

### 启动前端

```bash
cd frontend
npm install
npm run dev:h5
```

前端运行在 `http://localhost:5173`，自动代理 `/api` 到后端。

### 微信小程序

```bash
npm run dev:mp-weixin
```

## 环境变量

### 后端 (backend/.env)

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `ANTHROPIC_API_KEY` | Claude API 密钥 | - |
| `JWT_SECRET` | JWT 签名密钥 | - |
| `ADMIN_INIT_PASSWORD` | 默认管理员密码 | admin123 |
| `DATABASE_PATH` | 数据库文件路径 | ./data/quotation.db |
| `PORT` | 服务端口 | 3000 |

### 前端

| 变量 | 说明 |
|------|------|
| `VITE_API_BASE_URL` | 后端 API 地址（生产环境） |

## 部署

### 后端 (Render)

项目包含 `render.yaml` 配置，可一键部署到 Render：

1. Fork 本仓库到 GitHub
2. 在 Render 创建 New Web Service，关联仓库 `backend` 目录
3. 设置环境变量：`ANTHROPIC_API_KEY`
4. Render 会自动构建和部署

### 前端 (GitHub Pages)

推送到 `main` 分支后，GitHub Actions 会自动构建并部署到 GitHub Pages。

## API 概览

| 路径 | 说明 |
|------|------|
| `POST /api/auth/login` | 管理员登录 |
| `GET/POST /api/clients` | 客户列表/创建 |
| `POST /api/quotations/generate` | AI 生成报价 |
| `POST /api/quotations/:id/publish` | 发布报价 |
| `GET /api/public/quotation/:id` | 客户查看报价（无需登录） |
| `GET/POST /api/templates` | 服务模板管理 |
| `GET/POST /api/prompts` | Prompt 风格管理 |

## 项目结构

```
quotation-system/
├── backend/
│   ├── src/
│   │   ├── routes/          # API 路由
│   │   ├── services/        # 业务逻辑（Claude 服务等）
│   │   ├── prompts/         # AI Prompt 模板
│   │   ├── database/        # 数据库初始化
│   │   └── config/          # 配置
│   └── render.yaml          # Render 部署配置
├── frontend/
│   ├── src/
│   │   ├── pages/           # 页面（admin 管理端 + h5 客户端）
│   │   ├── components/      # 报价相关组件
│   │   ├── store/           # Pinia 状态管理
│   │   └── api/             # API 请求封装
│   └── vite.config.ts
└── .github/workflows/       # GitHub Actions CI/CD
```
