/* ============================================================
   Sentinel Watch — 本地开发服务器
   零依赖 Node.js 原生 http 模块
   ============================================================ */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3007;
const ROOT = __dirname;

// ── MIME 类型映射 ──────────────────────────────────────────

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

// ── 工具函数 ──────────────────────────────────────────────

function esc(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const ct = MIME[ext] || 'application/octet-stream';

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': ct,
      'Content-Length': Buffer.byteLength(data),
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    });
    res.end(data);
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
}

// ── API: Demo 案例数据 ─────────────────────────────────────

function getDemoCases() {
  return [
    {
      id: 'case-demo',
      title: '【新提交】KOL @CryptoWhale 声称 90% BTC 胜率验证',
      reporter: '你',
      map: 'Binance 币安',
      timestamp: new Date().toISOString(),
      status: 'voting',
      screenshots: 3,
      aiConfidence: 72,
      aiSummary: 'AI 对比链上数据后发现：该 KOL 近 30 天 45 条信号中，实际盈利仅 19 条（42%），与声称的 90% 严重不符。典型幸存者偏差——只晒盈利单。建议社区复审。',
      analysisEvents: [
        { time: '信号 #12', type: 'suspicious', desc: 'BTC 做多信号发出后 4 小时暴跌 3.2%，但 KOL 后续未提及此单' },
        { time: '信号 #23', type: 'suspicious', desc: '止盈设置在极端点位（距离市价 8%），实际从未触及，统计时却被计为"盈利"' },
        { time: '信号 #31', type: 'normal', desc: 'ETH 做空信号准确，入场和止盈点位合理' },
        { time: '信号 #38', type: 'suspicious', desc: '信号发出时间与实际链上交易时间不匹配——KOL 可能是跟单而非预测' },
        { time: '信号 #44', type: 'normal', desc: 'BNB 波段信号准确，但此类简单信号仅占总数 11%' },
      ],
      voteCheat: 0,
      voteClean: 0,
      voteUncertain: 0,
      txHash: '0x' + Array.from({length:40},()=>'0123456789abcdef'[Math.floor(Math.random()*16)]).join(''),
    },
    {
      id: 'case-001',
      title: 'KOL @CryptoWhale 声称 90% BTC 胜率 — 实际仅 42%',
      reporter: '链上侦探@OnchainEye',
      map: 'Binance 币安',
      timestamp: '2026-06-01T14:30:00Z',
      status: 'voting',
      screenshots: 3,
      aiConfidence: 72,
      aiSummary: 'AI 对比链上数据后发现：该 KOL 近 30 天 45 条信号中，实际盈利仅 19 条（42%），与声称的 90% 严重不符。典型幸存者偏差——只晒盈利单。建议社区复审。',
      analysisEvents: [
        { time: '信号 #12', type: 'suspicious', desc: 'BTC 做多信号发出后 4 小时暴跌 3.2%，但 KOL 后续未提及此单' },
        { time: '信号 #23', type: 'suspicious', desc: '止盈设置在极端点位（距离市价 8%），实际从未触及，统计时却被计为"盈利"' },
        { time: '信号 #31', type: 'normal', desc: 'ETH 做空信号准确，入场和止盈点位合理' },
        { time: '信号 #38', type: 'suspicious', desc: '信号发出时间与实际链上交易时间不匹配——KOL 可能是跟单而非预测' },
        { time: '信号 #44', type: 'normal', desc: 'BNB 波段信号准确，但此类简单信号仅占总数 11%' },
      ],
      voteCheat: 64,
      voteClean: 22,
      voteUncertain: 14,
      txHash: '0x7f3a...9b2c',
    },
    {
      id: 'case-002',
      title: 'AI 交易机器人 @AlphaBot 实盘验证 — 准确率 78% 达标',
      reporter: '量化研究员@QuantLeo',
      map: 'OKX',
      timestamp: '2026-06-02T09:15:00Z',
      status: 'resolved',
      screenshots: 2,
      aiConfidence: 15,
      aiSummary: 'AI 验证 @AlphaBot 近 60 天链上交易记录：83 笔交易中 65 笔盈利，实际胜率 78.3%，与声称的 80% 基本一致。盈亏比 2.1:1，最大回撤 12%。建议标记为可信。',
      analysisEvents: [
        { time: '第 1-20 笔', type: 'normal', desc: 'ETH/BTC 趋势跟随策略运行正常，胜率 75%，符合策略预期' },
        { time: '第 35-42 笔', type: 'normal', desc: '市场剧烈波动期间最大回撤仅 8%，风控参数设置合理' },
        { time: '第 65-83 笔', type: 'normal', desc: '近期交易频率降低但质量提升，胜率上升至 82%' },
      ],
      voteCheat: 8,
      voteClean: 85,
      voteUncertain: 7,
      txHash: '0x2a1e...c4d8',
    },
    {
      id: 'case-003',
      title: 'Twitter KOL @GemHunter 山寨币喊单分析 — 疑似拉高出货',
      reporter: '社区成员@DefiSleuth',
      map: 'Hyperliquid',
      timestamp: '2026-06-03T18:45:00Z',
      status: 'voting',
      screenshots: 4,
      aiConfidence: 58,
      aiSummary: 'AI 分析该 KOL 近 3 个月喊单记录：16 次喊单中 10 次在 24 小时内暴跌超 30%。链上数据显示其关联钱包在喊单前 2 小时内建仓、喊单后 6 小时内出货的模式。建议社区深入讨论。',
      analysisEvents: [
        { time: '喊单 #3', type: 'normal', desc: '中等市值代币，喊单后价格温和上涨，无异常' },
        { time: '喊单 #7', type: 'suspicious', desc: '小市值代币（MCap < $1M），喊单后 1h 涨 400%+，随后 24h 跌 85%，典型 pump & dump' },
        { time: '喊单 #11', type: 'suspicious', desc: '关联钱包 0x3f2a 在喊单前 1.5h 买入 $25K，6h 后卖出 $78K，时间高度吻合' },
        { time: '喊单 #15', type: 'normal', desc: 'BTC 相关分析无明显异常' },
      ],
      voteCheat: 41,
      voteClean: 35,
      voteUncertain: 24,
      txHash: '0x9d4f...e6a1',
    },
  ];
}

