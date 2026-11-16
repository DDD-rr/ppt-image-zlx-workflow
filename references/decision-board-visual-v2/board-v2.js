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
  const uiIcons = {
    copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/>',
    trash:'<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
    locate:'<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>',
    arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>'
  };
  const iconSvg = name => '<svg viewBox="0 0 24 24" aria-hidden="true">' + uiIcons[name] + '</svg>';
  const handIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 13V5a1.5 1.5 0 0 1 3 0v6-8a1.5 1.5 0 0 1 3 0v8-6a1.5 1.5 0 0 1 3 0v7-4a1.5 1.5 0 0 1 3 0v8c0 4-3 6-6 6h-1c-2 0-4-1-5-3l-4-6a1.6 1.6 0 0 1 2.5-2L8 13Z"/></svg>';
  let pageMenu;
  let recycleMenu;
  function enhanceRecycleBin(bridge) {
    const heading=document.querySelector('.ui-progress-heading');
    if(!heading || !bridge.recycleList || heading.querySelector('.ui-recycle-button')) return;
    const button=document.createElement('button');button.type='button';button.className='ui-icon-button ui-recycle-button';button.innerHTML=iconSvg('trash');button.title='回收站';button.setAttribute('aria-label','回收站');button.setAttribute('aria-expanded','false');button.setAttribute('aria-haspopup','dialog');
    const count=bridge.recycleList().length;if(count)button.title='回收站（'+count+' 页）';
    heading.insertBefore(button,heading.querySelector('.ui-locate-current'));
    button.onclick=()=>{
      if(recycleMenu?.isConnected){recycleMenu.remove();button.setAttribute('aria-expanded','false');return;}
      recycleMenu=document.createElement('section');recycleMenu.className='ui-recycle-menu';recycleMenu.setAttribute('role','dialog');recycleMenu.setAttribute('aria-label','已删除页面');
      const title=document.createElement('strong');title.textContent='回收站 · '+bridge.recycleList().length+' 页';recycleMenu.append(title);
      const list=document.createElement('div');list.className='ui-recycle-list';
      for(const page of bridge.recycleList()){
        const row=document.createElement('div');row.className='ui-recycle-row';const info=document.createElement('div');const name=document.createElement('strong');name.textContent=page.title;const detail=document.createElement('span');detail.textContent=page.label+' · 删除于 '+new Date(page.deletedAt).toLocaleString();info.append(name,detail);
        const restore=document.createElement('button');restore.type='button';restore.textContent='恢复';restore.setAttribute('aria-label','恢复 '+page.title);restore.onclick=async()=>{restore.disabled=true;try{await bridge.managePages('restore',page.id);}catch(error){restore.disabled=false;status.textContent=error.message;}};row.append(info,restore);list.append(row);
      }
      if(!list.children.length){const empty=document.createElement('p');empty.textContent='回收站为空';list.append(empty);}
      const status=document.createElement('p');status.setAttribute('role','status');recycleMenu.append(list,status);document.body.append(recycleMenu);const rect=button.getBoundingClientRect();recycleMenu.style.left=Math.max(8,Math.min(rect.left,window.innerWidth-390))+'px';recycleMenu.style.top=Math.min(rect.bottom+8,window.innerHeight-250)+'px';button.setAttribute('aria-expanded','true');
    };
  }
  function enhancePageManagement() {
    const bridge = window.__PAGE_FLOW_BRIDGE__;
    if (!bridge?.pageList) return;
    enhanceRecycleBin(bridge);
    document.querySelectorAll('.ui-page-marker[data-mark="manual"]').forEach(button => {
      if (!button.dataset.handIcon) { button.innerHTML = handIcon; button.dataset.handIcon = 'true'; }
    });
    const pages = bridge.pageList();
    document.querySelectorAll('#slideNav .nav-button').forEach((button,index) => {
      const page = pages[index]; if (!page) return;
      button.classList.toggle('ui-page-hidden',page.hidden);
      if (page.hidden && !button.querySelector('.ui-hidden-label')) { const label = document.createElement('span'); label.className='ui-hidden-label'; label.textContent='已隐藏'; button.append(label); }
      if (button.dataset.pageMenu) return;
      button.dataset.pageMenu='true';
      const open = event => {
        event.preventDefault(); pageMenu?.remove();
        pageMenu = document.createElement('div'); pageMenu.className='ui-page-menu'; pageMenu.setAttribute('role','menu');
        const act = async (action,title) => { try { await bridge.managePages(action,page.id,title); } catch(error) { alert(error.message); } };
        for (const [label,run] of [
          ['新增下一页',() => {
            const dialog=document.createElement('dialog'); dialog.className='ui-create-page';
            dialog.innerHTML='<form><h2>新增页面</h2><p>新页面将插入所选页的下一页。</p><label>页面名称 <span>必填</span><input name="title" required maxlength="100" autocomplete="off" placeholder="输入页面名称"></label><div><button type="button" data-cancel>取消</button><button type="submit">创建页面</button></div><p role="status"></p></form>';
            document.body.append(dialog); dialog.querySelector('[data-cancel]').onclick=()=>dialog.close(); dialog.addEventListener('close',()=>dialog.remove());
            dialog.querySelector('form').onsubmit=async e=>{e.preventDefault();const input=dialog.querySelector('input');if(!input.value.trim()){input.setCustomValidity('请输入页面名称');input.reportValidity();return;}input.setCustomValidity('');const submit=dialog.querySelector('[type="submit"]');submit.disabled=true;try{await bridge.managePages('create',page.id,input.value.trim());}catch(error){dialog.querySelector('[role="status"]').textContent=error.message;submit.disabled=false;}};
            dialog.querySelector('input').oninput=e=>e.target.setCustomValidity('');dialog.showModal();
          }],
          [page.hidden?'取消隐藏':'隐藏所选页',()=>act('hide')],
          ['删除页',()=>act('delete')],
          ['重命名',() => {
            const label=button.querySelector('.nav-title'); const input=document.createElement('input');input.className='ui-page-rename';input.value=page.title;input.maxLength=100;input.setAttribute('aria-label','页面名称');label.replaceWith(input);input.focus();input.select();let done=false;
            const finish=async save=>{if(done)return;if(save&&!input.value.trim()){input.setCustomValidity('请输入页面名称');input.reportValidity();return;}done=true;if(save&&input.value.trim()!==page.title) await act('rename',input.value.trim());if(input.isConnected)input.replaceWith(label);};
            input.onclick=e=>e.stopPropagation();input.oninput=()=>input.setCustomValidity('');input.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter'){e.preventDefault();finish(true);}if(e.key==='Escape'){e.preventDefault();finish(false);}};input.onblur=()=>finish(true);
          }]
        ]) {const item=document.createElement('button');item.type='button';item.setAttribute('role','menuitem');item.textContent=label;item.onclick=()=>{pageMenu.remove();run();};pageMenu.append(item);}
        document.body.append(pageMenu);const rect=button.getBoundingClientRect();pageMenu.style.left=Math.min(event.clientX||rect.right,window.innerWidth-190)+'px';pageMenu.style.top=Math.max(8,Math.min(event.clientY||rect.top,window.innerHeight-pageMenu.offsetHeight-8))+'px';pageMenu.querySelector('button').focus();
      };
      button.addEventListener('contextmenu',open);button.addEventListener('keydown',event=>{if(event.key==='ContextMenu'||event.shiftKey&&event.key==='F10')open(event);});
    });
    const info=bridge.tableChoice();
    const review=document.querySelector('[data-ui-section="review"]');
    if(review && !review.querySelector('.ui-table-question') && info.mode!=='images' && (/<table\b/i.test(info.raw)||/^\s*\|?.+\|.+\n\s*\|?\s*:?-{3,}/m.test(info.raw))) {
      review.querySelector('.no-review-questions')?.remove();
      const card=document.createElement('div');card.className='question-card ui-table-question';const heading=document.createElement('h3');heading.textContent='检测到有表格，希望如何呈现？';card.append(heading);
      const options=document.createElement('div');options.className='ui-table-options';
      for(const [value,label,detail] of [['flat-graphic','偏平面化','以图形化信息版面呈现，结合主题设计底板、表头与分组，不嵌入场景实体。'],['physical-object-integration','偏场景化','将表格融入符合主题的屏幕、展板等实体载体，协调材质、光线与透视，保持数据清晰。']]) {const option=document.createElement('button');option.type='button';option.className='radio-choice'+(info.value===value?' selected':'');option.setAttribute('aria-pressed',String(info.value===value));option.title=detail+' 两种方式均保留原始数据、顺序与行列对应关系。';option.textContent=label;option.onclick=()=>bridge.tableChoice(value);options.append(option);}
      card.append(options);review.append(card);
    }
  }
  document.addEventListener('pointerdown',event=>{if(pageMenu&&!pageMenu.contains(event.target))pageMenu.remove();});
  const closeRecycle=()=>{recycleMenu?.remove();document.querySelector('.ui-recycle-button')?.setAttribute('aria-expanded','false');};
  document.addEventListener('pointerdown',event=>{if(recycleMenu&&!recycleMenu.contains(event.target)&&!event.target.closest('.ui-recycle-button'))closeRecycle();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeRecycle();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')pageMenu?.remove();});
  window.addEventListener('scroll',()=>pageMenu?.remove(),true);
  window.addEventListener('scroll',event=>{if(!event.target.closest?.('.ui-recycle-menu'))closeRecycle();},true);
  function locateCurrentPage() {
    const nav = document.getElementById('slideNav');
    const current = nav?.querySelector('.nav-button.active');
    if (!current) return;
    const frame = nav.getBoundingClientRect(), row = current.getBoundingClientRect();
    const visibleTop = Math.max(0,frame.top+nav.clientTop);
    const visibleBottom = Math.min(window.innerHeight-8,frame.top+nav.clientTop+nav.clientHeight);
    const center = visibleBottom > visibleTop ? (visibleTop+visibleBottom)/2 : frame.top+nav.clientTop+nav.clientHeight/2;
    const top = nav.scrollTop + row.top + row.height / 2 - center;
    nav.scrollTo({top:Math.max(0,Math.min(top,nav.scrollHeight-nav.clientHeight)),behavior:'instant'});
  }
  let locateFrame = 0;
  const queueLocateCurrentPage = () => {
    if (locateFrame) return;
    locateFrame = requestAnimationFrame(() => { locateFrame = 0; locateCurrentPage(); });
  };
  function enhanceNavigationShortcuts() {
    const heading = document.getElementById('slideNav')?.closest('.panel')?.querySelector('h3');
    if (heading && !heading.querySelector('.ui-locate-current')) {
      heading.classList.add('ui-progress-heading');
      const locate = document.createElement('button'); locate.type = 'button'; locate.className = 'ui-icon-button ui-locate-current';
      locate.innerHTML = iconSvg('locate'); locate.title = '定位当前页'; locate.setAttribute('aria-label','定位当前页');
      locate.addEventListener('click',queueLocateCurrentPage); heading.append(locate);
    }
    document.querySelectorAll('.raw-mark-item').forEach(row => {
      const mode = row.querySelector('.raw-mark-mode');
      const imageLink = mode?.textContent === '图片连接' || row.querySelector('.raw-mark-remove')?.getAttribute('aria-label')?.startsWith('移除图片连接：');
      if (!imageLink || row.querySelector('.ui-image-link-jump')) return;
      const jump = document.createElement('button'); jump.type = 'button'; jump.className = 'ui-image-link-jump';
      jump.innerHTML = '<span>前往真实图片</span>' + iconSvg('arrow'); jump.title = '跳到本页真实素材，为图片选择对应文字';
      jump.addEventListener('click', () => {
        const target = document.querySelector('#slidePanel .asset-zone')?.closest('.content-group');
        if (!target) return;
        const headerHeight = document.querySelector('body > header')?.getBoundingClientRect().height || 64;
        window.scrollTo({top:Math.max(0,window.scrollY+target.getBoundingClientRect().top-headerHeight-16),behavior:'smooth'});
        target.classList.add('ui-jump-highlight');
        setTimeout(() => target.classList.remove('ui-jump-highlight'),1200);
      });
      mode.before(jump);
    });
  }
  document.addEventListener('click',event => {
    const control = event.target.closest?.('button,select,summary,.asset-file-picker');
    if (control && (control.closest('#slidePanel,#slideNav') || control.matches('.page-flow-bottom-link,#saveJson'))) queueLocateCurrentPage();
  },true);
  document.addEventListener('page-decision-changed',queueLocateCurrentPage);
  document.addEventListener('page-action-complete',queueLocateCurrentPage);
  function enhanceMaterialActions() {
    document.querySelectorAll('.raw-head-tools').forEach(tools => {
      if (tools.querySelector('.ui-copy-source-path')) return;
      const copy = document.createElement('button'); copy.type = 'button'; copy.className = 'ui-icon-button ui-copy-source-path';
      copy.innerHTML = iconSvg('copy'); copy.title = '复制材料路径'; copy.setAttribute('aria-label', '复制材料路径');
      copy.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(tools.querySelector('.raw-file-details').textContent.trim());
          copy.title = '已复制'; copy.setAttribute('aria-label', '路径已复制');
          setTimeout(() => { if (copy.isConnected) { copy.title = '复制材料路径'; copy.setAttribute('aria-label', '复制材料路径'); } }, 1500);
        } catch { copy.title = '复制失败，请选中右侧路径复制'; }
      });
      tools.prepend(copy);
    });
    document.querySelectorAll('.asset-record-remove').forEach(remove => {
      if (remove.querySelector('svg')) return;
      remove.innerHTML = iconSvg('trash'); remove.title = remove.getAttribute('aria-label') || '移除图片'; remove.classList.add('ui-icon-button');
    });
    const zones = [...document.querySelectorAll('.asset-zone')];
    const first = zones[0];
    if (!first || !document.querySelector('.asset-record') || first.querySelector('.ui-remove-all-images')) return;
    const hint = first.querySelector('.asset-link-hint');
    const footer = document.createElement('div'); footer.className = 'ui-asset-footer'; hint.before(footer); footer.append(hint);
    const removeAll = document.createElement('button'); removeAll.type = 'button'; removeAll.className = 'ui-remove-all-images';
    removeAll.innerHTML = iconSvg('trash') + '<span>移除全部</span>'; removeAll.title = '移除本页全部真实图片及其图片连接，保留原文标记'; removeAll.setAttribute('aria-label', '移除本页全部真实图片');
    removeAll.addEventListener('click', () => {
      try { window.__PAGE_FLOW_BRIDGE__.removeAllRealImages(); document.dispatchEvent(new Event('page-source-changed')); }
      catch (error) { removeAll.title = error.message; }
    });
    footer.append(removeAll);
  }
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
    enhanceMaterialActions();
    enhanceNavigationShortcuts();
    enhancePageManagement();
    document.querySelectorAll('#slideNav .nav-index').forEach(number => number.classList.add('nav-num'));
    document.querySelectorAll('button.choice,button.mode-card,button.visual-card,button.card-option,button.toggle-option,button.category-tab').forEach(button => {
      button.setAttribute('aria-pressed', String(button.classList.contains('selected')));
    });
    document.querySelectorAll('.group-head > .hint,.mode-card > p,.visual-card > p,.choice > span,.palette-card > p').forEach(node => {
      if (!node.title) node.title = node.textContent.trim();
    });
    document.querySelectorAll('.page-flow-status').forEach(node => {
      const text = node.textContent;
      node.dataset.uiTone = /已采用|手动制作/.test(text) ? 'success' : /失败|错误|过期/.test(text) ? 'error' : /重审|待同步|材料待处理|已中止/.test(text) ? 'warning' : 'info';
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
    const badge = document.createElement('span'); badge.className = 'ui-preview-label'; badge.textContent = '默认决策板 V2'; header.before(badge);
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
