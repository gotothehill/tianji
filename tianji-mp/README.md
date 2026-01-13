# 天机 · 星盘 Lite 小程序

基于 uni-app 的微信小程序版本，功能与主项目保持一致并持续对齐。

## 功能概览
- 命盘排盘、四柱与神煞展示
- 运程：今日黄历 + AI 每日指南
- 命书：AI 深度命理解读报告
- 合盘：双人合盘分析与 AI 合盘报告
- 天问：AI 问答（支持上下文与推荐问题）

## 开发环境
- Node.js 18+
- 微信开发者工具

## 环境变量
在 `tianji-mp/.env.local` 中配置：

```env
VITE_OPENAI_API_KEY=sk-xxx
VITE_OPENAI_BASE_URL=https://api.openai.com/v1
VITE_OPENAI_MODEL=gpt-4o
# 可选：请求超时（毫秒）
VITE_OPENAI_TIMEOUT_MS=120000
```

## 本地开发

```bash
cd tianji-mp
npm install
npm run dev:mp-weixin
```

然后用微信开发者工具打开：
`tianji-mp/dist/dev/mp-weixin`

## 构建

```bash
cd tianji-mp
npm run build:mp-weixin
```

构建产物在：
`tianji-mp/dist/build/mp-weixin`

## 备注
- 首次启动会下载完整城市库（用于地点搜索）；若下载失败会回退到精简库。
- AI 报告生成时间较长时，请确保超时配置足够大。
