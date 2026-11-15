import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('任务停滞只提醒，不改变运行状态；新回报会解除提醒', async () => {
  const source = await readFile(new URL('../references/page-flow.js',import.meta.url),'utf8');
  const activity = new Function('return (' + source.match(/function taskActivity\([^]*?\n  \}/)[0] + ')')();
  const now = Date.parse('2026-11-13T08:00:00Z');
  const running = {status:'running',startedAt:'2026-11-13T07:40:00Z'};
  assert.equal(activity(running,now).attention,true);
  assert.equal(running.status,'running');
  assert.equal(activity({...running,lastHeartbeatAt:'2026-11-13T07:59:00Z'},now).attention,false);
  assert.equal(activity({status:'queued',createdAt:'2026-11-13T07:49:00Z'},now).attention,true);
  assert.equal(activity({status:'running',startedAt:'2026-11-13T07:52:00Z'},now).attention,false);
  assert.equal(activity({status:'ready'},now),null);
  assert.equal(activity({status:'cancelled'},now),null);
  assert.match(activity(running,now).text,/尚无进度回报/);
  assert.match(activity({...running,lastHeartbeatAt:'2026-11-13T07:59:00Z'},now).text,/最近回报/);
});

test('其他页的旧任务与已采用状态分开说明，状态更新产生新的显示内容', async () => {
  const source = await readFile(new URL('../references/page-flow.js',import.meta.url),'utf8');
  const activity = new Function('return (' + source.match(/function taskActivity\([^]*?\n  \}/)[0] + ')')();
  const summary = new Function('taskActivity','pagePosition','return (' + source.match(/function otherTaskSummary\([^]*?\n  \}/)[0] + ')')(activity,()=>43);
  const now = Date.parse('2026-11-15T08:00:00Z');
  const request = {pageId:'slide41',status:'running',createdAt:'2026-11-14T08:00:00Z',startedAt:'2026-11-14T08:01:00Z'};
  assert.match(summary(request,{adopted:{acceptedAt:'2026-11-15T03:00:00Z'}},now),/已有采用图，旧任务状态待核对/);
  assert.match(summary(request,{},now),/无进度回报/);
  assert.match(summary({...request,status:'ready'}, {},now),/候选图待验收/);
  assert.match(summary({...request,status:'ready'}, {},now),/^第 43 页/);
  assert.notEqual(summary(request,{},now),summary({...request,status:'ready'},{},now));
});
