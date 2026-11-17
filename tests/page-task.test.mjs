import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyFailure, runTask } from '../scripts/page-task.mjs';
import {createQaTemplate, summarizeQa} from '../scripts/page-qa-report.mjs';
import {validateQa} from '../scripts/page-execution-qa.mjs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

test('QA 模板保留未检查状态，表格模板绑定实际图片', () => {
  const plain = createQaTemplate();
  assert.throws(() => validateQa(plain), /status/);
  const table = createQaTemplate({table:true,imageHash:'actual-image'});
  assert.equal(table.visualCompletion.table.imageHash,'actual-image');
  assert.equal(Object.keys(table.visualCompletion.table.components).length,5);
  assert.equal(table.visualCompletion.table.tableOnlyInspected,false);
});

test('超长 QA 自动生成有界摘要，原文和文字反馈完整保留', () => {
  const qa = createQaTemplate();
  for (const key of ['compliance','informationLayout','visualCompletion']) {
    qa[key] = {status:'pass',evidence:'实际观察证据。'.repeat(500)};
  }
  qa.textFeedback = Array.from({length:5},(_,index)=>String(index)+'文字提示'.repeat(40));
  const before = JSON.stringify(qa);
  validateQa(qa);
  const summary = summarizeQa(qa);
  assert.ok(summary.length<=2000);
  for (const feedback of qa.textFeedback) assert.ok(summary.includes(feedback));
  assert.equal(JSON.stringify(qa),before);
});

test('命令帮助无需请求身份且返回 QA 模板用法', () => {
  const script = fileURLToPath(new URL('../scripts/page-task.mjs',import.meta.url));
  const result = spawnSync(process.execPath,[script,'complete','--help'],{encoding:'utf8',windowsHide:true});
  assert.equal(result.status,0,result.stderr);
  assert.ok(JSON.parse(result.stdout).qa.includes('qaTemplatePath'));
});

test('内嵌图片参数在访问服务前拒绝，回执保持小体积', async () => {
  const result = await runTask('finalize', {result:{image_url:'data:image/png;base64,'+'A'.repeat(2652982)}});
  assert.equal(result.ok,false);
  assert.equal(result.code,'NATIVE_IMAGE_REQUIRED');
  assert.equal(result.recovery,'native-file-required');
  assert.ok(JSON.stringify(result).length < 2048);
});

test('权限失败保留错误码，提供同一操作的权限恢复指导', () => {
  const result = classifyFailure(Object.assign(new Error('blocked path'),{code:'EPERM'}),'prepare');
  assert.equal(result.category,'permission');
  assert.equal(result.code,'EPERM');
  assert.match(result.guidance,/策略明确拒绝/);
  assert.equal(result.error,'blocked path');
});
