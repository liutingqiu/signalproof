/* ============================================================
   Vercel Serverless API — Sentinel Watch
   部署路径: api/index.js
   处理 /api/cases 和 /api/analyze 端点
   ============================================================ */

// 内嵌 Demo 数据（Vercel 构建时内联，无需文件系统）
const DEMO_CASES = [
  {
    id: 'case-001',
    title: '天梯超凡段位疑似透视举报',
    reporter: '玩家@SharpEye',
    map: '亚海悬城 (Ascent)',
    timestamp: '2026-06-01T14:30:00Z',
    status: 'voting',
    screenshots: 3,
    aiConfidence: 72,
    aiSummary: 'AI 检测到 3 处可疑行为：隔墙预瞄频率异常（2次/分钟）、反应时间低于人类阈值（平均 48ms）、搜点路径与常规差异显著。建议社区复审。',
    analysisEvents: [
      { time: '03:22', type: 'suspicious', desc: 'A 小通道隔墙预瞄敌方位置，准星持续跟踪墙体后目标移动轨迹，持续 2.4 秒' },
      { time: '05:47', type: 'suspicious', desc: 'B 点烟幕内连续击杀 3 人，无视野情况下反应时间仅 52ms，远超人类极限（~200ms）' },
      { time: '07:15', type: 'normal', desc: '中路正常搜点，路径符合常规战术习惯' },
      { time: '09:33', type: 'suspicious', desc: '防守方回防路径异常，绕开已知有人区域，疑似提前获取敌方分布信息' },
      { time: '11:50', type: 'normal', desc: '残局 1v2 正常处理，无异常行为标记' }
    ],
    voteCheat: 64,
    voteClean: 22,
    voteUncertain: 14,
    txHash: '0x7f3a8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a'
  },
  {
    id: 'case-002',
    title: '钻石局怀疑 aimbot 锁头举报',
    reporter: '玩家@NightOwl',
    map: '源工重镇 (Bind)',
    timestamp: '2026-06-02T09:15:00Z',
    status: 'resolved',
    screenshots: 2,
    aiConfidence: 15,
    aiSummary: 'AI 检测未发现明显异常。准星移动轨迹与人类操作特征吻合，爆头率虽高（38%）但击杀节奏、搜点习惯与高分段玩家一致。建议标记为正常。',
    analysisEvents: [
      { time: '02:10', type: 'normal', desc: 'A 点防守定位正常，准星摆动幅度附合人类操作特征' },
      { time: '06:30', type: 'normal', desc: 'B 点瞬爆头击杀，但击杀帧前后准星微调轨迹自然，非机械锁定' },
      { time: '08:55', type: 'normal', desc: '残局处理冷静，搜点节奏与经验老手一致' }
    ],
    voteCheat: 8,
    voteClean: 85,
    voteUncertain: 7,
    txHash: '0x2a1e3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a'
  },
  {
    id: 'case-003',
    title: 'VCT 次级联赛可疑回放分析',
    reporter: '社区分析师@TacticalEye',
    map: '隐世修所 (Haven)',
    timestamp: '2026-06-03T18:45:00Z',
    status: 'voting',
    screenshots: 4,
    aiConfidence: 58,
    aiSummary: 'AI 在分析 4 张截图后发现 1 处高度可疑 + 2 处疑似行为。关键帧显示选手在无信息情况下做出精准判断。建议社区深入讨论。',
    analysisEvents: [
      { time: '01:45', type: 'normal', desc: '开局常规布防走位正常' },
      { time: '04:22', type: 'suspicious', desc: 'C 点单摸路线刻意避开敌方所有常规站位，巧合概率低于 5%' },
      { time: '07:08', type: 'suspicious', desc: 'C 点长道连杀 2 人，准星转移速度超常，但未达到明显锁头阈值' },
      { time: '10:12', type: 'normal', desc: '下半场手枪局正常处理' }
    ],
    voteCheat: 41,
    voteClean: 35,
    voteUncertain: 24,
    txHash: '0x9d4f5e6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e'
  }
];

// ── XSS 过滤 ──────────────────────────────────────────────
function esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── 模拟 AI 分析 ──────────────────────────────────────────
function mockAnalysis(screenshotsCount, description) {
  const keywords = ['锁头', 'aimbot', '隔墙', '透视', '透', '挂', '自动瞄准', '锁', '穿烟', '穿墙', '瞬移'];
  const suspiciousCount = keywords.filter(kw => description.includes(kw)).length;
  const confidence = Math.min(95, Math.max(5, suspiciousCount * 20 + Math.floor(Math.random() * 20)));

  const events = [];
  if (confidence > 60) {
    events.push({ time: '03:22', type: 'suspicious', desc: '准星移动轨迹出现非人类加速度特征，疑似辅助瞄准介入' });
    events.push({ time: '06:15', type: 'suspicious', desc: '无视野预判敌方位置，预瞄点精确锁定墙体后目标' });
    events.push({ time: '08:40', type: 'normal', desc: '此段时间操作正常，无异常标记' });
  } else if (confidence > 30) {
    events.push({ time: '04:10', type: 'suspicious', desc: '偶发异常准星行为，但样本不足无法确认' });
    events.push({ time: '07:55', type: 'normal', desc: '大部分时间操作与常规玩家一致' });
  } else {
    events.push({ time: '02:30', type: 'normal', desc: '全局操作未见异常，准星轨迹和反应时间均在正常范围内' });
    events.push({ time: '05:45', type: 'normal', desc: '走位、搜点、预瞄习惯与同分段玩家吻合' });
  }

  return {
    confidence,
    summary: confidence > 60
      ? `AI 检测到 ${events.filter(e => e.type === 'suspicious').length} 处可疑行为，综合置信度 ${confidence}%。建议社区复审。`
      : confidence > 30
        ? `AI 发现少量可疑标记，综合置信度 ${confidence}%。行为在灰色地带，需人工判断。`
        : `AI 未检测到明显异常，综合置信度 ${confidence}%。操作模式与正常玩家一致。`,
    events,
  };
}

// ── Vercel Handler ────────────────────────────────────────

module.exports = async (req, res) => {
  // 安全头
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  const method = req.method;

  // CORS（可选）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET /api/cases
  if (pathname === '/api/cases' && method === 'GET') {
    return res.status(200).json(DEMO_CASES);
  }

  // GET /api/cases/:id
  if (pathname.startsWith('/api/cases/') && method === 'GET') {
    const id = pathname.split('/api/cases/')[1];
    const c = DEMO_CASES.find(x => x.id === id);
    if (c) return res.status(200).json(c);
    return res.status(404).json({ error: '案例未找到' });
  }

  // POST /api/analyze
  if (pathname === '/api/analyze' && method === 'POST') {
    try {
      const { screenshotsCount, description } = req.body || {};
      const result = mockAnalysis(screenshotsCount || 1, esc(description || ''));
      return res.status(200).json(result);
    } catch {
      return res.status(400).json({ error: '请求格式错误' });
    }
  }

  // 404
  return res.status(404).json({ error: 'Not Found' });
};
