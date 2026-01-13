# 天机 · 星盘 (Tianji Astrology)

天机 · 星盘是一套命理排盘与分析工具，主项目为 Web 版（Vite + React），小程序版在 `tianji-mp/`。

## 功能概览
- 多档案管理（姓名、性别、出生日期与时间、地点）
- 八字命盘与四柱展示
- 五行能量与强弱分析
- 运程（日运 + 大运流年）
- 神煞详解
- AI 命书报告与 AI 合盘报告
- 天问：AI 对话与推荐问题

## 项目结构
- `./`：Web 端（React + Vite）
- `tianji-mp/`：微信小程序（uni-app，详见 `tianji-mp/README.md`）

## Web 端开发

### 环境要求
- Node.js 18+

### 环境变量
在根目录创建或修改 `.env.local`：

```env
VITE_OPENAI_API_KEY=sk-xxx
VITE_OPENAI_BASE_URL=https://api.openai.com/v1
VITE_OPENAI_MODEL=gpt-4o
# 可选：请求超时（毫秒）
VITE_OPENAI_TIMEOUT_MS=120000
```

### 安装与启动

```bash
npm install
npm run dev
```

本地访问：`http://localhost:5173`

### 构建

```bash
npm run build
npm run preview
```

## 小程序
小程序工程在 `tianji-mp/`，使用方式请参考 `tianji-mp/README.md`。
