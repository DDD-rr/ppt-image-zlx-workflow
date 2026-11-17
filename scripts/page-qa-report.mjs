import {tableComponents} from './page-execution-qa.mjs';

export function createQaTemplate({table = false, imageHash} = {}) {
  const template = {
    compliance: {status:'unresolved', evidence:''},
    informationLayout: {status:'unresolved', evidence:''},
    visualCompletion: {status:'unresolved', evidence:''},
    textFeedback: []
  };
  if (table) template.visualCompletion.table = {
    designType: null, imageHash, tableOnlyInspected:false, wholePageInspected:false,
    components: Object.fromEntries(tableComponents.map(key => [key, {
      status:'unresolved', planned:'', observed:'', judgment:''
    }]))
  };
  return template;
}

// Only the panel summary is shortened. qaReport retains the complete evidence.
export function summarizeQa(qa) {
  const keys = ['compliance', 'informationLayout', 'visualCompletion'];
  const prefixes = keys.map(key => `${key} PASS: `);
  const feedback = (qa.textFeedback || []).map(item => `文字提示（不阻断候选）：${item}`);
  const overhead = [...prefixes, ...feedback].join('\n').length;
  const budget = Math.floor((2000 - overhead) / keys.length);
  const evidence = keys.map((key, index) => {
    const value = qa[key].evidence;
    if (value.length <= budget) return prefixes[index] + value;
    const excerpt = value.slice(0, budget - 1).replace(/[\uD800-\uDBFF]$/, '');
    return prefixes[index] + excerpt + '…';
  });
  return [...evidence, ...feedback].join('\n');
}
