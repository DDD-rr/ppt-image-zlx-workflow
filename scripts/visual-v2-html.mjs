export const visualV2ExtractionBridge = `        syncScreenshotExtraction: (pageId, extraction) => {
          if (!extraction?.raw || rawDirty.has(pageId)) return;
          const slide = slides.find(item => item.id === pageId);
          if (slide) slide.screenshotExtraction = extraction;
          if (!slide || !state.slides[pageId] || slide.raw === extraction.raw && state.raw_materials[pageId] === extraction.raw) return;
          slide.raw = extraction.raw;
          state.raw_materials[pageId] = extraction.raw;
          sourcePages[pageId] = {raw:extraction.raw,pageHash:extraction.pageHash,outOfSync:false};
          sourceFeedback[pageId] = '截图内容已提取，可在预览和 Markdown 中查看。';
          if (state.active === pageId) renderAll(false);
        },
`;


export const visualV2BridgeExtension = `        removeAllRealImages: () => {
          if (pendingUploads) throw new Error('图片正在保存，请稍后移除。');
          const page = state.slides[state.active];
          const count = Object.values(page.real_images || {}).reduce((sum, items) => sum + items.length, 0);
          if (!count) return 0;
          for (const key of Object.keys(page.real_images)) page.real_images[key] = [];
          page.real_image_links = {};
          page.checked = false; page._checked_signature = null;
          renderAll(false);
          return count;
        },
`;

export const visualV2StableRender = `    let v2RenderedPage, v2GlobalSignature, v2SourceSignature;
    function renderAll(scrollSlide) {
      const samePage = !scrollSlide && v2RenderedPage === state.active;
      const slide = slides.find(item => item.id === state.active);
      const pageState = state.slides[state.active];
      const { active, slides: pageStates, raw_materials, ...globalFields } = state;
      const globalSignature = JSON.stringify(globalFields);
      const sourceKey = () => JSON.stringify([slide.raw, sourcePages[slide.id]?.raw, sourceFeedback[slide.id], sourceFilePath, sourceDocumentAvailable, rawDirty.has(slide.id), pageState.source_mode, pageState.source_images, pageState.source_image_notes]);
      const sourceSignature = sourceKey();
      const gallery = samePage ? document.querySelector('#slidePanel .generated-image-group') : null;
      const source = samePage ? document.querySelector('#slidePanel .raw-material-group') : null;
      const stableScrolls = [gallery?.querySelector('.generated-image-rail'),source?.querySelector('.raw-preview'),source?.querySelector('.raw-editor'),source?.querySelector('.raw-editor-highlight')].filter(Boolean).map(node => ({node,top:node.scrollTop,left:node.scrollLeft}));
      const pageScroll = samePage ? window.scrollY : null;
      const keepSource = source && sourceSignature === v2SourceSignature;
      const editor = source?.querySelector('.raw-editor');
      const editing = source?.querySelector('.raw-editor-wrap')?.style.display === 'block';
      const editorView = editor ? { start:editor.selectionStart, end:editor.selectionEnd, top:editor.scrollTop, height:source.querySelector('.raw-editor-wrap').style.height } : null;
      if (!samePage || globalSignature !== v2GlobalSignature) renderGlobal();
      if (!samePage) renderNav();
      renderGlobalSummary();
      renderSlide(scrollSlide);
      if (gallery) document.querySelector('#slidePanel .generated-image-group').replaceWith(gallery);
      if (keepSource) document.querySelector('#slidePanel .raw-material-group').replaceWith(source);
      else if (source && editing && pageState.source_mode !== 'images') {
        const nextSource = document.querySelector('#slidePanel .raw-material-group');
        nextSource.querySelectorAll('.raw-tab')[1].click();
        const nextEditor = nextSource.querySelector('.raw-editor');
        nextEditor.setSelectionRange(editorView.start, editorView.end);
        nextEditor.scrollTop = editorView.top;
        if (editorView.height) nextSource.querySelector('.raw-editor-wrap').style.height = editorView.height;
      }
      for (const item of stableScrolls) if (item.node.isConnected) { item.node.scrollTop=item.top; item.node.scrollLeft=item.left; }
      if (pageScroll !== null) window.scrollTo({top:pageScroll,behavior:'instant'});
      decorateHeadings();
      updateOutput(false);
      v2RenderedPage = state.active; v2GlobalSignature = globalSignature; v2SourceSignature = sourceKey();
      document.dispatchEvent(new Event('page-decision-changed'));
    }`;

