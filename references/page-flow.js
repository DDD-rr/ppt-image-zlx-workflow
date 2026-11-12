(() => {
  const style = document.createElement('style');
  style.textContent = `
    .page-flow-panel { margin: 0 0 12px; padding: 12px 14px; border: 1px solid #d7e3ee; border-radius: 12px; background: #fff; }
    .page-flow-head { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 8px; }
    .page-flow-head h3 { margin: 0; color: #173b5f; font-size: 16px; }
    .page-flow-status { flex: 0 0 auto; padding: 6px 11px; border-radius: 100px; background: #dcecff; color: #1b63a0; font-size: 12px; font-weight: 800; }
    .page-flow-body { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px 18px; align-items: center; }
    .page-flow-info { display: grid; gap: 4px; align-content: start; color: #526f88; font-size: 13px; line-height: 1.45; }
    .page-flow-info strong { color: #274b6c; font-size: 14px; }
    .page-flow-info code { overflow-wrap: anywhere; color: #71869a; font-size: 11px; }
    .page-flow-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 7px; align-content: start; }
    .page-flow-actions button { margin: 0; padding: 10px 12px; border-radius: 8px; font-size: 12px; font-weight: 800; }
    .page-flow-actions button:disabled { opacity: .5; cursor: not-allowed; }
    .page-flow-actions button[aria-disabled="true"] { opacity: .55; cursor: not-allowed; filter: saturate(.55); }
    .page-flow-error { color: #ae4334; }
    .page-flow-note { margin-top: 8px; color: #71869a; font-size: 12px; }
    .page-flow-note summary { width: fit-content; cursor: pointer; }
    .page-flow-note textarea { display: block; width: min(100%, 680px); min-height: 54px; margin-top: 7px; padding: 8px 10px; border: 1px solid #c7d9e8; border-radius: 8px; color: #34546f; font: inherit; resize: vertical; }
    .page-flow-guide { margin-top: 12px; padding-top: 10px; border-top: 1px solid #e7edf3; color: #34546f; font-size: 12px; }
    .page-flow-guide > summary { width: fit-content; color: #315f89; font-weight: 800; cursor: pointer; }
    .page-flow-guide-content { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 10px 18px; margin-top: 10px; }
    .page-flow-guide-section h4 { margin: 0 0 5px; color: #71869a; font-size: 11px; letter-spacing: .03em; }
    .page-flow-guide-row { display: grid; grid-template-columns: 76px minmax(0, 1fr); gap: 3px 8px; padding: 6px 8px; border-radius: 7px; background: #f6f8fa; }
    .page-flow-guide-label { color: #71869a; }
    .page-flow-guide-value { color: #274b6c; font-weight: 700; }
    .page-flow-guide-effect { grid-column: 2; color: #70869b; line-height: 1.4; }
    .page-flow-guide-section { padding:12px; border:1px solid #e3ebf2; border-radius:10px; background:#fff; }
    .page-flow-guide-section h4 { padding-bottom:7px; border-bottom:1px solid #edf1f5; color:#315f89; font-size:12px; letter-spacing:0; }
    .page-flow-guide-row { grid-template-columns:minmax(0,96px) minmax(0,1fr); gap:5px 10px; margin-top:6px; padding:8px 9px; }
    .page-flow-guide-value { font-size:12px; }
    .page-flow-guide-effect { line-height:1.55; }
    #slideNav .nav-button { position: relative; padding-right: 30px; }
    #slideNav .nav-button .nav-status-dot { display: none !important; }
    .page-flow-nav-status { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); display: grid; place-items: center; width: 18px; height: 18px; border-radius: 50%; color: #647f96; font-size: 14px; line-height: 1; font-weight: 800; }
    .page-flow-nav-status[data-state="待生成"] { color: #3983bd; }
    .page-flow-nav-status[data-state="等待 Codex 处理"], .page-flow-nav-status[data-state="生成中"] { color: #1677ff; }
    .page-flow-nav-status[data-state="待确认"] { color: #c27a00; }
    .page-flow-nav-status[data-state="已采用"] { color: #389e0d; }
    .page-flow-nav-status[data-state="生成失败"], .page-flow-nav-status[data-state="原文待同步"], .page-flow-nav-status[data-state="需要重审"], .page-flow-nav-status[data-state="结果已过期"] { color: #cf3f32; }
    .generated-image-version[data-page-flow-mark]::after { content: attr(data-page-flow-mark); grid-column: 1 / -1; color: #1769aa; font-size: 10px; font-weight: 800; }
    .generated-image-version[data-page-flow-candidate="true"] { outline: 2px solid #32a852; outline-offset: 1px; background: #effaf1; }
    .generated-image-version[data-page-flow-candidate="true"]::before { content: '✓'; position: absolute; right: 7px; top: 7px; z-index: 2; display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; background: #258d45; color: #fff; font-size: 13px; font-weight: 900; }
    .generated-image-version { position: relative; }
    .generated-image-details-title { display:flex; align-items:center; justify-content:space-between; gap:12px; }
    .page-flow-mark-image { margin:0; padding:9px 16px; border:1px solid #218b43; border-radius:8px; background:#258d45; color:white; font-size:12px; font-weight:800; white-space:nowrap; cursor:pointer; }
    .page-flow-mark-image[aria-pressed="true"] { background:#eefaf1; color:#237d3c; }
    .generated-image-details.page-flow-image-meta { display:grid !important; grid-template-columns:minmax(0,1fr) minmax(150px,auto) auto; align-items:center; gap:8px 20px; height:auto; min-height:72px; padding:10px 16px; }
    .generated-image-details.page-flow-image-meta[hidden] { display:none !important; }
    .page-flow-image-meta > div { min-width:0; }
    .page-flow-image-meta > div:last-child { display:flex; flex-direction:column; align-items:flex-end; gap:5px; }
    .page-flow-image-meta .generated-image-filepath { display:block; max-height:none; margin-top:4px; white-space:normal; overflow-wrap:anywhere; color:#71869a; font-size:11px; }
    .page-flow-image-meta .generated-image-detail-label { display:none; }
    .page-flow-image-name { display:block; color:#244a67; font-size:13px; font-weight:800; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .page-flow-image-path { margin-top:4px; color:#667f95; font-size:11px; }
    .page-flow-image-time { color:#314f69; font-size:12px; white-space:nowrap; }
    .page-flow-image-action { display:flex; justify-content:flex-end; }
    @media (max-width:700px) { .generated-image-details.page-flow-image-meta { grid-template-columns:1fr; } .page-flow-image-meta > div:last-child { align-items:flex-start; } .page-flow-image-action { justify-content:flex-start; } }
    .page-flow-bottom-link { position:fixed; right:22px; bottom:20px; z-index:1000; padding:10px 14px; border:1px solid #b6cde1; border-radius:999px; background:#fff; color:#245d8c; box-shadow:0 4px 18px #14314b26; font-weight:800; cursor:pointer; }
    .generated-image-group:has(.page-flow-panel) { padding: 16px; }
    .generated-image-group:has(.page-flow-panel) .generated-image-layout { position: relative; grid-template-columns: 160px minmax(0, 1fr); min-height: 0; height: auto; }
    .generated-image-group:has(.page-flow-panel) .generated-image-layout:has(.generated-image-main) { grid-template-rows: minmax(0, 1fr) auto; }
    .generated-image-group:has(.page-flow-panel) .generated-image-layout:not(:has(.generated-image-main)) { grid-template-rows: minmax(0, 1fr) auto; }
    .generated-image-group:has(.page-flow-panel) .generated-image-layout:has(.generated-image-main) .generated-image-details { min-height: 72px; box-sizing: border-box; }
    .generated-image-group:has(.page-flow-panel) .generated-image-layout:not(:has(.generated-image-main)) .generated-image-details { min-height: 72px; box-sizing: border-box; }
    .generated-image-group:has(.page-flow-panel) .generated-image-layout:not(:has(.generated-image-main)) { grid-template-rows: minmax(0, 1fr) auto; }
    .generated-image-group:has(.page-flow-panel) .generated-image-layout:has(.generated-image-main) { grid-template-columns: 168px minmax(0, 1fr); grid-template-rows: minmax(0, 1fr) auto; }
    .generated-image-group:has(.page-flow-panel) .generated-image-rail { position: absolute; top: 0; bottom: 0; left: 0; width: 160px; height: auto; max-height: none; min-height: 0; box-sizing: border-box; overflow: auto; }
    .generated-image-group:has(.page-flow-panel) .generated-image-layout:has(.generated-image-main) .generated-image-rail { width: 168px; }
    .generated-image-group:has(.page-flow-panel) .generated-image-stage { height: auto; min-height: 0; max-height: none; align-self: start; }
    .generated-image-group:has(.page-flow-panel) .generated-image-layout:not(:has(.generated-image-main)) .generated-image-stage { grid-column: 2; grid-row: 1; }
    .generated-image-group:has(.page-flow-panel) .generated-image-layout:not(:has(.generated-image-main)) .generated-image-details { grid-column: 2; grid-row: 2; }
    .generated-image-group:has(.page-flow-panel) .generated-image-layout:has(.generated-image-main) .generated-image-main { grid-column: 2; grid-row: 1; min-height: 0; }
    .generated-image-group:has(.page-flow-panel) .generated-image-canvas { height: auto; min-height: 0; aspect-ratio: 16 / 9; padding: 0; }
    .generated-image-group:has(.page-flow-panel) .generated-image-preview { width: 100%; height: 100%; max-height: none; }
    .generated-image-group[data-state="empty"]:has(.page-flow-panel),
    .generated-image-group[data-state="loading"]:has(.page-flow-panel),
    .generated-image-group[data-state="error"]:has(.page-flow-panel) { padding: 12px 16px; }
    .generated-image-group[data-state="empty"]:has(.page-flow-panel) .generated-image-head,
    .generated-image-group[data-state="loading"]:has(.page-flow-panel) .generated-image-head,
    .generated-image-group[data-state="error"]:has(.page-flow-panel) .generated-image-head { margin-bottom: 8px; }
    .generated-image-group[data-state="empty"]:has(.page-flow-panel) .generated-image-layout,
    .generated-image-group[data-state="loading"]:has(.page-flow-panel) .generated-image-layout,
    .generated-image-group[data-state="error"]:has(.page-flow-panel) .generated-image-layout { display: block; width: 100%; height: auto; min-height: 0; }
    .generated-image-group[data-state="empty"]:has(.page-flow-panel) .generated-image-rail,
    .generated-image-group[data-state="loading"]:has(.page-flow-panel) .generated-image-rail,
    .generated-image-group[data-state="error"]:has(.page-flow-panel) .generated-image-rail,
    .generated-image-group[data-state="empty"]:has(.page-flow-panel) .generated-image-details,
    .generated-image-group[data-state="loading"]:has(.page-flow-panel) .generated-image-details,
    .generated-image-group[data-state="error"]:has(.page-flow-panel) .generated-image-details,
    .generated-image-group[data-state="empty"]:has(.page-flow-panel) .generated-image-stagebar,
    .generated-image-group[data-state="loading"]:has(.page-flow-panel) .generated-image-stagebar,
    .generated-image-group[data-state="error"]:has(.page-flow-panel) .generated-image-stagebar { display: none; }
    .generated-image-group[data-state="empty"]:has(.page-flow-panel) .generated-image-stage,
    .generated-image-group[data-state="loading"]:has(.page-flow-panel) .generated-image-stage,
    .generated-image-group[data-state="error"]:has(.page-flow-panel) .generated-image-stage { display: block; width: 100%; height: auto; min-height: 0; max-height: none; padding: 0; border: 0; background: transparent; }
    .generated-image-group[data-state="empty"]:has(.page-flow-panel) .generated-image-canvas,
    .generated-image-group[data-state="loading"]:has(.page-flow-panel) .generated-image-canvas,
    .generated-image-group[data-state="error"]:has(.page-flow-panel) .generated-image-canvas { display: grid; width: 100%; height: 56px; min-height: 56px; max-height: 56px; padding: 8px 12px; border-radius: 10px; }
    .generated-image-group[data-state="empty"]:has(.page-flow-panel) .generated-image-canvas { border-style: dashed; background: #f6f9fc; }
    .generated-image-group[data-state="loading"]:has(.page-flow-panel) .generated-image-canvas { background: linear-gradient(100deg, #f2f7fb 20%, #e7f0f7 38%, #f2f7fb 56%); background-size: 220% 100%; animation: generated-image-shimmer 1.5s ease-in-out infinite; }
    .generated-image-group[data-state="error"]:has(.page-flow-panel) .generated-image-canvas { border-color: #f0d9d7; background: #fff8f7; }
    @media (max-width: 720px) {
      .page-flow-body { grid-template-columns: 1fr; }
      .page-flow-actions { justify-content: flex-start; }
      .generated-image-group:has(.page-flow-panel) .generated-image-layout:not(:has(.generated-image-main)) { grid-template-columns: minmax(0, 1fr); grid-template-rows: 150px auto 56px; }
      .generated-image-group:has(.page-flow-panel) .generated-image-layout:has(.generated-image-main) { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto auto; }
      .generated-image-group:has(.page-flow-panel) .generated-image-rail { position: relative; inset: auto; grid-column: 1; grid-row: 1; width: auto; max-height: 155px; }
      .generated-image-group:has(.page-flow-panel) .generated-image-layout:not(:has(.generated-image-main)) .generated-image-stage { grid-column: 1; grid-row: 2; }
      .generated-image-group:has(.page-flow-panel) .generated-image-layout:not(:has(.generated-image-main)) .generated-image-details { grid-column: 1; grid-row: 3; }
      .generated-image-group:has(.page-flow-panel) .generated-image-layout:has(.generated-image-main) .generated-image-main { grid-column: 1; grid-row: 2; }
      .generated-image-group:has(.page-flow-panel) .generated-image-stage { height: auto; min-height: 0; }
      .generated-image-group:has(.page-flow-panel) .generated-image-canvas { height: auto; min-height: 0; aspect-ratio: 16 / 9; }
    }
  `;
  document.head.append(style);
  document.addEventListener('page-source-changed', () => render());
  let snapshot = null, busy = false, error = '', lastPage = null;
  const shownVersion = new Map();
  const bridge = () => window.__PAGE_FLOW_BRIDGE__;
  const flow = route => `/api/page-flow${route}`;
  async function api(route, body) {
    const response = await fetch(route, { method: body ? 'POST' : 'GET', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
    const value = await response.json();
    if (!response.ok) throw new Error(value.error || '操作失败');
    return value;
  }
  function status(page) {
    if (!page.sourceMatches) return '原文待同步';
    const confirmed = page.markedCandidate && page.markedCandidate.sourceHash === page.sourceHash && page.markedCandidate.decisionHash === page.decisionHash;
    if (page.markedCandidate && !confirmed) return '需要重审';
    if (confirmed && page.adopted?.id === page.markedCandidate.id) return '已采用';
    const current = page.lastRequest?.status;
    if (current === 'queued') return '等待 Codex 处理';
    if (current === 'running') return '生成中';
    if (current === 'ready') return '待确认';
    if (current === 'failed') return '生成失败';
    if (current === 'stale') return '结果已过期';
    if (page.needsReview) return '需要重审';
    if (page.adopted) return '已采用';
    return '待生成';
  }
  function statusIcon(value) {
    return ({ '待生成': '◇', '等待 Codex 处理': '◷', '生成中': '⟳', '待确认': '◉', '已采用': '✓', '生成失败': '!', '原文待同步': '↻', '需要重审': '⚠', '结果已过期': '⌛' })[value] || '•';
  }
  function element(tag, className, text) {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (text != null) item.textContent = text;
    return item;
  }
  function button(label, action, primary = false) {
    const item = element('button', primary ? 'primary' : 'secondary', label);
    item.type = 'button'; item.disabled = busy; item.onclick = action; return item;
  }
  function generationButton(label, reason, operation) {
    const item = button(label, () => {
      if (reason) {
        error = reason;
        render();
        document.querySelector('#page-flow-panel .page-flow-error')?.scrollIntoView({ block: 'nearest' });
      } else action(operation);
    }, true);
    if (reason) {
      item.setAttribute('aria-disabled', 'true');
      item.setAttribute('aria-label', `${label}，当前不可用：${reason}`);
      item.title = reason;
    }
    return item;
  }
  function copySessionInstruction(request) {
    const target = snapshot?.pages.find(item => item.id === request.pageId);
    const pageNumberLabel = Number(request.pageId.replace(/\D/g, ''));
    const instruction = `请使用 $ppt-image-zlx-workflow 处理逐页决策板中的待生成任务。决策板：${location.origin}/；请求 ID：${request.id}；按 ID 查询任务：${location.origin}/api/page-flow/requests/next?requestId=${request.id}；目标：第 ${pageNumberLabel} 页（${target?.title || target?.label || request.pageId}）。只处理这一页，完成 QA 后回写候选结果并等待我验收，不要自动采用或处理其他页面。`;
    const notice = element('span', 'page-flow-note');
    Promise.resolve().then(() => {
      if (!navigator.clipboard?.writeText) throw new Error('剪贴板不可用');
      return navigator.clipboard.writeText(instruction);
    }).then(() => {
      notice.textContent = '会话指令已复制，可粘贴到新会话处理此页。';
    }).catch(() => {
      notice.textContent = `复制失败，请手动复制：${instruction}`;
    });
    infoInsertNotice(notice);
  }
  function infoInsertNotice(notice) {
    const info = document.querySelector('#page-flow-panel .page-flow-info');
    info?.querySelector('.page-flow-note')?.remove();
    info?.append(notice);
  }
  async function action(operation) {
    busy = true; error = ''; render();
    try { await operation(); await refresh(); }
    catch (problem) { error = problem.message; }
    busy = false; render();
  }
  async function request(retry = false) {
    const sourceIssue = bridge().previewData?.().sourceIssue;
    if (sourceIssue) throw new Error(sourceIssue);
    const placeholderIssue = bridge().previewData?.().placeholderIssue;
    if (placeholderIssue) throw new Error(placeholderIssue);
    if (bridge().rawDirty()) throw new Error('本页原文尚未保存，请先使用原有的“保存”按钮。');
    if ((bridge().previewData?.().annotations || []).some(mark => mark.needsReview)) throw new Error('有选中文字标记因原文修改需要重新确认，请回到编辑区重新标记或移除后再生成。');
    if ((bridge().previewData?.().groups || []).some(group => group.pending)) throw new Error('请先为新增的材料小标题分配权重，再生成本页。');
    const pageId = bridge().active();
    const note = document.querySelector('#page-flow-panel textarea')?.value || '';
    const decision = bridge().confirmPage();
    const saved = await api('/api/decision', decision);
    if (!saved.ok) throw new Error('决策保存失败');
    await api(flow('/request'), { pageId, confirmReview: true, retry, note });
  }
  function mount() {
    const imageGroup = document.querySelector('#slidePanel .generated-image-group');
    if (!imageGroup || document.getElementById('page-flow-panel')) return;
    const panel = element('section', 'panel page-flow-panel');
    panel.id = 'page-flow-panel';
    panel.dataset.slideId = imageGroup.dataset.slideId;
    imageGroup.insertBefore(panel, imageGroup.querySelector('.generated-image-layout'));
    render();
  }
  function renderNav() {
    if (!snapshot) return;
    const buttons = document.querySelectorAll('#slideNav .nav-button');
    buttons.forEach((item, index) => {
      const page = snapshot.pages[index];
      if (!page) return;
      let badge = item.querySelector('.page-flow-nav-status');
      if (!badge) { badge = element('span', 'page-flow-nav-status'); item.append(badge); }
      const value = status(page);
      badge.textContent = statusIcon(value);
      badge.dataset.state = value;
      badge.title = value;
      badge.setAttribute('aria-label', value);
      badge.setAttribute('role', 'img');
    });
  }
  function render() {
    const panel = document.getElementById('page-flow-panel');
    const page = snapshot?.pages.find(item => item.id === bridge()?.active());
    if (!panel || !page) return;
    const previousNote = panel.querySelector('textarea')?.value || '';
    const noteWasOpen = panel.querySelector('.page-flow-note')?.open || false;
    const guideWasOpen = panel.querySelector('.page-flow-guide')?.open || false;
    panel.replaceChildren();
    const header = element('div', 'page-flow-head');
    const heading = element('div');
    heading.append(element('h3', '', '本页生成与验收'));
    header.append(heading, element('span', 'page-flow-status', status(page)));
    const body = element('div', 'page-flow-body');
    const info = element('div', 'page-flow-info');
    const requestStatus = page.lastRequest?.status;
    const version = page.markedCandidate || (page.lastRequest?.status === 'ready' ? page.candidate : page.adoptedVersion);
    const manualCandidate = !!page.markedCandidate && page.markedCandidate.sourceHash === page.sourceHash && page.markedCandidate.decisionHash === page.decisionHash;
    const message = error || (!page.sourceMatches ? '原文与页面决策不一致，请先同步材料。' : page.markedCandidate && !manualCandidate ? '原文或页面决策已变化，请重新采用图片。' : page.adopted && manualCandidate ? `当前采用：${page.adoptedVersion?.path.split('/').at(-1) || '所选图片'}` : requestStatus === 'queued' ? '生成请求已排队，尚未开始。请回到新会话发送处理指令；完成后图片会显示在本页。' : requestStatus === 'running' ? '正在生成一张图片。完成后会显示在下方。' : requestStatus === 'ready' ? '图片已生成，请在下方选择并采用。' : requestStatus === 'failed' ? `生成失败：${page.lastRequest.error || '请重试。'}` : requestStatus === 'stale' ? '采用图片已过期，请重新生成。' : page.needsReview ? '页面决策有变化，原采用图片需要重新确认。' : '尚无采用图片。确认后生成一张。');
    info.append(element('strong', error ? 'page-flow-error' : '', message));
    if (version && requestStatus === 'ready') info.append(element('code', '', `候选文件：${version.path.split('/').at(-1)}`));
    const noteDetails = element('details', 'page-flow-note');
    noteDetails.open = noteWasOpen;
    const noteSummary = element('summary', '', '添加重做意见（可选）');
    const note = element('textarea'); note.value = previousNote; note.placeholder = '说明希望调整的地方'; note.setAttribute('aria-label', '重做意见');
    noteDetails.append(noteSummary, note);
    const controls = element('div', 'page-flow-actions');
    const activeRequests = Array.isArray(snapshot.activeRequests) ? snapshot.activeRequests : (snapshot.activeRequest ? [snapshot.activeRequest] : []);
    const activeOnPage = activeRequests.find(item => item.pageId === page.id);
    const otherActive = activeRequests.filter(item => item.pageId !== page.id);
    const preview = bridge().previewData?.();
    const annotationPending = (preview?.annotations || []).some(mark => mark.needsReview);
    const groupPending = (preview?.groups || []).some(group => group.pending);
    const currentRequestActive = ['queued', 'running'].includes(requestStatus);
    let generationBlock = '';
    if (preview?.sourceIssue) generationBlock = preview.sourceIssue;
    else if (!page.sourceMatches && preview?.sourceMode !== 'images') generationBlock = '请到本页“页面审阅 → 本页原始材料”点击“更新”，同步后重新检查本页。';
    else if (bridge().rawDirty()) generationBlock = '本页材料有未保存修改，请到“页面审阅 → 本页原始材料”点击“保存”。';
    else if (preview?.groupSyncPending) generationBlock = '材料小标题还未同步，请到“每页内容怎么处理 → 信息组权重”点击“同步材料小标题”。删除或修改的小标题会移入历史分组。';
    else if (groupPending) generationBlock = '新增的小标题还没有设置权重，请到“每页内容怎么处理 → 信息组权重”分配后再生成。';
    else if (preview?.placeholderIssue) generationBlock = preview.placeholderIssue;
    else if (annotationPending) generationBlock = '部分选中文字标记需要重新确认，请到“本页原始材料”的 Markdown 编辑区重新标记或移除。';
    else if (currentRequestActive) generationBlock = requestStatus === 'queued' ? '本页生成任务已排队；请在当前 Codex 对话中处理，完成后回到本页验收。' : '本页正在生成，请等待候选图片出现后验收。';
    else if (requestStatus === 'ready') generationBlock = '图片已经生成，请先采用、重做或暂不采用，再开始下一次生成。';
    const generationLabel = currentRequestActive ? (requestStatus === 'queued' ? '等待处理' : '生成中') : requestStatus === 'ready' ? '候选图待验收' : page.lastRequest?.status === 'failed' || page.lastRequest?.status === 'stale' ? '重试生成' : page.adopted ? '重新生成' : '生成本页';
    controls.append(generationButton(generationLabel, generationBlock, () => request(requestStatus === 'failed' || requestStatus === 'stale')));
    otherActive.forEach(active => {
      const activePageNumber = Number(active.pageId.replace(/\D/g, ''));
      const label = active.status === 'queued' ? '等待会话处理' : active.status === 'running' ? '正在生成' : '候选图待验收';
      info.append(element('span', '', `第 ${activePageNumber} 页：${label}。`));
    });
    if (requestStatus === 'queued') {
      controls.append(button(`复制第 ${Number(page.id.replace(/\D/g, ''))} 页指令`, () => copySessionInstruction(page.lastRequest)));
    }
    else if (manualCandidate) {
      if (page.adopted?.id === version.id) controls.append(button('取消采用', () => action(() => api(flow('/candidate/unmark'), { pageId: page.id, versionId: version.id }))));
      else controls.append(button('采用', () => action(() => api(flow('/candidate/accept'), { pageId: page.id, versionId: version.id })), true));
    } else if (page.lastRequest?.status === 'ready') {
      controls.append(button('采用', () => action(async () => {
        await api(flow('/candidate/mark'), { pageId: page.id, path: page.candidate.path });
        await refresh();
        bridge().nextPage(snapshot.pages.filter(item => !item.adopted || item.needsReview).map(item => item.id));
      }), true));
      controls.append(button('按意见重做本页', () => action(() => request(true))));
      controls.append(button('暂不采用，先选别页', () => action(() => api(flow('/reject'), { requestId: page.lastRequest.id }))));
    } else if (['queued', 'running'].includes(requestStatus)) {
      // Keep the active request visible without offering duplicate actions.
    } else if (page.adopted) {
      controls.append(button('取消采用', () => action(() => api(flow('/unaccept'), { requestId: page.adoptedVersion.requestId }))));
    }
    if (!['queued', 'running'].includes(requestStatus)) info.append(noteDetails);
    const guide = element('details', 'page-flow-guide');
    guide.open = guideWasOpen;
    guide.append(element('summary', '', '本页效果预览'));
    const guideContent = element('div', 'page-flow-guide-content');
    const appendSection = (title, rows) => {
      if (!rows?.length) return;
      const section = element('section', 'page-flow-guide-section');
      section.append(element('h4', '', title));
      rows.forEach(row => {
        const item = element('div', 'page-flow-guide-row');
        item.append(element('span', 'page-flow-guide-label', row.label), element('span', 'page-flow-guide-value', row.value));
        if (row.effect) item.append(element('span', 'page-flow-guide-effect', row.effect));
        section.append(item);
      });
      guideContent.append(section);
    };
    appendSection('页面呈现', preview?.settings);
    appendSection('内容主次', preview?.groups);
    appendSection('选中文字呈现', preview?.annotations);
    appendSection('全局沿用', preview?.global);
    guide.append(guideContent);
    body.append(info, controls); panel.append(header, body, guide);
    renderNav();
  }
  function selectedImagePath() {
    return document.querySelector('#slidePanel .generated-image-group')?.dataset.selectedImagePath || '';
  }
  function decorateHistory() {
    const page = snapshot?.pages.find(item => item.id === bridge()?.active());
    const wrap = document.querySelector('#slidePanel .generated-image-group');
    if (!page || !wrap) return;
    const buttons = [...wrap.querySelectorAll('.generated-image-version')];
    const markedName = page.markedCandidate?.path?.split(/[\\/]/).at(-1);
    const latestName = page.lastRequest?.status === 'ready' ? page.candidate?.path?.split(/[\\/]/).at(-1) : '';
    buttons.forEach((item, index) => {
      const name = item.querySelector('.generated-image-thumb')?.src?.split('/').pop()?.split('?')[0];
      const marked = !!markedName && decodeURIComponent(name || '') === markedName;
      const generated = !markedName && !!latestName && decodeURIComponent(name || '') === latestName;
      item.toggleAttribute('data-page-flow-candidate', marked);
      item.dataset.pageFlowCandidate = String(marked);
      item.removeAttribute('data-page-flow-mark');
      if (marked) item.dataset.pageFlowMark = '已采用';
      else if (generated) item.dataset.pageFlowMark = '刚生成 · 待采用';
    });
    const details = wrap.querySelector('.generated-image-details');
    const file = details?.querySelector('.generated-image-filepath');
    const time = details?.querySelector('.generated-image-time');
    if (!details || !file || !time) return;
    details.classList.add('page-flow-image-meta');
    details.querySelector('.generated-image-details-title')?.remove();
    const fileColumn = file.closest('.page-flow-image-path')?.parentElement || file.parentElement;
    const timeColumn = time.parentElement;
    let name = fileColumn.querySelector('.page-flow-image-name');
    if (!name) {
      fileColumn.querySelector('.generated-image-detail-label')?.remove();
      name = element('strong', 'page-flow-image-name');
      fileColumn.prepend(name);
    }
    const selectedPath = selectedImagePath();
    name.textContent = selectedPath.split(/[\\/]/).at(-1) || '当前版本';
    file.textContent = selectedPath;
    timeColumn.classList.add('page-flow-image-time');
    let actionColumn = details.querySelector('.page-flow-image-action');
    if (!actionColumn) {
      actionColumn = element('div', 'page-flow-image-action');
      details.append(actionColumn);
    }
    let action = actionColumn.querySelector('.page-flow-mark-image');
    if (!action) { action = element('button', 'page-flow-mark-image'); action.type = 'button'; actionColumn.append(action); }
    actionColumn.querySelector('.page-flow-mark-feedback')?.remove();
    const imagePath = selectedImagePath();
    actionColumn.dataset.imagePath = imagePath;
    const selected = imagePath.split(/[\\/]/).at(-1);
    const marked = page.markedCandidate?.path?.split(/[\\/]/).at(-1) === selected && !!selected;
    const currentMark = marked && page.markedCandidate.sourceHash === page.sourceHash && page.markedCandidate.decisionHash === page.decisionHash;
    const canMark = /(^|[\\/])final_image[\\/]slide_\d+(?:_[A-Za-z0-9-]+)?\.(png|jpe?g|webp)$/i.test(imagePath);
    const adoptedMark = currentMark && page.adopted?.id === page.markedCandidate.id;
    action.textContent = adoptedMark ? '取消采用' : '采用';
    action.title = canMark ? (adoptedMark ? '取消采用当前图片' : '采用当前图片') : '只有 final_image 中的最终图片可以采用';
    action.disabled = !canMark;
    action.setAttribute('aria-pressed', String(adoptedMark));
    action.onclick = async () => {
      action.disabled = true;
      try {
        if (adoptedMark) await api(flow('/candidate/unmark'), { pageId: page.id, versionId: page.markedCandidate.id });
        else await api(flow('/candidate/mark'), { pageId: page.id, path: imagePath.replace(/^.*?(final_image|body_image)[\\/]/i, '$1/').replaceAll('\\', '/') });
        error = '';
        await refresh();
      } catch (problem) { error = problem.message; await refresh(); }
    };
  }
  function installBottomLink() {
    if (document.querySelector('.page-flow-bottom-link')) return;
    const link = element('button', 'page-flow-bottom-link', '前往生成');
    link.type = 'button';
    link.onclick = () => {
      const target = document.querySelector('#slidePanel .generated-image-group');
      if (!target) return;
      window.scrollTo({ top: Math.max(0, window.scrollY + target.getBoundingClientRect().top - 20), behavior: 'smooth' });
    };
    document.body.append(link);
    window.addEventListener('scroll', () => { link.hidden = window.scrollY < 500; }, { passive: true });
    link.hidden = window.scrollY < 500;
  }
  async function showPreferred(page) {
    const version = page.markedCandidate || (page.lastRequest?.status === 'ready' ? page.candidate : page.adoptedVersion);
    if (!version || shownVersion.get(page.id) === version.id) return;
    const list = document.querySelector('#slidePanel .generated-image-version-list');
    if (!list) return;
    const data = await api(`/api/generated-images?slideId=${encodeURIComponent(page.id)}`);
    const name = version.path.split('/').at(-1);
    const index = data.images.findIndex(item => item.name === name);
    const buttons = list.querySelectorAll('.generated-image-version');
    if (index < 0 || buttons.length !== data.images.length) return;
    buttons.forEach(item => item.removeAttribute('data-page-flow-mark'));
    buttons[index].dataset.pageFlowMark = page.lastRequest?.status === 'ready' ? '本次候选 · 待确认' : '当前采用';
    buttons[index].click();
    shownVersion.set(page.id, version.id);
  }
  async function refresh() {
    if (!bridge()) return;
    const boardTitle = document.getElementById('boardTitle');
    if (boardTitle && !boardTitle.textContent.includes('逐页版')) boardTitle.textContent += ' · 逐页版';
    if (!document.title.includes('逐页版')) document.title += ' · 逐页版';
    snapshot = await api(flow('/snapshot'));
    window.__PAGE_FLOW_CONFIRMED_IDS__ = new Set(snapshot.pages.filter(page => {
      const adopted = page.adopted && !page.needsReview;
      return page.sourceMatches && !!adopted;
    }).map(page => page.id));
    bridge().refreshCandidateNav?.();
    const current = bridge().active();
    if (lastPage !== current) { error = ''; lastPage = current; }
    mount(); render();
    const page = snapshot.pages.find(item => item.id === current);
    if (page) await showPreferred(page);
    decorateHistory();
    installBottomLink();
  }
  const panel = document.getElementById('slidePanel');
  if (panel) new MutationObserver(() => mount()).observe(panel, { childList: true });
  document.addEventListener('generated-image-selected', decorateHistory);
  document.addEventListener('page-flow-ready', () => refresh().catch(problem => { error = problem.message; render(); }));
  if (bridge()) refresh().catch(problem => { error = problem.message; render(); });
  setInterval(() => refresh().catch(problem => { error = problem.message; render(); }), 6000);
})();
