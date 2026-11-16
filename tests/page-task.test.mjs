import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyFailure, runTask } from '../scripts/page-task.mjs';

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
