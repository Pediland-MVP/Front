export const formatNumber = (value: unknown): string | number | null => {
  if (typeof value === 'number') {
    return new Intl.NumberFormat('en-US').format(value);
  }

  if (typeof value === 'string' && !isNaN(Number(value))) {
    return new Intl.NumberFormat('en-US').format(Number(value));
  }

  return value?.toString?.() ?? null;
};
