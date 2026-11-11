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
    #slideNav .nav-button { position: relative; padding-right: 30px; }
    #slideNav .nav-button .nav-status-dot { display: none !important; }
    .page-flow-nav-status { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); display: grid; place-items: center; width: 18px; height: 18px; border-radius: 50%; color: #647f96; font-size: 14px; line-height: 1; font-weight: 800; }
    .page-flow-nav-status[data-state="待生成"] { color: #3983bd; }
    .page-flow-nav-status[data-state="等待 Codex 处理"], .page-flow-nav-status[data-state="生成中"] { color: #1677ff; }
    .page-flow-nav-status[data-state="待确认"] { color: #c27a00; }
    .page-flow-nav-status[data-state="已采用"] { color: #389e0d; }
    .page-flow-nav-status[data-state="生成失败"], .page-flow-nav-status[data-state="原文待同步"], .page-flow-nav-status[data-state="需要重审"], .page-flow-nav-status[data-state="结果已过期"] { color: #cf3f32; }
    .generated-image-version[data-page-flow-mark]::after { content: attr(data-page-flow-mark); grid-column: 1 / -1; color: #1769aa; font-size: 10px; font-weight: 800; }
    .generated-image-group:has(.page-flow-panel) { padding: 16px; }
    .generated-image-group:has(.page-flow-panel) .generated-image-layout { position: relative; grid-template-columns: 160px minmax(0, 1fr); min-height: 0; height: auto; }
    .generated-image-group:has(.page-flow-panel) .generated-image-layout:not(:has(.generated-image-main)) { grid-template-rows: auto 56px; }
    .generated-image-group:has(.page-flow-panel) .generated-image-layout:has(.generated-image-main) { grid-template-columns: 168px minmax(0, 1fr); grid-template-rows: auto; }
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
    if (page.needsReview) return '需要重审';
    const current = page.lastRequest?.status;
    if (current === 'queued') return '等待 Codex 处理';
    if (current === 'running') return '生成中';
    if (current === 'ready') return '待确认';
    if (page.adopted) return '已采用';
    if (current === 'failed') return '生成失败';
    if (current === 'stale') return '结果已过期';
    return uiChecked(page) ? '待生成' : '待检查';
  }
  function statusIcon(value) {
    return ({ '待检查': '○', '待生成': '◇', '等待 Codex 处理': '◷', '生成中': '⟳', '待确认': '◉', '已采用': '✓', '生成失败': '!', '原文待同步': '↻', '需要重审': '⚠', '结果已过期': '⌛' })[value] || '•';
  }
  function uiChecked(page) {
    const index = snapshot?.pages.findIndex(item => item.id === page.id);
    const button = index >= 0 ? document.querySelectorAll('#slideNav .nav-button')[index] : null;
    return button ? button.title === '已检查' : page.checked;
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
  async function action(operation) {
    busy = true; error = ''; render();
    try { await operation(); await refresh(); }
    catch (problem) { error = problem.message; }
    busy = false; render();
  }
  async function request(retry = false) {
    if (bridge().rawDirty()) throw new Error('本页原文尚未保存，请先使用原有的“保存”按钮。');
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
    const version = page.lastRequest?.status === 'ready' ? page.candidate : page.adoptedVersion;
    const message = error || (!page.sourceMatches ? '原文与决策版本不一致，请先更新原始材料。' : page.needsReview ? '页面决策有变化，旧图待重新核对。' : requestStatus === 'queued' ? '请求已排队，等待 Codex 开始。' : requestStatus === 'running' ? '正在生成一张图片。完成后会显示在下方。' : requestStatus === 'ready' ? '候选图已生成，请在下方确认。' : requestStatus === 'failed' ? `生成失败：${page.lastRequest.error || '请重试。'}` : requestStatus === 'stale' ? '候选图已过期，请重新生成。' : page.adopted ? `已采用：${page.adoptedVersion?.path.split('/').at(-1) || '当前版本'}` : '尚无候选图。确认后生成一张。');
    info.append(element('strong', error ? 'page-flow-error' : '', message));
    if (version && requestStatus === 'ready') info.append(element('code', '', `候选文件：${version.path.split('/').at(-1)}`));
    const noteDetails = element('details', 'page-flow-note');
    noteDetails.open = noteWasOpen;
    const noteSummary = element('summary', '', '添加重做意见（可选）');
    const note = element('textarea'); note.value = previousNote; note.placeholder = '说明希望调整的地方'; note.setAttribute('aria-label', '重做意见');
    noteDetails.append(noteSummary, note);
    const controls = element('div', 'page-flow-actions');
    const active = snapshot.activeRequest;
    if (active && active.pageId !== page.id) info.append(element('span', '', `第 ${Number(active.pageId.replace(/\D/g, ''))} 页仍有待确认任务。`));
    else if (page.lastRequest?.status === 'ready') {
      controls.append(button('采用并继续', () => action(async () => {
        await api(flow('/accept'), { requestId: page.lastRequest.id });
        await refresh();
        bridge().nextPage(snapshot.pages.filter(item => !item.adopted || item.needsReview).map(item => item.id));
      }), true));
      controls.append(button('按意见重做本页', () => action(() => request(true))));
      controls.append(button('暂不采用，先选别页', () => action(() => api(flow('/reject'), { requestId: page.lastRequest.id }))));
    } else if (['queued', 'running'].includes(requestStatus)) {
      // Keep the active request visible without offering duplicate actions.
    } else if (page.adopted) {
      controls.append(button('取消采用', () => action(() => api(flow('/unaccept'), { requestId: page.adoptedVersion.requestId }))));
      controls.append(button('重新生成', () => action(() => request()), true));
    } else if (!['queued', 'running'].includes(page.lastRequest?.status) && page.sourceMatches) {
      controls.append(button(page.lastRequest?.status === 'failed' || page.lastRequest?.status === 'stale' ? '重试生成' : '生成本页', () => action(() => request()), true));
    }
    if (!['queued', 'running'].includes(requestStatus)) info.append(noteDetails);
    const guide = element('details', 'page-flow-guide');
    guide.open = guideWasOpen;
    guide.append(element('summary', '', '本页效果预览'));
    const guideContent = element('div', 'page-flow-guide-content');
    const preview = bridge().previewData?.();
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
    appendSection('全局沿用', preview?.global);
    guide.append(guideContent);
    body.append(info, controls); panel.append(header, body, guide);
    renderNav();
  }
  async function showPreferred(page) {
    const version = page.lastRequest?.status === 'ready' ? page.candidate : page.adoptedVersion;
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
    const current = bridge().active();
    if (lastPage !== current) { error = ''; lastPage = current; }
    mount(); render();
    const page = snapshot.pages.find(item => item.id === current);
    if (page) await showPreferred(page);
  }
  const panel = document.getElementById('slidePanel');
  if (panel) new MutationObserver(() => mount()).observe(panel, { childList: true });
  document.addEventListener('page-flow-ready', () => refresh().catch(problem => { error = problem.message; render(); }));
  if (bridge()) refresh().catch(problem => { error = problem.message; render(); });
  setInterval(() => refresh().catch(problem => { error = problem.message; render(); }), 6000);
})();
