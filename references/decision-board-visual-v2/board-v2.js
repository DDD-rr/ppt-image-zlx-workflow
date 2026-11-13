(() => {
  if (!document.body.classList.contains('board-ui-v2')) return;
  const names = new Map([
    ['本页原始材料', 'source'], ['每块内容怎么处理', 'weights'], ['文字与画面的比例', 'ratio'],
    ['整页重点怎么突出', 'emphasis'], ['页面结构', 'structure'], ['上传图片的用途', 'assets'],
    ['待审阅问题', 'review'], ['高级视觉设置', 'advanced']
  ]);
  const paletteDescriptions = new Map([
    ['深色中性色与暗红点缀', '黑灰银白，暗红点缀'], ['深灰与冷灰蓝', '石墨灰与冷灰蓝'],
    ['黑白灰对比', '黑白与中灰'], ['碳黑、蓝与少量紫', '碳黑为主，蓝紫点缀'],
    ['浅灰白与蓝色', '浅灰白与蓝色'], ['暖白、蓝与少量金', '暖白蓝色，少量金色'],
    ['银灰与青绿色', '银灰与青绿'], ['纸白、石墨灰与少量红', '纸白灰色，红色点缀']
  ]);
  function normalizeHex(value) {
    const hex = value.trim().replace(/^#/, '');
    if (/^[0-9a-f]{3}$/i.test(hex)) return '#' + [...hex].map(char => char + char).join('').toUpperCase();
    return /^[0-9a-f]{6}$/i.test(hex) ? '#' + hex.toUpperCase() : null;
  }
  function hexToHsv(hex) {
    const [r, g, b] = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255);
    const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
    let h = 0;
    if (delta) h = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
    return { h:(h * 60 + 360) % 360, s:max ? delta / max : 0, v:max };
  }
  function hsvToHex({ h, s, v }) {
    const channel = n => { const k = (n + h / 60) % 6; return Math.round(255 * v * (1 - s * Math.max(0, Math.min(k, 4 - k, 1)))).toString(16).padStart(2, '0'); };
    return ('#' + channel(5) + channel(3) + channel(1)).toUpperCase();
  }
  function compactMaterialStatus(message, mode, kind) {
    if (kind === 'error') return message;
    if (mode === 'images') return '使用截图内容；Markdown 不参与生成。';
    const suffix = '布局与提示词已隐藏，生成时按最新材料重建。';
    if (/原文已更新|待重建/.test(message)) return '材料已更新，请复核；' + suffix;
    if (!message || /^(当前使用 Markdown 材料|原始材料按 Markdown 保存；预览和编辑内容均对应决策版本。)$/.test(message)) return suffix;
    return message + ' ' + suffix;
  }
  const enhancedMaterialStatuses = new WeakSet();
  function enhanceMaterialStatus(status) {
    if (enhancedMaterialStatuses.has(status)) return;
    enhancedMaterialStatuses.add(status);
    let original = status.textContent, rendered;
    const refresh = () => {
      if (status.textContent !== rendered) original = status.textContent;
      const mode = status.closest('.raw-material-group').dataset.sourceMode;
      rendered = compactMaterialStatus(original, mode, status.dataset.state);
      status.title = original;
      if (status.textContent !== rendered) status.textContent = rendered;
    };
    new MutationObserver(refresh).observe(status, { childList:true, characterData:true, subtree:true, attributes:true, attributeFilter:['data-state'] });
    refresh();
  }
  const enhancedPaletteModals = new WeakSet();
  function enhancePaletteModal() {
    const modal = document.getElementById('paletteModal');
    if (!modal || enhancedPaletteModals.has(modal)) return;
    enhancedPaletteModals.add(modal);
    const row = modal.querySelector('.palette-color-row');
    const nativeInputs = [...row.querySelectorAll('input[type="color"]')];
    const picker = document.createElement('section'); picker.className = 'ui-color-picker'; picker.hidden = true;
    picker.setAttribute('role', 'dialog'); picker.setAttribute('aria-label', '颜色面板');
    picker.innerHTML = '<div class="ui-picker-head"><strong>选择颜色</strong><button type="button" aria-label="关闭颜色面板">×</button></div><div class="ui-picker-sv" tabindex="0" role="group" aria-label="饱和度与明度，方向键调整，Shift 加速"><span class="ui-picker-cursor"></span></div><label class="ui-picker-hue-label">色相<input type="range" min="0" max="360" step="1" aria-label="色相"></label><label class="ui-picker-hex-label"><span>HEX</span><input type="text" maxlength="7" aria-label="颜色面板 HEX" spellcheck="false"></label>';
    modal.querySelector('.palette-modal').append(picker);
    const square = picker.querySelector('.ui-picker-sv'), cursor = picker.querySelector('.ui-picker-cursor');
    const hue = picker.querySelector('input[type="range"]'), pickerHex = picker.querySelector('input[type="text"]');
    let active = null, hsv;
    const closePicker = (restoreFocus = false) => {
      picker.hidden = true;
      if (active) { active.swatch.setAttribute('aria-expanded', 'false'); if (restoreFocus) active.swatch.focus(); }
    };
    const paintPicker = (updateHex = true) => {
      square.style.setProperty('--picker-hue', String(hsv.h));
      cursor.style.left = hsv.s * 100 + '%'; cursor.style.top = (1 - hsv.v) * 100 + '%';
      square.setAttribute('aria-description', `饱和度 ${Math.round(hsv.s * 100)}%，明度 ${Math.round(hsv.v * 100)}%`);
      hue.value = String(hsv.h); if (updateHex) pickerHex.value = active.native.value.slice(1).toUpperCase(); pickerHex.removeAttribute('aria-invalid');
    };
    const commitPicker = () => { active.native.value = hsvToHex(hsv); active.sync(false); paintPicker(); };
    const point = event => {
      const rect = square.getBoundingClientRect();
      hsv.s = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      hsv.v = 1 - Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)); commitPicker();
    };
    square.addEventListener('pointerdown', event => { if (event.button !== 0) return; square.focus(); square.setPointerCapture(event.pointerId); point(event); });
    square.addEventListener('pointermove', event => { if (square.hasPointerCapture(event.pointerId)) point(event); });
    square.addEventListener('pointerup', event => { if (square.hasPointerCapture(event.pointerId)) square.releasePointerCapture(event.pointerId); });
    square.addEventListener('keydown', event => {
      const step = event.shiftKey ? .1 : .01;
      if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      hsv.s = Math.max(0, Math.min(1, hsv.s + (event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0)));
      hsv.v = Math.max(0, Math.min(1, hsv.v + (event.key === 'ArrowUp' ? step : event.key === 'ArrowDown' ? -step : 0))); commitPicker();
    });
    hue.addEventListener('input', () => { hsv.h = Number(hue.value); commitPicker(); });
    pickerHex.addEventListener('input', () => {
      const value = normalizeHex(pickerHex.value); pickerHex.setAttribute('aria-invalid', String(!value));
      if (value) { active.native.value = value; active.sync(false); hsv = hexToHsv(value); paintPicker(false); }
    });
    pickerHex.addEventListener('blur', () => {
      if (normalizeHex(pickerHex.value)) paintPicker();
      else { active.hex.value = pickerHex.value; active.apply(true); }
    });
    picker.querySelector('button').addEventListener('click', () => closePicker(true));
    modal.addEventListener('keydown', event => { if (event.key === 'Escape' && !picker.hidden) { event.preventDefault(); event.stopPropagation(); closePicker(true); } });
    modal.addEventListener('pointerdown', event => { if (!picker.hidden && !picker.contains(event.target) && !event.target.closest('.ui-color-swatch')) closePicker(); });
    const help = document.createElement('p'); help.className = 'ui-color-help'; help.setAttribute('role', 'status'); help.setAttribute('aria-live', 'polite');
    const defaultHelp = '输入 HEX，点击色块选色，或使用右侧拾色器。';
    help.textContent = defaultHelp; row.after(help);
    const fields = nativeInputs.map((native, index) => {
      const field = document.createElement('div'); field.className = 'ui-color-field';
      const number = document.createElement('span'); number.className = 'ui-color-index'; number.textContent = String(index + 1).padStart(2, '0');
      const hexGroup = document.createElement('label'); hexGroup.className = 'ui-hex-control';
      const format = document.createElement('span'); format.className = 'ui-hex-format'; format.textContent = 'HEX';
      const hex = document.createElement('input'); hex.type = 'text'; hex.maxLength = 7; hex.spellcheck = false; hex.autocomplete = 'off'; hex.setAttribute('aria-label', '颜色 ' + (index + 1) + ' HEX');
      const swatch = document.createElement('button'); swatch.type = 'button'; swatch.className = 'ui-color-swatch'; swatch.setAttribute('aria-label', '选择颜色 ' + (index + 1)); swatch.setAttribute('aria-expanded', 'false'); swatch.setAttribute('aria-haspopup', 'dialog');
      native.hidden = true;
      const eye = document.createElement('button'); eye.type = 'button'; eye.className = 'ui-color-eyedropper'; eye.setAttribute('aria-label', '吸取颜色 ' + (index + 1)); eye.title = '从屏幕吸取颜色';
      eye.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 4 6 6m-3-9 6 6-3 3-1-1-10 10-5 1 1-5L15 5l-1-1z"/></svg>';
      eye.disabled = typeof window.EyeDropper !== 'function';
      if (eye.disabled) eye.title = '当前浏览器不支持屏幕拾色，请点击色块选色';
      const sync = (updatePicker = true) => {
        hex.value = native.value.slice(1).toUpperCase(); hex.removeAttribute('aria-invalid'); swatch.style.setProperty('--swatch', native.value);
        if (updatePicker && active?.native === native && !picker.hidden) { hsv = hexToHsv(native.value); paintPicker(); }
      };
      const apply = (showError = false) => {
        const value = normalizeHex(hex.value);
        hex.setAttribute('aria-invalid', String(!value));
        if (!value) { if (showError) { help.textContent = '颜色 ' + (index + 1) + '：请输入 3 位或 6 位 HEX。'; help.dataset.error = 'true'; } return false; }
        native.value = value; swatch.style.setProperty('--swatch', value);
        if (active?.native === native && !picker.hidden) { hsv = hexToHsv(value); paintPicker(); }
        help.textContent = defaultHelp; help.dataset.error = 'false'; return true;
      };
      native.addEventListener('input', () => { sync(); help.textContent = defaultHelp; help.dataset.error = 'false'; });
      hex.addEventListener('input', () => apply(false));
      hex.addEventListener('blur', () => { if (apply(true)) sync(); });
      eye.addEventListener('click', async () => {
        if (eye.disabled) return;
        eye.disabled = true;
        try { const picked = await new window.EyeDropper().open(); native.value = picked.sRGBHex; sync(); help.textContent = defaultHelp; help.dataset.error = 'false'; }
        catch (error) { if (error.name !== 'AbortError') { help.textContent = '拾色未完成，可点击色块选色。'; help.dataset.error = 'true'; } }
        finally { eye.disabled = false; }
      });
      swatch.addEventListener('click', () => {
        if (active?.native === native && !picker.hidden) { closePicker(); return; }
        closePicker(); active = { native, hex, swatch, sync, apply }; hsv = hexToHsv(native.value);
        picker.querySelector('strong').textContent = '颜色 ' + (index + 1); picker.hidden = false; swatch.setAttribute('aria-expanded', 'true'); paintPicker();
        const rect = swatch.getBoundingClientRect(), panel = picker.getBoundingClientRect();
        picker.style.left = Math.max(12, Math.min(rect.right + 10, window.innerWidth - panel.width - 12)) + 'px';
        picker.style.top = Math.max(12, Math.min(rect.top, window.innerHeight - panel.height - 12)) + 'px';
        square.focus();
      });
      hexGroup.append(format, hex); field.append(number, native, swatch, hexGroup, eye); row.append(field); sync();
      return { hex, sync, apply };
    });
    row.previousElementSibling.textContent = '颜色';
    modal.querySelector('[data-save]').addEventListener('click', event => {
      const invalid = fields.find(field => !field.apply(true));
      if (invalid) { event.preventDefault(); event.stopImmediatePropagation(); invalid.hex.focus(); }
    }, true);
    new MutationObserver(() => { closePicker(); if (modal.classList.contains('open')) { fields.forEach(field => field.sync()); help.textContent = defaultHelp; help.dataset.error = 'false'; } }).observe(modal, { attributes:true, attributeFilter:['class'] });
  }
  let scheduled = false;
  function hydrate() {
    scheduled = false;
    const groups = [...document.querySelectorAll('#slidePanel .content-group')];
    groups.forEach((group, index) => {
      const heading = group.querySelector(':scope > .group-head h3, :scope > h3');
      if (!heading) return;
      const title = heading.dataset.uiOriginalTitle || heading.textContent.trim();
      heading.dataset.uiOriginalTitle = title;
      group.dataset.uiSection = names.get(title) || 'other';
      if (!heading.querySelector('.ui-section-number')) {
        const number = document.createElement('span'); number.className = 'ui-section-number';
        number.textContent = String(index + 1).padStart(2, '0'); number.setAttribute('aria-hidden', 'true');
        heading.prepend(number);
      }
    });
    document.querySelectorAll('.palette-grid > .card-option').forEach(card => {
      card.classList.add('palette-card');
      if (card.classList.contains('custom-palette-card')) {
        let actions = card.querySelector('.palette-custom-actions');
        if (!actions) {
          actions = document.createElement('div'); actions.className = 'palette-custom-actions';
          actions.append(...card.querySelectorAll(':scope > button')); card.append(actions);
        }
        const use = actions.querySelector('.custom-palette-action');
        if (use?.getAttribute('aria-label') === '使用此色系') {
          const selected = card.classList.contains('selected');
          use.textContent = selected ? '已选' : '使用'; use.setAttribute('aria-pressed', String(selected));
        }
      }
      const heading = card.querySelector('h4');
      const shortLabels = new Map([['深色中性色与暗红点缀', '深灰 · 暗红'], ['深灰与冷灰蓝', '深灰 · 灰蓝'], ['黑白灰对比', '黑白灰'], ['碳黑、蓝与少量紫', '碳黑 · 蓝紫']]);
      if (heading && !heading.dataset.uiPaletteTitle) heading.dataset.uiPaletteTitle = heading.title || heading.textContent.trim();
      if (heading && shortLabels.has(heading.textContent)) { heading.title = heading.textContent; heading.textContent = shortLabels.get(heading.textContent); }
      const description = card.querySelector('p');
      if (description) {
        if (!description.dataset.uiOriginalDescription) description.dataset.uiOriginalDescription = description.textContent;
        const full = description.dataset.uiOriginalDescription;
        description.title = full.replace(/^(暗色系|亮色系)\s*\|\s*/, '');
        const brief = paletteDescriptions.get(heading?.dataset.uiPaletteTitle) || (heading?.textContent === '自定义色系' && !card.querySelector('.swatches') ? '自定颜色与说明' : description.title);
        if (description.textContent !== brief) description.textContent = brief;
      }
    });
    document.querySelector('#globalPanel .global-grid > div:nth-child(2) > p')?.remove();
    document.querySelectorAll('#contentHandlingControl :is(.choice,.radio-choice)').forEach(choice => {
      const title = choice.querySelector('strong')?.textContent;
      const description = choice.querySelector('span');
      if (!description) return;
      if (!description.title) description.title = description.textContent;
      const brief = title === '严格保留原文' ? '不改写、不删减' : '提炼表达，保留关键事实';
      if (description.textContent !== brief) description.textContent = brief;
    });
    const globalNotes = document.getElementById('globalNotes');
    if (globalNotes) globalNotes.placeholder = '补充跨页通用要求（可选）';
    document.querySelectorAll('.raw-sync-status').forEach(enhanceMaterialStatus);
    document.querySelectorAll('#slideNav .nav-index').forEach(number => number.classList.add('nav-num'));
    document.querySelectorAll('button.choice,button.mode-card,button.visual-card,button.card-option,button.toggle-option,button.category-tab').forEach(button => {
      button.setAttribute('aria-pressed', String(button.classList.contains('selected')));
    });
    document.querySelectorAll('.group-head > .hint,.mode-card > p,.visual-card > p,.choice > span,.palette-card > p').forEach(node => {
      if (!node.title) node.title = node.textContent.trim();
    });
    document.querySelectorAll('.page-flow-status').forEach(node => {
      const text = node.textContent;
      node.dataset.uiTone = /已采用/.test(text) ? 'success' : /失败|错误|过期/.test(text) ? 'error' : /重审|待同步/.test(text) ? 'warning' : 'info';
    });
  }
  const schedule = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(hydrate); } };
  // Observe render replacements only; hydration's attribute updates do not retrigger the observer.
  const observer = new MutationObserver(records => { if (records.some(record => [...record.addedNodes].some(node => node.nodeType === 1 && !node.classList?.contains('ui-section-number')))) schedule(); });
  for (const id of ['globalPanel', 'slidePanel', 'slideNav']) {
    const node = document.getElementById(id);
    if (node) observer.observe(node, { childList: true, subtree: true });
  }
  const header = document.querySelector('header h1');
  if (header) {
    const badge = document.createElement('span'); badge.className = 'ui-preview-label'; badge.textContent = '视觉重构 V2'; header.before(badge);
  }
  const actions = document.querySelector('header .top-actions');
  const spec = document.createElement('button'); spec.type = 'button'; spec.className = 'ui-utility-link'; spec.textContent = '设计规范';
  const original = document.createElement('a'); original.className = 'ui-utility-link'; original.textContent = '打开原版'; original.target = '_blank'; original.rel = 'noopener';
  fetch('visual-v2-config.json').then(response => response.json()).then(config => { original.href = config.originalUrl; }).catch(() => { original.href = 'http://127.0.0.1:4189/'; });
  actions?.prepend(spec, original);
  const dialog = document.createElement('dialog'); dialog.className = 'ui-spec-dialog';
  dialog.setAttribute('aria-labelledby', 'ui-spec-title');
  dialog.innerHTML = '<button type="button" class="ui-spec-close" aria-label="关闭设计规范">×</button><h2 id="ui-spec-title">决策板 · 视觉规范 V2</h2><p>页面背景与白色前景明确分层；文字按标题、正文、解释和注释分配实际色值。颜色集中用于同步、生成和配色参考等功能区域。</p><h3>布局与层级</h3><ul><li>全局策略在上；下方保留独立滚动的页签栏和当前页决策区。</li><li>顶层模块：白底、深色加粗标题和清晰边界；子模块：浅中性底板，保留原父子关系。</li><li>图示选项使用统一图片区域，按原始 16:9 比例完整显示；文件路径与辅助信息降低权重。</li></ul><h3>基础规格</h3><table><tr><th>项目</th><th>规范</th></tr><tr><td>文字</td><td>正文 14–15px，选项 13–14px，辅助信息 12px，模块标题 16px，当前页标题 26px</td></tr><tr><td>间距</td><td>4 / 8 / 12 / 16 / 24px；主要控件 32px，次级控件 24–28px</td></tr><tr><td>色彩</td><td>背景 #E8EDF4，卡片白色；同步区浅绿、生成区浅蓝、参考图区与其他子模块同底色；蓝色表示选中</td></tr><tr><td>边框与圆角</td><td>1px 轻边框；控件 6px，子模块 8px，主卡 10–12px</td></tr></table><h3>文字色阶</h3><table><tr><th>角色</th><th>规范</th></tr><tr><td>标题</td><td>#161616，600 字重；白底对比度 18.1:1</td></tr><tr><td>正文</td><td>#262626，400–500 字重；白底对比度 15.1:1</td></tr><tr><td>说明</td><td>#525252；白底对比度 7.8:1</td></tr><tr><td>注释</td><td>#667085，至少 12px；白底对比度约 5.0:1</td></tr></table><h3>状态</h3><ul><li>悬停：蓝边或轻底色；选中：浅蓝底、蓝边，图示选项补充勾选标识。</li><li>聚焦：可见的蓝色轮廓；禁用：灰底灰字，并保留原有原因提示。</li><li>处理中：沿用等待/加载状态；错误为红色，需同步/重审为黄色，已采用为绿色。</li><li>空状态保持短小；生成图片保持 16:9 和历史版本入口。</li></ul><p>文字与控件参考 Ant Design，前景与背景分层参考 IBM Carbon。功能色不替代正文对比度，完整规范见随附文档。</p>';
  document.body.append(dialog);
  spec.addEventListener('click', () => dialog.showModal());
  dialog.querySelector('.ui-spec-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
  document.addEventListener('page-flow-ready', schedule);
  new MutationObserver(enhancePaletteModal).observe(document.body, { childList:true });
  enhancePaletteModal();
  hydrate();
})();
