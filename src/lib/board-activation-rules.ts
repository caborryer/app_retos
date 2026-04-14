/**
 * Rules for marking a board as active: 8 fully configured challenges.
 * Used by admin UI and PATCH /api/boards/:id.
 */

export type ChallengeLikeForActivation = {
  title: string;
  description: string;
  icon: string;
  images: string[];
  duration: number;
  tasks: {
    title: string;
    photoRequired: boolean;
    linkRequired: boolean;
  }[];
};

const REQUIRED = 8;

function challengeLabel(c: ChallengeLikeForActivation, index: number): string {
  const t = (c.title ?? '').trim();
  return t || `Reto ${index + 1}`;
}

/** Human-readable reasons why the board cannot be activated (empty = OK). */
export function getBoardActivationBlockReasons(
  challenges: ChallengeLikeForActivation[]
): string[] {
  const reasons: string[] = [];

  if (challenges.length < REQUIRED) {
    reasons.push(
      `El tablero debe tener exactamente ${REQUIRED} retos para activarse (ahora hay ${challenges.length}). Completa o crea los retos que faltan.`
    );
    return reasons;
  }

  if (challenges.length > REQUIRED) {
    reasons.push(
      `Solo se permiten ${REQUIRED} retos por tablero; hay ${challenges.length}. Elimina los sobrantes.`
    );
    return reasons;
  }

  challenges.forEach((c, index) => {
    const label = challengeLabel(c, index);
    if (!(c.title ?? '').trim()) {
      reasons.push(`${label}: falta el título.`);
    }
    if (!(c.description ?? '').trim()) {
      reasons.push(`${label}: falta la descripción.`);
    }
    if (!(c.icon ?? '').trim()) {
      reasons.push(`${label}: falta el icono (emoji).`);
    }
    const img = c.images?.[0];
    if (!img || !String(img).trim()) {
      reasons.push(`${label}: falta la imagen del reto.`);
    }
    const duration = Number(c.duration);
    if (!Number.isFinite(duration) || duration < 1) {
      reasons.push(`${label}: la duración debe ser al menos 1 día.`);
    }

    const tasks = c.tasks ?? [];
    if (tasks.length === 0) {
      reasons.push(
        `${label}: añade al menos una tarea y marca si pide foto y/o link (evidencia).`
      );
      return;
    }
    tasks.forEach((t, ti) => {
      const taskName = (t.title ?? '').trim() || `Tarea ${ti + 1}`;
      if (!(t.title ?? '').trim()) {
        reasons.push(`${label} → ${taskName}: falta el título de la tarea.`);
      }
      if (!t.photoRequired && !t.linkRequired) {
        reasons.push(
          `${label} → "${taskName}": activa al menos una opción de evidencia (foto o link).`
        );
      }
    });
  });

  return reasons;
}

export function canActivateBoard(challenges: ChallengeLikeForActivation[]): boolean {
  return getBoardActivationBlockReasons(challenges).length === 0;
}
