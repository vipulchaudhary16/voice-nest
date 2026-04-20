const contactCsv = require("./definitions/contactCsv");

/**
 * CSV import framework
 * --------------------
 * 1. Add `definitions/<entity>Csv.js` exporting: `type`, `label`, `templateFileName`,
 *    `buildTemplateCsv`, `parse`, `normalizeRow`, `validateRow`, `persistOne`, `dedupeKey`.
 * 2. Register the module in `registry` below.
 * 3. Clients use `GET /api/import/template?type=<type>` and `POST /api/import/run` with `{ type, csvText }`.
 *
 * @type {Record<string, typeof contactCsv>}
 */
const registry = {
  [contactCsv.type]: contactCsv,
};

function getDefinition(type) {
  if (!type || typeof type !== "string") return null;
  return registry[type] || null;
}

function listDefinitions() {
  return Object.values(registry).map((def) => ({
    type: def.type,
    label: def.label,
    templateFileName: def.templateFileName,
  }));
}

module.exports = {
  registry,
  getDefinition,
  listDefinitions,
};
