function digitsOnly(s) {
  return String(s ?? "").replace(/\D/g, "");
}

function contactDisplayName(c) {
  const name = [c.first_name, c.last_name].filter(Boolean).join(" ").trim();
  return name || c.phone_no || "";
}

/** Map full digits and last-10 digits (when length ≥ 10) → display name */
function buildPhoneToNameMap(contacts) {
  const map = new Map();
  for (const c of contacts) {
    const full = digitsOnly(c.phone_no);
    const name = contactDisplayName(c);
    if (!full || !name) continue;
    map.set(full, name);
    if (full.length >= 10) map.set(full.slice(-10), name);
  }
  return map;
}

function contactNameForPhone(phone, map) {
  const d = digitsOnly(phone);
  if (!d) return null;
  if (map.has(d)) return map.get(d);
  if (d.length >= 10 && map.has(d.slice(-10))) return map.get(d.slice(-10));
  return null;
}

module.exports = {
  buildPhoneToNameMap,
  contactNameForPhone,
};