export function prepareVisualV2Html(html) {
  html = html.replace(/if \(!initial\) \{\r?\n          state\.slides\[slide\.id\]\.source_mode = images \? 'images' : 'markdown';/, match => match.replace('if (!initial)', "if (!initial && !(mode === 'preview' && state.slides[slide.id].source_mode === 'images' && slide.screenshotExtraction))"));
  html = html.replace(": '当前使用 Markdown 材料'; status.dataset.state=", ": state.slides[slide.id].source_mode === 'images' ? '截图内容已提取，当前生成仍使用截图。' : '当前使用 Markdown 材料'; status.dataset.state=");
  if (!html.includes('syncScreenshotExtraction:')) {
    html = html.replace(/^[ \t]*refreshCandidateNav:.*$/m, match => visualV2ExtractionBridge + match);
  }
  html = html.replace('slides.forEach((slide, index) => {', 'slides.filter(slide => !slide.deletedAt).forEach((slide, index) => {');
  html = html.replace('const nextIndex = slides.findIndex(item => item.id === slide.id) + 1;', 'const nextIndex = slides.findIndex((item,index) => index > slides.findIndex(current => current.id === slide.id) && !item.deletedAt);');
  html = html.replace('next.disabled = nextIndex >= slides.length;', 'next.disabled = nextIndex < 0 || nextIndex >= slides.length;');
  html = html.replace("if (!state.slides[state.active]) state.active = slides[0].id;", "if (!state.slides[state.active] || slides.find(slide => slide.id === state.active)?.deletedAt) state.active = slides.find(slide => !slide.deletedAt)?.id || slides[0].id;");
  html = html.replace("const panel = document.getElementById('slidePanel');\n      panel.innerHTML", "const panel = document.getElementById('slidePanel');\n      if (slide.deletedAt) { panel.innerHTML = '<section class=\"panel\"><h2>页面已移入回收站</h2><p>点击左侧审阅进度旁的回收站按钮恢复页面。</p></section>'; return; }\n      panel.innerHTML");
  html = html.replace("const panel = document.getElementById('slidePanel');\r\n      panel.innerHTML", "const panel = document.getElementById('slidePanel');\r\n      if (slide.deletedAt) { panel.innerHTML = '<section class=\"panel\"><h2>页面已移入回收站</h2><p>点击左侧审阅进度旁的回收站按钮恢复页面。</p></section>'; return; }\r\n      panel.innerHTML");
  html = html.replace(".find(item => ids.includes(item.id));", ".find(item => !item.deletedAt && ids.includes(item.id));");
  if (!html.includes('managePages:')) {
    html = html.replace(/^[ \t]*refreshCandidateNav:.*$/m, match => `        managePages: async (action, id, title) => {
          if (pendingUploads || rawDirty.size) throw new Error('请先保存材料并等待图片上传完成。');
          clearTimeout(draftTimer); await draftQueue.catch(() => {});
          const response = await fetch('/api/pages', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,id,title,state})});
          const result = await response.json(); if (!response.ok) throw new Error(result.error);
          location.reload();
        },
        pageList: () => slides.map(slide => ({id:slide.id,title:slide.title,hidden:!!slide.hidden})),
        tableChoice: value => {
          const slide = slides.find(item => item.id === state.active), page = state.slides[state.active];
          if (value) { page.review_answers ||= {}; page.review_answers.table_presentation = value; page.table_presentation = value; renderAll(false); }
          return {raw:slide.raw,mode:page.source_mode,value:page.table_presentation || page.review_answers?.table_presentation};
        },
` + match);
  }
  html = html.replace('pageList: () => slides.map(slide => ({id:slide.id,title:slide.title,hidden:!!slide.hidden})),', 'pageList: () => slides.filter(slide => !slide.deletedAt).map(slide => ({id:slide.id,title:slide.title,hidden:!!slide.hidden})),\n        recycleList: () => slides.filter(slide => slide.deletedAt).map(slide => ({id:slide.id,title:slide.title,label:slide.label,deletedAt:slide.deletedAt})),');
  html = html.replace(/^[ \t]*if \([^\r\n]*\) alert\('所选内容含数字或限定信息。请在生成后重点核对这些信息是否准确保留。'\);\r?\n/gm, '');
  if (!html.includes('removeAllRealImages:')) {
    const anchor = /^[ \t]*refreshCandidateNav:.*$/m;
    if (!anchor.test(html)) throw new Error('找不到逐页板接口，不能安全添加 V2 素材操作。');
    html = html.replace(anchor, match => visualV2BridgeExtension + match);
  }
  if (!html.includes('let v2RenderedPage,')) {
    const renderer = /    function renderAll\(scrollSlide\) \{\r?\n      renderGlobal\(\);\r?\n      renderNav\(\);\r?\n      renderGlobalSummary\(\);\r?\n      renderSlide\(scrollSlide\);\r?\n      decorateHeadings\(\);\r?\n      updateOutput\(false\);\r?\n    \}/;
    if (!renderer.test(html)) throw new Error('找不到原有渲染入口，未修改页面。');
    html = html.replace(renderer, visualV2StableRender);
    html = html.replace('if (imageListFingerprints.get(slide.id) === fingerprint) return;', 'if (wrap.dataset.imageListFingerprint === fingerprint) return;\n        wrap.dataset.imageListFingerprint = fingerprint;');
  }
  return html;
}
