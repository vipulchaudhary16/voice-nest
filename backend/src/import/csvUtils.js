/**
 * Minimal RFC 4180-style CSV line parser (commas, quoted fields, escaped quotes).
 * @param {string} line
 * @returns {string[]}
 */
function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result.map((s) => s.trim());
}

/**
 * @param {string} text
 * @returns {string[][]}
 */
function splitLines(text) {
  return text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0);
}

/**
 * Map a header cell to canonical column name (override per import definition if needed).
 * @param {string} raw
 * @param {Record<string, string>} aliases
 */
function canonicalHeader(raw, aliases) {
  const key = String(raw)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (aliases[key] != null) return aliases[key];
  return key;
}

/**
 * Parse CSV into array of row objects; first row is headers.
 * @param {string} csvText
 * @param {Record<string, string>} headerAliases
 */
function parseCsvObjects(csvText, headerAliases = {}) {
  const lines = splitLines(csvText);
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }
  const headerCells = parseCsvLine(lines[0]);
  const headers = headerCells.map((h) => canonicalHeader(h, headerAliases));
  const rows = lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = cells[idx] != null ? String(cells[idx]).trim() : "";
    });
    return row;
  });
  return { headers, rows };
}

module.exports = {
  parseCsvLine,
  parseCsvObjects,
  canonicalHeader,
};
