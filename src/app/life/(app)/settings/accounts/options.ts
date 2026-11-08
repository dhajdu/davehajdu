export const CATEGORIES = ['bank', 'card', 'government', 'travel', 'work', 'dev', 'social', 'shopping', 'utility', 'other'] as const;
export const STATUSES = ['active', 'rotate', 'close', 'closed'] as const;

export const STATUS_LABEL: Record<(typeof STATUSES)[number], string> = {
  active: 'Active',
  rotate: 'Change password',
  close: 'To close',
  closed: 'Closed',
};
