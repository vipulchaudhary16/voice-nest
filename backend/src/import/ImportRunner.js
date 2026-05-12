const { getDefinition } = require('./registry');

/**
 * Generic CSV import runner: parse → validate rows → dedupe (optional per type) → persist.
 * @param {string} type - registry key, e.g. "contacts"
 * @param {string} csvText - raw UTF-8 CSV
 * @param {{ tenant_id: import('mongoose').Types.ObjectId, user?: object, sync_to_exotel?: boolean }} context
 */
async function run(type, csvText, context) {
  const def = getDefinition(type);
  if (!def) {
    const err = new Error(`Unknown import type: ${type}`);
    err.statusCode = 400;
    throw err;
  }

  if (typeof csvText !== 'string' || !csvText.trim()) {
    const err = new Error('csvText is required and must be non-empty');
    err.statusCode = 400;
    throw err;
  }

  let rows;
  try {
    rows = def.parse(csvText);
  } catch (e) {
    if (e.statusCode) throw e;
    const err = new Error(`CSV parse error: ${e.message}`);
    err.statusCode = 400;
    throw err;
  }

  const failed = [];
  const valid = [];

  for (let i = 0; i < rows.length; i += 1) {
    const rowNum = i + 2;
    const normalized = def.normalizeRow(rows[i]);
    const msg = def.validateRow(normalized);
    if (msg) {
      failed.push({ row: rowNum, message: msg });
    } else {
      valid.push({ normalized, row: rowNum });
    }
  }

  if (typeof def.dedupeKey !== 'function') {
    const err = new Error(`Import definition "${type}" must export dedupeKey(normalized)`);
    err.statusCode = 500;
    throw err;
  }

  const merged = new Map();
  for (const item of valid) {
    merged.set(def.dedupeKey(item.normalized), item);
  }

  let inserted = 0;
  let updated = 0;
  const persistErrors = [];

  for (const { normalized, row } of merged.values()) {
    try {
      const r = await def.persistOne(normalized, context.tenant_id, context);
      if (r.created) inserted += 1;
      else updated += 1;
    } catch (e) {
      persistErrors.push({
        row,
        message: e.message || 'Persist failed',
      });
    }
  }

  return {
    type,
    totalRows: rows.length,
    validated: valid.length,
    inserted,
    updated,
    failed: [...failed, ...persistErrors],
    failedCount: failed.length + persistErrors.length,
    mergedCount: merged.size,
  };
}

module.exports = {
  run,
};
