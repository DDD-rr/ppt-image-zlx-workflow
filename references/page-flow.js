(() => {
  const style = document.createElement('style');
  style.textContent = `
    .page-flow-panel { margin: 0 0 18px; padding: 20px; border: 1px solid #cbdced; border-radius: 14px; background: linear-gradient(145deg, #f9fbfe, #edf5fb); }
    .page-flow-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 14px; }
    .page-flow-head h3 { margin: 0 0 5px; color: #173b5f; font-size: 18px; }
    .page-flow-head p { margin: 0; color: #70869b; font-size: 12px; }
    .page-flow-status { flex: 0 0 auto; padding: 6px 11px; border-radius: 100px; background: #dcecff; color: #1b63a0; font-size: 12px; font-weight: 800; }
    .page-flow-body { display: grid; grid-template-columns: minmax(0, 1fr) 245px; gap: 18px; }
    .page-flow-note { min-height: 72px; padding: 10px 12px; border: 1px solid #c7d9e8; border-radius: 8px; background: #fff; color: #34546f; font: inherit; font-size: 12px; resize: vertical; }
    .page-flow-info { display: grid; gap: 9px; align-content: start; color: #526f88; font-size: 12px; line-height: 1.6; }
    .page-flow-info code { overflow-wrap: anywhere; color: #27699d; font-size: 11px; }
    .page-flow-actions { display: grid; gap: 8px; align-content: start; }
    .page-flow-actions button { margin: 0; padding: 10px 12px; border-radius: 8px; font-size: 12px; font-weight: 800; }
    .page-flow-actions button:disabled { opacity: .5; cursor: not-allowed; }
    .page-flow-error { color: #ae4334; }
    .page-flow-nav-status { grid-column: 2 / 3; grid-row: 2; display: block; margin-top: 3px; color: #647f96; font-size: 10px; line-height: 1.3; text-align: left; white-space: nowrap; }
    .generated-image-version[data-page-flow-mark]::after { content: attr(data-page-flow-mark); grid-column: 1 / -1; color: #1769aa; font-size: 10px; font-weight: 800; }
    @media (max-width: 720px) { .page-flow-body { grid-template-columns: 1fr; } .page-flow-head { display: block; } .page-flow-status { display: inline-block; margin-top: 9px; } }
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
    imageGroup.insertAdjacentElement('afterend', panel);
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
      badge.textContent = status(page);
    });
  }
  function render() {
    const panel = document.getElementById('page-flow-panel');
    const page = snapshot?.pages.find(item => item.id === bridge()?.active());
    if (!panel || !page) return;
    const previousNote = panel.querySelector('textarea')?.value || '';
    panel.replaceChildren();
    const header = element('div', 'page-flow-head');
    const heading = element('div');
    heading.append(element('h3', '', '本页生成与验收'), element('p', '', '每次只处理一页；采用或明确放弃后，再选择下一页。'));
    header.append(heading, element('span', 'page-flow-status', status(page)));
    const body = element('div', 'page-flow-body');
    const info = element('div', 'page-flow-info');
    const text = error || (!page.sourceMatches ? '原文与本版决策材料不一致，请先使用原有的“更新”功能同步。' : page.needsReview ? '本页内容或决策已变化。旧图保留，请核对后重做。' : page.lastRequest?.status === 'queued' ? '请求已保存，等待 Codex 会话接手。' : page.lastRequest?.status === 'running' ? 'Codex 正在生成本页图片。' : page.lastRequest?.status === 'ready' ? '请查看上方最终候选图，再选择采用或重做。' : page.adopted ? '本页已有采用版本。可继续查看历史版本或重新生成。' : '核对本页原文和视觉选择后，发起一张图片。');
    info.append(element('span', error ? 'page-flow-error' : '', text));
    if (page.lastRequest) info.append(element('code', '', `请求 ${page.lastRequest.id} · ${page.lastRequest.status}${page.lastRequest.error ? ` · ${page.lastRequest.error}` : ''}`));
    const version = page.lastRequest?.status === 'ready' ? page.candidate : page.adoptedVersion;
    if (version) info.append(element('code', '', `${version.path} · 原文 ${version.sourceHash?.slice(0, 12)} · 决策 ${version.decisionHash?.slice(0, 12)}`));
    const note = element('textarea', 'page-flow-note'); note.value = previousNote; note.placeholder = '重做意见（可选）；本页生成请求也可附上说明。'; note.setAttribute('aria-label', '本页生成或重做意见');
    info.append(note);
    const controls = element('div', 'page-flow-actions');
    const active = snapshot.activeRequest;
    if (active && active.pageId !== page.id) controls.append(element('span', '', `第 ${Number(active.pageId.replace(/\D/g, ''))} 页尚待确认，请先完成那一页。`));
    else if (page.lastRequest?.status === 'ready') {
      controls.append(button('采用并继续', () => action(async () => {
        await api(flow('/accept'), { requestId: page.lastRequest.id });
        await refresh();
        bridge().nextPage(snapshot.pages.filter(item => !item.adopted || item.needsReview).map(item => item.id));
      }), true));
      controls.append(button('按意见重做本页', () => action(() => request(true))));
      controls.append(button('暂不采用，先选别页', () => action(() => api(flow('/reject'), { requestId: page.lastRequest.id }))));
    } else if (!['queued', 'running'].includes(page.lastRequest?.status) && page.sourceMatches) {
      controls.append(button(uiChecked(page) ? '准备生成本页' : '确认本页决策并请求生成', () => action(() => request()), true));
    }
    body.append(info, controls); panel.append(header, body);
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
