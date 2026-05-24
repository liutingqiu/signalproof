/* ============================================================
   Sentinel Watch — 前端交互逻辑
   覆盖：首页案例列表、举报三步向导、案例详情页、投票
   ============================================================ */

(() => {
  'use strict';

  // ── DOM 快捷函数 ──────────────────────────────────────────
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => [...(c || document).querySelectorAll(s)];

  // ── Toast 提示 ───────────────────────────────────────────
  function toast(msg, type = 'info') {
    const el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.className = `toast toast-${type} show`;
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), 3000);
  }

  // ── API 调用 ─────────────────────────────────────────────
  async function api(url, opts = {}) {
    const hasBody = opts.body || opts.method === 'POST' || opts.method === 'PUT';
    const headers = hasBody ? { 'Content-Type': 'application/json' } : {};
    try {
      const res = await fetch(url, { headers, ...opts });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('API Error:', err);
      throw err;
    }
  }

  // ── 导航汉堡菜单 ──────────────────────────────────────────
  function initNav() {
    const toggle = $('.nav-toggle');
    const links = $('.nav-links');
    if (!toggle || !links) return;
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });
  }

  // ── 渐进显示 IntersectionObserver ─────────────────────────
  function initReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });

    $$('.reveal').forEach(el => observer.observe(el));
  }

  // ═══════════════════════════════════════════════════════════
  //  首页：案例列表渲染
  // ═══════════════════════════════════════════════════════════

  async function renderCaseList() {
    const container = $('#caseList');
    if (!container) return;

    try {
      const cases = await api('/api/cases');
      container.innerHTML = cases.map(c => `
        <a href="/case?id=${c.id}" class="case-item reveal" style="text-decoration:none;color:inherit;">
          <div class="case-thumb" aria-hidden="true">
            ${c.voteCheat > c.voteClean ? '&#128128;' : '&#9989;'}
          </div>
          <div class="case-info">
            <h3>${escHTML(c.title)}</h3>
            <p>${c.reporter} · ${c.map}</p>
          </div>
          <div class="case-meta">
            <span><span class="status-dot ${c.status === 'voting' ? 'pending' : c.status === 'resolved' ? 'online' : 'closed'}"></span>${c.status === 'voting' ? '投票中' : '已结案'}</span>
            <span>AI ${c.aiConfidence}%</span>
          </div>
        </a>
      `).join('');
    } catch {
      container.innerHTML = '<p style="color:var(--color-text-muted);text-align:center;padding:32px;">案例加载失败，请确认服务器已启动</p>';
    }

    // 重新触发渐显
    initReveal();
  }

  // ═══════════════════════════════════════════════════════════
  //  举报页：三步向导逻辑
  // ═══════════════════════════════════════════════════════════

  function initReportSteps() {
    const step1 = $('#step1');
    if (!step1) return; // 不在举报页

    const step2 = $('#step2');
    const step3 = $('#step3');
    const successState = $('#successState');

    // 步骤指示器点
    const stepDots = $$('.step-dot');
    function setActiveStep(n) {
      stepDots.forEach((dot, i) => {
        dot.style.background = i < n ? 'var(--color-primary)' : 'var(--color-border)';
      });
    }

    // Step 1 → Step 2
    $('#btnToStep2').addEventListener('click', () => {
      const title = $('#caseTitle').value.trim();
      const desc = $('#caseDescription').value.trim();
      if (!title) { toast('请填写案例标题', 'error'); return; }
      if (!desc) { toast('请填写详细描述', 'error'); return; }
      step1.style.display = 'none';
      step2.style.display = '';
      setActiveStep(2);
      step2.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Step 2 → Step 1
    $('#btnBackTo1').addEventListener('click', () => {
      step2.style.display = 'none';
      step1.style.display = '';
      setActiveStep(1);
      step1.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Step 2 → Step 3
    $('#btnToStep3').addEventListener('click', () => {
      step2.style.display = 'none';
      step3.style.display = '';
      setActiveStep(3);
      step3.scrollIntoView({ behavior: 'smooth', block: 'start' });
      runAnalysis();
    });

    // Step 3 → Step 2
    $('#btnBackTo2').addEventListener('click', () => {
      step3.style.display = 'none';
      step2.style.display = '';
      setActiveStep(2);
      step2.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // 文件上传
    let uploadedFiles = [];
    const uploadZone = $('#uploadZone');
    const fileInput = $('#fileInput');
    const preview = $('#uploadPreview');
    const fileCount = $('#fileCount');

    uploadZone.addEventListener('click', () => fileInput.click());
    uploadZone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
    });

    ['dragenter', 'dragover'].forEach(evt => {
      uploadZone.addEventListener(evt, (e) => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
    });
    ['dragleave', 'drop'].forEach(evt => {
      uploadZone.addEventListener(evt, (e) => { e.preventDefault(); uploadZone.classList.remove('drag-over'); });
    });

    uploadZone.addEventListener('drop', (e) => {
      handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', () => {
      handleFiles(fileInput.files);
    });

    function handleFiles(files) {
      const newFiles = [...files].filter(f => f.type.startsWith('image/')).slice(0, 5 - uploadedFiles.length);
      uploadedFiles = [...uploadedFiles, ...newFiles].slice(0, 5);
      renderPreviews();
      $('#btnToStep3').disabled = uploadedFiles.length === 0;
    }

    function renderPreviews() {
      preview.innerHTML = '';
      uploadedFiles.forEach((file, i) => {
        const url = URL.createObjectURL(file);
        const item = document.createElement('div');
        item.className = 'upload-preview-item';
        item.innerHTML = `
          <img src="${url}" alt="截图 ${i + 1}">
          <button class="remove-btn" data-index="${i}" aria-label="移除截图 ${i + 1}">&times;</button>
        `;
        item.querySelector('.remove-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          uploadedFiles.splice(i, 1);
          renderPreviews();
          $('#btnToStep3').disabled = uploadedFiles.length === 0;
        });
        preview.appendChild(item);
      });
      fileCount.textContent = uploadedFiles.length;
      $('#btnToStep3').disabled = uploadedFiles.length === 0;
    }

    // AI 分析
    async function runAnalysis() {
      const desc = $('#caseDescription').value.trim();
      // 显示分析中
      $('#analyzingState').style.display = '';
      $('#analysisResult').style.display = 'none';
      $('#submitArea').style.display = 'none';

      try {
        // 模拟 API 调用延迟
        await new Promise(r => setTimeout(r, 2000));

        const result = await api('/api/analyze', {
          method: 'POST',
          body: JSON.stringify({ screenshotsCount: uploadedFiles.length, description: desc }),
        });

        // 显示结果
        $('#analyzingState').style.display = 'none';
        $('#analysisResult').style.display = '';
        $('#submitArea').style.display = '';

        // 置信度
        const confidence = result.confidence;
        const fill = $('#confidenceFill');
        fill.style.width = confidence + '%';
        fill.style.background = confidence > 60 ? 'var(--color-danger)' : confidence > 30 ? 'var(--color-warning)' : 'var(--color-success)';
        $('#confidenceValue').textContent = confidence + '%';

        // 摘要
        $('#aiSummary').textContent = result.summary;

        // 时间轴
        const timeline = $('#analysisTimeline');
        timeline.innerHTML = result.events.map(e => `
          <div class="analysis-event ${e.type}">
            <div class="event-time">${escHTML(e.time)}</div>
            <div class="event-desc">${escHTML(e.desc)}</div>
          </div>
        `).join('');
      } catch (err) {
        toast('AI 分析失败：' + err.message, 'error');
      }
    }

    // 钱包连接 (Demo 模式)
    $('#btnConnectWallet').addEventListener('click', async () => {
      // 尝试连接 MetaMask
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          $('#walletAddress').value = accounts[0];
          $('#btnSubmit').disabled = false;
          $('#walletHint').textContent = '已连接 MetaMask';
          toast('钱包已连接', 'success');
          return;
        } catch {
          // 用户拒绝
        }
      }

      // Demo fallback: 生成随机地址
      const demoAddr = '0x' + Array.from({ length: 40 }, () =>
        '0123456789abcdef'[Math.floor(Math.random() * 16)]
      ).join('');
      $('#walletAddress').value = demoAddr;
      $('#btnSubmit').disabled = false;
      $('#walletHint').textContent = 'Demo 模式：已生成模拟地址';
      toast('Demo 模式：模拟钱包已连接', 'info');
    });

    // 提交上链
    $('#btnSubmit').addEventListener('click', async () => {
      const title = $('#caseTitle').value.trim();
      const desc = $('#caseDescription').value.trim();
      const evidenceHash = '0x' + Array.from({ length: 64 }, () =>
        '0123456789abcdef'[Math.floor(Math.random() * 16)]
      ).join('');

      // 模拟上链延迟
      $('#btnSubmit').disabled = true;
      $('#btnSubmit').textContent = '上链中…';

      await new Promise(r => setTimeout(r, 2500));

      // 显示成功
      step3.style.display = 'none';
      successState.style.display = '';
      setActiveStep(3);
      $('#txHashDisplay').textContent = '交易哈希：' + evidenceHash;
      toast('案例已成功上链！', 'success');
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  案例详情页：加载 + 投票
  // ═══════════════════════════════════════════════════════════

  let currentCaseId = null;
  let selectedChoice = 0;

  async function initCaseDetail() {
    const header = $('#caseHeader');
    if (!header) return; // 不在详情页

    // 从 URL 获取 case id
    const params = new URLSearchParams(window.location.search);
    currentCaseId = params.get('id') || 'case-001';

    const apiUrl = `/api/cases?id=${currentCaseId}`;
    try {
      const c = await api(apiUrl);
      renderCaseDetail(c);
    } catch (err) {
      $('#caseTitleDisplay').textContent = '加载失败 [' + apiUrl + ']: ' + err.message;
      console.error('Case detail error:', err, 'url:', apiUrl);
    }

    // 加载其他案例
    try {
      const allCases = await api('/api/cases');
      const others = allCases.filter(c => c.id !== currentCaseId);
      renderOtherCases(others);
    } catch { /* ignore */ }
  }

  function renderCaseDetail(c) {
    // 头部
    $('#caseTitleDisplay').textContent = c.title;
    $('#caseReporter').textContent = '举报者：' + c.reporter;
    $('#caseMap').textContent = '地图：' + c.map;
    $('#caseTime').textContent = '时间：' + new Date(c.timestamp).toLocaleString('zh-CN');
    $('#caseStatus').textContent = c.status === 'voting' ? '投票中' : '已结案';
    $('#caseStatus').className = c.status === 'voting' ? 'badge badge-yellow' : 'badge badge-green';

    // AI 分析
    const confFill = $('#confFill');
    confFill.style.width = c.aiConfidence + '%';
    confFill.style.background = c.aiConfidence > 60 ? 'var(--color-danger)' : c.aiConfidence > 30 ? 'var(--color-warning)' : 'var(--color-success)';
    $('#confValue').textContent = c.aiConfidence + '%';
    $('#aiSummaryText').textContent = c.aiSummary;

    // 分析时间轴
    const timeline = $('#analysisEvents');
    if (timeline) {
      timeline.innerHTML = c.analysisEvents.map(e => `
        <div class="analysis-event ${e.type}">
          <div class="event-time">${escHTML(e.time)}</div>
          <div class="event-desc">${escHTML(e.desc)}</div>
        </div>
      `).join('');
    }

    // 投票结果
    updateVoteBars(c);
    $('#txHash').textContent = c.txHash || '—';

    // 如果已结案，禁用投票
    if (c.status === 'resolved') {
      $('#voteButtons').style.display = 'none';
      $('#voteMessage').style.display = '';
      if (c.voteCheat >= c.voteClean && c.voteCheat >= c.voteUncertain) {
        $('#voteMessage').textContent = '✓ 社区判定：不可信';
        $('#voteMessage').style.color = 'var(--color-danger)';
      } else if (c.voteClean >= c.voteCheat && c.voteClean >= c.voteUncertain) {
        $('#voteMessage').textContent = '✓ 社区判定：可信';
        $('#voteMessage').style.color = 'var(--color-success)';
      } else {
        $('#voteMessage').textContent = '✓ 社区判定：存疑';
        $('#voteMessage').style.color = 'var(--color-warning)';
      }
    }
  }

  function updateVoteBars(c) {
    const total = c.voteCheat + c.voteClean + c.voteUncertain || 1;
    $('#countCheat').textContent = c.voteCheat;
    $('#countClean').textContent = c.voteClean;
    $('#countUncertain').textContent = c.voteUncertain;
    $('#barCheat').style.width = (c.voteCheat / total * 100) + '%';
    $('#barClean').style.width = (c.voteClean / total * 100) + '%';
    $('#barUncertain').style.width = (c.voteUncertain / total * 100) + '%';
  }

  function renderOtherCases(others) {
    const container = $('#otherCases');
    if (!container) return;
    container.innerHTML = others.map(c => `
      <a href="/case?id=${c.id}" class="case-item" style="text-decoration:none;color:inherit;">
        <div class="case-thumb" aria-hidden="true">
          ${c.voteCheat > c.voteClean ? '&#128128;' : '&#9989;'}
        </div>
        <div class="case-info">
          <h3>${escHTML(c.title)}</h3>
          <p>${c.reporter} · ${c.map}</p>
        </div>
        <div class="case-meta">
          <span>AI ${c.aiConfidence}%</span>
        </div>
      </a>
    `).join('');
  }

  // 投票交互
  function initVoting() {
    const buttons = $$('.vote-btn');
    if (buttons.length === 0) return;

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedChoice = parseInt(btn.dataset.choice);
        $('#btnCastVote').disabled = false;
      });
    });

    $('#btnCastVote').addEventListener('click', async () => {
      if (!selectedChoice) return;

      // 模拟投票
      $('#btnCastVote').disabled = true;
      $('#btnCastVote').textContent = '投票中…';

      await new Promise(r => setTimeout(r, 1500));

      // 重新加载案例数据（模拟）
      try {
        const c = await api(`/api/cases/${currentCaseId}`);
        // 模拟增加一票
        if (selectedChoice === 1) c.voteCheat++;
        else if (selectedChoice === 2) c.voteClean++;
        else c.voteUncertain++;
        updateVoteBars(c);

        toast('投票已提交！', 'success');
        $('#btnCastVote').textContent = '已投票 ✓';
        $('#btnCastVote').style.background = 'var(--color-success)';

        // 禁用投票按钮
        $$('.vote-btn').forEach(b => b.disabled = true);
      } catch {
        toast('投票失败，请重试', 'error');
        $('#btnCastVote').disabled = false;
        $('#btnCastVote').textContent = '确认投票';
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  XSS 转义
  // ═══════════════════════════════════════════════════════════

  function escHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ═══════════════════════════════════════════════════════════
  //  页面初始化
  // ═══════════════════════════════════════════════════════════

  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initReveal();
    renderCaseList();
    initReportSteps();
    initCaseDetail();
    initVoting();
  });

})();
