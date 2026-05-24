/* Vercel Serverless: GET /api/cases */

const DEMO_CASES = [
  {
    id: 'case-demo',
    title: '【新提交】KOL @CryptoWhale 声称 90% BTC 胜率验证',
    reporter: '你',
    map: 'Binance 币安',
    timestamp: new Date().toISOString(),
    status: 'voting', screenshots: 3, aiConfidence: 72,
    aiSummary: 'AI 对比链上数据后发现：该 KOL 近 30 天 45 条信号中，实际盈利仅 19 条（42%），与声称的 90% 严重不符。',
    analysisEvents: [
      { time: '信号 #12', type: 'suspicious', desc: 'BTC 做多信号发出后 4 小时暴跌 3.2%，但 KOL 后续未提及此单' },
      { time: '信号 #31', type: 'normal', desc: 'ETH 做空信号准确，入场和止盈点位合理' },
    ],
    voteCheat: 0, voteClean: 0, voteUncertain: 0,
    txHash: '0x' + Array.from({length:40},()=>'0123456789abcdef'[Math.floor(Math.random()*16)]).join(''),
  },
  {
    id: 'case-001',
    title: 'KOL @CryptoWhale 声称 90% BTC 胜率 — 实际仅 42%',
    reporter: '链上侦探@OnchainEye', map: 'Binance 币安',
    timestamp: '2026-06-01T14:30:00Z', status: 'voting', screenshots: 3, aiConfidence: 72,
    aiSummary: 'AI 对比链上数据后发现：该 KOL 近 30 天 45 条信号中，实际盈利仅 19 条（42%），与声称的 90% 严重不符。',
    analysisEvents: [
      { time: '信号 #12', type: 'suspicious', desc: 'BTC 做多信号发出后 4 小时暴跌 3.2%' },
      { time: '信号 #23', type: 'suspicious', desc: '止盈设置在极端点位，实际从未触及' },
      { time: '信号 #38', type: 'suspicious', desc: '信号时间与链上交易不匹配' },
    ],
    voteCheat: 64, voteClean: 22, voteUncertain: 14,
    txHash: '0x7f3a...9b2c',
  },
  {
    id: 'case-002',
    title: 'AI 交易机器人 @AlphaBot 实盘验证 — 准确率 78% 达标',
    reporter: '量化研究员@QuantLeo', map: 'OKX',
    timestamp: '2026-06-02T09:15:00Z', status: 'resolved', screenshots: 2, aiConfidence: 15,
    aiSummary: 'AI 验证 @AlphaBot 近 60 天链上交易记录：83 笔交易中 65 笔盈利，实际胜率 78.3%，与声称的 80% 基本一致。',
    analysisEvents: [
      { time: '第 1-20 笔', type: 'normal', desc: 'ETH/BTC 趋势跟随策略运行正常' },
      { time: '第 35-42 笔', type: 'normal', desc: '市场波动期间最大回撤仅 8%' },
    ],
    voteCheat: 8, voteClean: 85, voteUncertain: 7,
    txHash: '0x2a1e...c4d8',
  },
  {
    id: 'case-003',
    title: 'Twitter KOL @GemHunter 山寨币喊单分析 — 疑似拉高出货',
    reporter: '社区成员@DefiSleuth', map: 'Hyperliquid',
    timestamp: '2026-06-03T18:45:00Z', status: 'voting', screenshots: 4, aiConfidence: 58,
    aiSummary: 'AI 分析该 KOL 近 3 个月喊单：16 次中 10 次 24h 内暴跌 30%+。链上显示关联钱包提前建仓。',
    analysisEvents: [
      { time: '喊单 #7', type: 'suspicious', desc: '小市值代币，喊单后 1h 涨 400%+，24h 跌 85%' },
      { time: '喊单 #11', type: 'suspicious', desc: '关联钱包提前 1.5h 建仓，6h 后出货' },
    ],
    voteCheat: 41, voteClean: 35, voteUncertain: 24,
    txHash: '0x9d4f...e6a1',
  },
];

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Check for ?id=xxx query parameter (single case)
  const url = new URL(req.url, 'http://localhost');
  const id = url.searchParams.get('id');
  if (id) {
    const c = DEMO_CASES.find(x => x.id === id);
    if (c) return res.status(200).json(c);
    return res.status(404).json({ error: 'Not found' });
  }

  return res.status(200).json(DEMO_CASES);
};
