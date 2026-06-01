import { prisma } from '@/lib/prisma';
import { getSupabaseAdmin, STORAGE_BUCKET } from '@/lib/supabase-server';
import { getStorageObjectPathFromPublicUrl } from '@/lib/evidence-cleanup';

function chunk<T>(list: T[], size: number): T[][] {
  const parts: T[][] = [];
  for (let i = 0; i < list.length; i += size) {
    parts.push(list.slice(i, i + size));
  }
  return parts;
}

export class BoardDeleteError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'BoardDeleteError';
    this.statusCode = statusCode;
  }
}

async function removeStorageUrls(urls: string[]) {
  const objectPaths = [
    ...new Set(
      urls
        .map((url) => getStorageObjectPathFromPublicUrl(url))
        .filter((p): p is string => Boolean(p))
    ),
  ];

  if (objectPaths.length === 0) {
    return { storageObjectsRequested: 0, storageObjectsDeleted: 0 };
  }

  const supabase = getSupabaseAdmin();
  let storageObjectsDeleted = 0;

  for (const paths of chunk(objectPaths, 100)) {
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).remove(paths);
    if (error) {
      console.error('[delete-board] storage remove failed', error);
      continue;
    }
    storageObjectsDeleted += data?.length ?? 0;
  }

  return {
    storageObjectsRequested: objectPaths.length,
    storageObjectsDeleted,
  };
}

export type DeleteBoardResult = {
  ok: true;
  deleted: {
    challenges: number;
    tasks: number;
    submissions: number;
    challengeProgress: number;
    snapshots: number;
    storageObjectsRequested: number;
    storageObjectsDeleted: number;
  };
  warnings: string[];
};

/**
 * Deletes an inactive board and all related data (DB cascade + rank snapshots + storage files).
 */
export async function deleteBoardCompletely(boardId: string): Promise<DeleteBoardResult> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      challenges: {
        select: {
          images: true,
          _count: { select: { tasks: true } },
        },
      },
    },
  });

  if (!board) {
    throw new BoardDeleteError('Tablero no encontrado', 404);
  }

  if (board.active) {
    throw new BoardDeleteError('Desactiva el tablero antes de eliminarlo', 400);
  }

  const challenges = board.challenges.length;
  const tasks = board.challenges.reduce((sum, c) => sum + c._count.tasks, 0);

  const [submissions, challengeProgress, snapshots] = await Promise.all([
    prisma.userTaskProgress.count({
      where: { task: { challenge: { boardId } } },
    }),
    prisma.userChallengeProgress.count({
      where: { challenge: { boardId } },
    }),
    prisma.boardUserRankSnapshot.count({
      where: { boardId },
    }),
  ]);

  const urls: string[] = [];
  if (board.coverImage) urls.push(board.coverImage);
  for (const challenge of board.challenges) {
    urls.push(...challenge.images);
  }

  const progressRows = await prisma.userTaskProgress.findMany({
    where: { task: { challenge: { boardId } } },
    select: { photoUrl: true },
  });
  for (const row of progressRows) {
    if (row.photoUrl) urls.push(row.photoUrl);
  }

  const storageResult = await removeStorageUrls(urls);

  const warnings: string[] = [];
  if (storageResult.storageObjectsRequested > storageResult.storageObjectsDeleted) {
    warnings.push('Algunos archivos en almacenamiento no pudieron eliminarse');
  }

  await prisma.$transaction(async (tx) => {
    await tx.boardUserRankSnapshot.deleteMany({ where: { boardId } });
    await tx.board.delete({ where: { id: boardId } });
  });

  return {
    ok: true,
    deleted: {
      challenges,
      tasks,
      submissions,
      challengeProgress,
      snapshots,
      storageObjectsRequested: storageResult.storageObjectsRequested,
      storageObjectsDeleted: storageResult.storageObjectsDeleted,
    },
    warnings,
  };
}
