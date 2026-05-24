/* Vercel Serverless: POST /api/analyze */

function esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function mockAnalysis(screenshotsCount, description) {
  const keywords = ['胜率', '拉高出货', 'pump', 'dump', '喊单', '虚假', '亏损', '爆仓', '幸存者偏差', '拉盘', '出货', '跟单'];
  const suspiciousCount = keywords.filter(kw => description.includes(kw)).length;
  const confidence = Math.min(95, Math.max(5, suspiciousCount * 20 + Math.floor(Math.random() * 20)));
  const events = [];

  if (confidence > 60) {
    events.push({ time: '信号 #8', type: 'suspicious', desc: '链上数据显示该信号发出后价格反向波动 3%+，但此单未被计入 KOL 的"战绩展示"' });
    events.push({ time: '信号 #15', type: 'suspicious', desc: '止盈止损设置明显不合理，疑似刻意美化统计结果' });
    events.push({ time: '信号 #22', type: 'normal', desc: '该信号准确，入场和出场点位在链上可验证' });
  } else if (confidence > 30) {
    events.push({ time: '信号 #5', type: 'suspicious', desc: '信号发出时间与链上交易存在时间差——KOL 可能先建仓再喊单' });
    events.push({ time: '信号 #18', type: 'normal', desc: '大部分信号与常规交易逻辑一致，但少数存在疑点' });
  } else {
    events.push({ time: '信号 #1-45', type: 'normal', desc: '信号发出时间与链上记录吻合，胜率和盈亏比与声称一致' });
    events.push({ time: '链上总览', type: 'normal', desc: '关联钱包交易记录透明，无异常迹象' });
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

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { screenshotsCount, description } = req.body || {};
    const result = mockAnalysis(screenshotsCount || 1, esc(description || ''));
    return res.status(200).json(result);
  } catch {
    return res.status(400).json({ error: '请求格式错误' });
  }
};
