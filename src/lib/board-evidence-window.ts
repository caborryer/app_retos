import { endOfDay, format, isAfter, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

export type BoardDateInput = {
  startDate: Date | string | null | undefined;
  endDate: Date | string | null | undefined;
};

export type BoardEvidenceWindow = {
  canSubmitEvidence: boolean;
  phase: 'open' | 'before_start' | 'after_end';
  message: string;
};

function parseBoardDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function formatBoardDateLabel(value: Date | string): string {
  return format(parseBoardDate(value), "d 'de' MMMM yyyy", { locale: es });
}

export function getBoardEvidenceWindow(
  board: BoardDateInput,
  now: Date = new Date()
): BoardEvidenceWindow {
  const { startDate, endDate } = board;

  if (!startDate && !endDate) {
    return {
      canSubmitEvidence: true,
      phase: 'open',
      message: '',
    };
  }

  if (startDate) {
    const start = startOfDay(parseBoardDate(startDate));
    if (isBefore(now, start)) {
      return {
        canSubmitEvidence: false,
        phase: 'before_start',
        message: `Las evidencias se habilitan el ${formatBoardDateLabel(startDate)}.`,
      };
    }
  }

  if (endDate) {
    const end = endOfDay(parseBoardDate(endDate));
    if (isAfter(now, end)) {
      return {
        canSubmitEvidence: false,
        phase: 'after_end',
        message: `El plazo para subir evidencias finalizó el ${formatBoardDateLabel(endDate)}.`,
      };
    }
  }

  return {
    canSubmitEvidence: true,
    phase: 'open',
    message: '',
  };
}

export function assertCanSubmitBoardEvidence(board: BoardDateInput): void {
  const window = getBoardEvidenceWindow(board);
  if (!window.canSubmitEvidence) {
    throw new BoardEvidenceWindowError(window.message);
  }
}

export class BoardEvidenceWindowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BoardEvidenceWindowError';
  }
}
