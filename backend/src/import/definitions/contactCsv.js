const Contact = require('../../models/contactModel');
const { parseCsvObjects } = require('../csvUtils');
const { syncSingleContact } = require('../../services/contactSyncService');

const TYPE = 'contacts';

const HEADER_ALIASES = {
  firstname: 'first_name',
  first_name: 'first_name',
  lastname: 'last_name',
  last_name: 'last_name',
  email: 'email',
  'e-mail': 'email',
  phone: 'phone_no',
  phone_no: 'phone_no',
  phone_number: 'phone_no',
  mobile: 'phone_no',
  msisdn: 'phone_no',
  tag: 'tag',
};

const REQUIRED = ['first_name', 'phone_no'];

/**
 * Normalize contact phone for import without forcing country prefix.
 * Keeps optional leading + if provided, strips formatting symbols.
 * @param {unknown} value
 */
function normalizePhoneNo(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (raw.startsWith('+')) {
    const rest = raw.slice(1).replace(/[\s().-]/g, '');
    return rest ? `+${rest}` : '+';
  }
  return raw.replace(/\D/g, '');
}

function buildTemplateCsv() {
  const header = 'first_name,last_name,email,phone_no,tag';
  // phone_no can be provided with or without +.
  const example = 'Jane,Doe,jane@example.com,919876543210,prospect';
  return `${header}\r\n${example}\r\n`;
}

function validateHeaders(headers) {
  const set = new Set(headers);
  const missing = REQUIRED.filter((k) => !set.has(k));
  if (missing.length) {
    const err = new Error(
      `Missing required column(s): ${missing.join(', ')}. Expected at least: ${REQUIRED.join(', ')}.`
    );
    err.statusCode = 400;
    throw err;
  }
}

function normalizeRow(row) {
  return {
    first_name: String(row.first_name || '').trim(),
    last_name: String(row.last_name || '').trim(),
    email: String(row.email || '').trim(),
    phone_no: normalizePhoneNo(row.phone_no),
    tag: String(row.tag || '').trim(),
  };
}

function validateRow(normalized) {
  if (!normalized.first_name) return 'first_name is required';
  if (!normalized.phone_no) return 'phone_no is required';
  const phoneDigits = normalized.phone_no.replace(/\D/g, '');
  if (phoneDigits.length < 8) {
    return 'phone_no must contain at least 8 digits';
  }
  if (normalized.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) {
    return 'email format is invalid';
  }
  return null;
}

/**
 * @param {import('mongoose').Types.ObjectId} tenant_id
 * @param {{ sync_to_exotel?: boolean }} context
 */
async function persistOne(normalized, tenant_id, context = {}) {
  const existing = await Contact.findOne({
    tenant_id,
    phone_no: normalized.phone_no,
  });

  let finalSid = existing?.exotel_sid || null;
  if (context.sync_to_exotel) {
    finalSid =
      (await syncSingleContact(tenant_id, {
        phone_no: normalized.phone_no,
        first_name: normalized.first_name,
        last_name: normalized.last_name,
        email: normalized.email,
        tag: normalized.tag,
      })) || finalSid;
  }

  const payload = {
    first_name: normalized.first_name,
    last_name: normalized.last_name || undefined,
    email: normalized.email || undefined,
    phone_no: normalized.phone_no,
    tag: normalized.tag || undefined,
    exotel_sid: finalSid || undefined,
    tenant_id,
  };

  if (existing) {
    await Contact.updateOne(
      { _id: existing._id },
      {
        $set: {
          first_name: payload.first_name,
          last_name: normalized.last_name || '',
          email: normalized.email || '',
          tag: normalized.tag || '',
          exotel_sid: finalSid || '',
        },
      }
    );
    return { created: false };
  }

  await Contact.create(payload);
  return { created: true };
}

function parse(csvText) {
  const { headers, rows } = parseCsvObjects(csvText, HEADER_ALIASES);
  validateHeaders(headers);
  return rows;
}

function dedupeKey(normalized) {
  return normalized.phone_no;
}

module.exports = {
  type: TYPE,
  label: 'Contacts',
  templateFileName: 'contacts-import-template.csv',
  buildTemplateCsv: buildTemplateCsv,
  parse,
  normalizeRow,
  validateRow,
  persistOne,
  dedupeKey,
};