// ── API: 模拟 AI 分析 ──────────────────────────────────────

function mockAnalysis(screenshotsCount, description) {
  // 简单规则模拟 AI 分析
  const keywords = ['胜率', '拉高出货', 'pump', 'dump', '喊单', '虚假', '亏损', '爆仓', '幸存者偏差', '拉盘', '出货', '跟单'];
  const suspiciousCount = keywords.filter(kw => description.includes(kw)).length;

  const confidence = Math.min(95, Math.max(5, suspiciousCount * 20 + Math.floor(Math.random() * 20)));
  const events = [];

  if (confidence > 60) {
    events.push({
      time: '信号 #8',
      type: 'suspicious',
      desc: '链上数据显示该信号发出后价格反向波动 3%+，但此单未被计入 KOL 的"战绩展示"',
    });
    events.push({
      time: '信号 #15',
      type: 'suspicious',
      desc: '止盈止损设置明显不合理，疑似刻意美化统计结果',
    });
    events.push({
      time: '信号 #22',
      type: 'normal',
      desc: '该信号准确，入场和出场点位在链上可验证',
    });
  } else if (confidence > 30) {
    events.push({
      time: '信号 #5',
      type: 'suspicious',
      desc: '信号发出时间与链上交易存在时间差——KOL 可能先建仓再喊单',
    });
    events.push({
      time: '信号 #18',
      type: 'normal',
      desc: '大部分信号与常规交易逻辑一致，但少数存在疑点',
    });
  } else {
    events.push({
      time: '信号 #1-45',
      type: 'normal',
      desc: '信号发出时间与链上记录吻合，胜率和盈亏比与声称一致',
    });
    events.push({
      time: '链上总览',
      type: 'normal',
      desc: '关联钱包交易记录透明，无 hidden position 或 wash trading 迹象',
    });
  }

  return {
    confidence,
    summary: confidence > 60
      ? `AI 发现 ${events.filter(e => e.type === 'suspicious').length} 处信号不实标记，综合置信度 ${confidence}%。建议社区复审。`
      : confidence > 30
        ? `AI 发现少量疑点，综合置信度 ${confidence}%。信号质量存疑，需人工判断。`
        : `AI 验证通过，综合置信度 ${confidence}%。信号与链上记录吻合，建议标记为可信。`,
    events,
  };
}

// ── 路由处理 ───────────────────────────────────────────────

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const { pathname } = url;
  const method = req.method;

  // 安全头（所有响应）
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // ── API 路由 ──────────────────────────────────────────

  // GET /api/cases — 获取所有案例
  if (pathname === '/api/cases' && method === 'GET') {
    const cases = getDemoCases();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify(cases));
  }

  // GET /api/cases/:id — 获取单个案例
  if (pathname.startsWith('/api/cases/') && method === 'GET') {
    const id = pathname.split('/api/cases/')[1];
    const cases = getDemoCases();
    const c = cases.find(x => x.id === id);
    if (c) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify(c));
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: '案例未找到' }));
  }

  // POST /api/analyze — 模拟 AI 分析
  if (pathname === '/api/analyze' && method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { screenshotsCount, description } = JSON.parse(body);
        const result = mockAnalysis(screenshotsCount || 1, esc(description || ''));
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify(result));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: '请求格式错误' }));
      }
    });
    return;
  }

  // ── 静态文件路由 ──────────────────────────────────────

  // 默认首页
  if (pathname === '/' || pathname === '') {
    return serveFile(res, path.join(ROOT, 'index.html'));
  }

  // 无后缀 → 尝试 .html
  if (!path.extname(pathname)) {
    const htmlPath = path.join(ROOT, pathname + '.html');
    if (fs.existsSync(htmlPath)) {
      return serveFile(res, htmlPath);
    }
    const exactPath = path.join(ROOT, pathname);
    if (fs.existsSync(exactPath) && fs.statSync(exactPath).isFile()) {
      return serveFile(res, exactPath);
    }
  }

  // 常规静态文件
  const filePath = path.join(ROOT, pathname);
  // 目录遍历防护
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }
  serveFile(res, filePath);
});

server.listen(PORT, () => {
  console.log(`🔍 SignalProof 开发服务器已启动 → http://localhost:${PORT}`);
});
