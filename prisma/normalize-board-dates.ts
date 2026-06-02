/**
 * Normaliza fechas de tableros a 12:00 UTC para evitar corrimientos por zona horaria.
 *
 * Uso:
 * - Dry run (default): npx tsx prisma/normalize-board-dates.ts
 * - Aplicar cambios:    npx tsx prisma/normalize-board-dates.ts --apply
 */
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

config({ path: '.env.local' });
config({ path: '.env' });

type BoardRow = {
  id: string;
  title: string;
  startDate: Date | null;
  endDate: Date | null;
};

function toUtcNoonSameCalendarDay(value: Date): Date {
  return new Date(
    Date.UTC(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate(),
      12,
      0,
      0,
      0
    )
  );
}

function isAlreadyUtcNoon(value: Date): boolean {
  return (
    value.getUTCHours() === 12 &&
    value.getUTCMinutes() === 0 &&
    value.getUTCSeconds() === 0 &&
    value.getUTCMilliseconds() === 0
  );
}

async function main() {
  const shouldApply = process.argv.includes('--apply');
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set');

  const pool = new Pool({ connectionString });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const boards = await prisma.board.findMany({
      select: { id: true, title: true, startDate: true, endDate: true },
      orderBy: { createdAt: 'asc' },
    });

    const toUpdate: Array<{
      id: string;
      title: string;
      startDate: Date | null;
      endDate: Date | null;
    }> = [];

    for (const board of boards as BoardRow[]) {
      const nextStart = board.startDate ? toUtcNoonSameCalendarDay(board.startDate) : null;
      const nextEnd = board.endDate ? toUtcNoonSameCalendarDay(board.endDate) : null;

      const startChanged =
        !!board.startDate &&
        (!isAlreadyUtcNoon(board.startDate) || board.startDate.getTime() !== nextStart!.getTime());
      const endChanged =
        !!board.endDate &&
        (!isAlreadyUtcNoon(board.endDate) || board.endDate.getTime() !== nextEnd!.getTime());

      if (startChanged || endChanged) {
        toUpdate.push({
          id: board.id,
          title: board.title,
          startDate: nextStart,
          endDate: nextEnd,
        });
      }
    }

    console.log(`Boards found: ${boards.length}`);
    console.log(`Boards needing normalization: ${toUpdate.length}`);

    if (toUpdate.length === 0) {
      console.log('No changes needed.');
      return;
    }

    for (const b of toUpdate.slice(0, 20)) {
      console.log(`- ${b.id} | ${b.title}`);
    }
    if (toUpdate.length > 20) {
      console.log(`... and ${toUpdate.length - 20} more`);
    }

    if (!shouldApply) {
      console.log('Dry run only. Re-run with --apply to persist changes.');
      return;
    }

    let updated = 0;
    for (const board of toUpdate) {
      await prisma.board.update({
        where: { id: board.id },
        data: {
          startDate: board.startDate,
          endDate: board.endDate,
        },
      });
      updated += 1;
    }

    console.log(`Updated boards: ${updated}`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
