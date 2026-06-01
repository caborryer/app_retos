export const BOARD_PRIZE_MAX_LENGTH = 150;

export function normalizeBoardPrize(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, BOARD_PRIZE_MAX_LENGTH);
}
