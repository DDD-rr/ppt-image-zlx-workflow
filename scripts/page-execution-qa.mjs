export const tableComponents = ['backing', 'horizontalHeaders', 'verticalHeaders', 'separation', 'typeHierarchy'];
export function tableRequired(input) {
  return !!input.tableDesignRequired || /<table\b|^\s*\|.+\|/im.test(input.body || '');
}
function text(value) { return typeof value === 'string' && !!value.trim(); }
export function validateQa(qa, { table = false, imageHash, allowFailure = false } = {}) {
  if (!qa || typeof qa !== 'object') throw new Error('A structured QA report is required');
  const statuses = allowFailure ? ['pass', 'fail', 'unresolved'] : ['pass'];
  for (const key of ['compliance', 'informationLayout', 'visualCompletion']) {
    if (!statuses.includes(qa[key]?.status) || !text(qa[key]?.evidence)) throw new Error(`QA ${key} must have ${statuses.join('/')} status and observable evidence`);
  }
  if (!table) return;
  const report = qa.visualCompletion.table;
  if (!report || !['flat-graphic', 'physical-object-integration'].includes(report.designType)) throw new Error('Table QA must name its actual design type');
  if (!imageHash || report.imageHash !== imageHash || report.tableOnlyInspected !== true || report.wholePageInspected !== true) throw new Error('Table QA must identify the inspected final image and both inspection views');
  for (const key of tableComponents) {
    const item = report.components?.[key];
    if (!item || !statuses.includes(item.status) || !['planned', 'observed', 'judgment'].every(field => text(item[field]))) throw new Error(`Table QA ${key} needs planned treatment, observed evidence and judgment`);
    if (item.planned.trim().toLowerCase() === item.observed.trim().toLowerCase()) throw new Error(`Table QA ${key} copies the plan into the observation`);
    if (qa.visualCompletion.status === 'pass' && item.status !== 'pass') throw new Error(`Table QA ${key} has not passed`);
  }
  // This checks evidence structure and lineage, not whether the image looks good.
  // The agent must compare each observation with actual pixels; prose cannot prove it.
}
