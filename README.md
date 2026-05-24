# Sentinel Watch — AI × 链上反作弊透明层

> Mantle 图灵测试黑客松 2026 · Agentic Economy Track  
> 「让反作弊从黑箱走向透明」

---

## 🎯 一句话叙事

**AI Agent 分析游戏证据 → 链上哈希存证 → 社区公开投票**  
不是替代 Vanguard，而是建立一个去中心化的反作弊透明层。

---

## 🧱 技术架构

```
┌─────────────────────────────────────────────────┐
│                    前端 (HTML/CSS/JS)              │
│  index.html  report.html  case.html              │
│  零框架 · Valorant 暗黑主题 · 响应式              │
├─────────────────────────────────────────────────┤
│              API 层 (Node.js / Vercel)             │
│  GET /api/cases · GET /api/cases/:id             │
│  POST /api/analyze (模拟 AI 分析)                 │
├─────────────────────────────────────────────────┤
│              链上 (Mantle Network)                │
│  CaseReport.sol — 哈希存证 · 投票 · 结案          │
└─────────────────────────────────────────────────┘
```

---

## 📁 项目结构

```
sentinel-watch/
├── index.html              # 首页 — 产品介绍 + 案例列表
├── report.html             # 举报页 — 三步提交向导
├── case.html               # 详情页 — AI报告 + 投票
├── css/
│   └── style.css           # 全局样式（Valorant 主题）
├── js/
│   └── main.js             # 前端交互逻辑
├── contracts/
│   └── CaseReport.sol      # Solidity 智能合约
├── data/
│   └── demo-cases.json     # Demo 预置案例
├── api/
│   └── index.js            # Vercel Serverless API
├── server.js               # 本地开发服务器
└── README.md
```

---

## 🚀 本地运行

### 前置要求

- **Node.js** ≥ 18（仅内置模块，零 npm install）

### 启动

```bash
cd sentinel-watch
node server.js
```

浏览器访问 `http://localhost:3007`

### 页面

| 页面 | URL | 说明 |
|------|-----|------|
| 首页 | `/` | 产品 Landing + 案例列表 |
| 举报 | `/report` | 三步提交流程 |
| 详情 | `/case?id=case-001` | AI 报告 + 投票 |

---

## ⛓️ 智能合约

### 合约地址（部署后填写）

| 网络 | 地址 |
|------|------|
| Mantle Testnet | `0x...` |

### 核心函数

| 函数 | 说明 |
|------|------|
| `reportCase(id, hash)` | 提交案例，存证哈希上链 |
| `vote(caseId, choice)` | 投票（1=作弊 2=清白 3=不确定） |
| `resolveCase(caseId)` | 结案判定（≥66% 即定论） |
| `getCase(caseId)` | 查询案例详情 |

### 部署（Hardhat / Remix）

```bash
# 使用 Remix IDE 或 Hardhat
npx hardhat run scripts/deploy.js --network mantleTestnet
```

---

## 🌐 Vercel 部署

1. 将项目推送到 GitHub
2. 在 Vercel 中导入项目
3. 设置框架为 **Other**，根目录为 `sentinel-watch/`
4. 部署完成 — API 路由在 `api/index.js`，静态文件自动托管

---

## 🎬 Demo 演示脚本

### 场景 1：查看案例
1. 打开首页 → 看到 3 个预置案例
2. 点击「天梯超凡段位疑似透视举报」
3. 看到 AI 置信度 72%、三处可疑标注
4. 社区投票：64% 作弊 / 22% 清白 / 14% 不确定

### 场景 2：提交举报
1. 进入举报页 → 填写标题 + 描述（包含"锁头"等关键词）
2. 上传 2-3 张截图
3. AI 分析 → 置信度 65%，显示疑点时间轴
4. 连接钱包 → 提交上链 → 显示交易哈希

### 场景 3：社区投票
1. 在案例详情页选择「作弊」
2. 确认投票 → 作弊票数 +1
3. 实时看到进度条更新

---

## 🏆 赛道匹配

| 要求 | 满足 |
|------|------|
| 使用 RealClaw / Byreal 能力 | ✅ AI Agent 驱动证据分析流程 |
| 部署 Mantle / Solana | ✅ Mantle 测试网 |
| 开源仓库 + Demo + Pitch | ✅ GitHub + 本地可运行 + README |
| 日常决策场景 | ✅ 游戏反作弊——Z 世代高频场景 |

### 靶向奖项
- **20 Project Deployment Award** — 合约+前端+视频，完整交付
- **Community Voting** — 无畏契约 2000 万+ 玩家社区，天然传播
- **Best UI/UX** — Valorant 主题 UI，视觉冲击力

---

## 🔒 安全

- XSS：用户输入 `escHTML()` 转义
- 安全头：`X-Content-Type-Options` / `X-Frame-Options` / `Referrer-Policy`
- 目录遍历防护：路径验证
- 合约防重入：`hasVoted` 映射防重复投票

---

## 📜 License

MIT — 但请保留 Sentinel Watch 署名。

---

*Built with ❤️ for the Valorant Community · Mantle Turing Test Hackathon 2026*
