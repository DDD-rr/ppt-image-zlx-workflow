export function extractedSourceBody(value) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('截图识别结果不能为空。');
  const markdown = value.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim();
  if (Buffer.byteLength(markdown, 'utf8') > 96 * 1024) throw new Error('截图识别结果超过单页保存限制。');
  if (/^#{1,6}\s*(?:第\s*\d+\s*页|slide\s*\d+|page\s*\d+|p\s*\d+)(?:[ \t｜|:：]|$)/im.test(markdown)) throw new Error('识别结果只应包含本页内容，不应包含页面编号标记。');
  return /^###\s+页面内容\s*$/m.test(markdown) ? markdown : '### 页面内容\n\n' + markdown;
}

export function extractedSourceRaw(page, markdown) {
  const match = /^slide0*(\d+)$/i.exec(page.id);
  if (!match) throw new Error('截图页面编号无效。');
  return `## 第 ${Number(match[1])} 页｜${page.title}\n\n${extractedSourceBody(markdown)}`;
}
