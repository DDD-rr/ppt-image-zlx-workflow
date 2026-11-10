import { spawn } from 'node:child_process';
import { readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [action, project] = process.argv.slice(2);
if (!['start', 'wait', 'status', 'stop'].includes(action) || !project) throw new Error('Usage: node sequential-board-control.mjs start|wait|status|stop <project-path>');
const root = path.resolve(project, 'decision_board_sequential');
const ready = path.join(root, '.review-server.json');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function info() {
  try {
    const i = JSON.parse(await readFile(ready, 'utf8'));
    const res = await fetch(`http://127.0.0.1:${i.port}/api/status`, { signal: AbortSignal.timeout(1500) });
    const status = await res.json();
    return status.service === 'ppt-image-review-v4' && status.root === root && status.session === i.session ? { ...i, ...status } : null;
  } catch { return null; }
}
if (action === 'start') {
  let server = await info();
  if (server && !server.currentBoard) { try { process.kill(server.pid); } catch {} server = null; }
  if (!server) {
    try { await unlink(ready); } catch {}
    const child = spawn(process.execPath, [path.join(path.dirname(fileURLToPath(import.meta.url)), 'v4-sequential-review-server.mjs'), root, '0'], { detached: true, stdio: 'ignore', windowsHide: true });
    child.unref();
    for (let i = 0; i < 50 && !server; i++) { await sleep(100); server = await info(); }
    if (!server) throw new Error('审阅服务未能启动；请检查项目文件和运行环境。');
  }
  const url = `http://127.0.0.1:${server.port}/`;
  const command = process.platform === 'win32' ? 'rundll32.exe' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  const args = process.platform === 'win32' ? ['url.dll,FileProtocolHandler', url] : [url];
  const browser = spawn(command, args, { detached: true, stdio: 'ignore', windowsHide: true });
  browser.on('error', error => console.error('无法自动打开浏览器：' + error.message));
  browser.unref();
  console.log(JSON.stringify({ url, ...server }));
} else if (action === 'stop') {
  const server = await info();
  if (server) { try { process.kill(server.pid); } catch {} }
  try { await unlink(ready); } catch {}
  console.log('审阅服务已关闭。');
} else if (action === 'status') {
  console.log(JSON.stringify(await info()));
} else {
  const end = Date.now() + 55000;
  do {
    const server = await info();
    if (!server) throw new Error('审阅服务未运行。');
    if (server.saved) { console.log(JSON.stringify({ confirmed: true, path: server.path, boardHash: server.boardHash })); process.exit(0); }
    await sleep(1000);
  } while (Date.now() < end);
  console.log(JSON.stringify({ confirmed: false, message: '等待用户提交中；可继续等待或稍后读取状态。' }));
}
