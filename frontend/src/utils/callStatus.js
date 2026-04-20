import startCase from 'lodash/startCase';

/** Human-readable label from API snake_case status */
export function formatCallStatusLabel(status) {
  if (status == null || String(status).trim() === '') return '—';
  return startCase(String(status));
}

const STATUS_TOOLTIPS = {
  did_not_respond: 'No keypad digit was selected. The callee did not press any menu option.',
  completed: 'The callee selected a valid menu option (digit pressed).',
  failed: 'The call ended in a failed state.',
  initiated: 'The call was initiated; flow may still be in progress.',
};

/**
 * Tooltip copy for the status badge; falls back to the formatted label.
 * @param {string} status
 */
export function getCallStatusTooltip(status) {
  const key = String(status ?? '').trim();
  if (!key) return 'No status recorded.';
  return STATUS_TOOLTIPS[key] ?? formatCallStatusLabel(status);
}

export function callStatusBadgeClass(status) {
  switch (status) {
    case 'completed':
      return 'bg-green-500/10 text-green-400 border-green-500/20';
    case 'failed':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'initiated':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'did_not_respond':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    default:
      return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  }
}
