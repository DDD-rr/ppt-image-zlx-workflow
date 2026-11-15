import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyFailure } from '../scripts/page-task.mjs';

test('权限失败保留错误码，提供同一操作的权限恢复指导', () => {
  const result = classifyFailure(Object.assign(new Error('blocked path'),{code:'EPERM'}),'prepare');
  assert.equal(result.category,'permission');
  assert.equal(result.code,'EPERM');
  assert.match(result.guidance,/策略明确拒绝/);
  assert.equal(result.error,'blocked path');
});
