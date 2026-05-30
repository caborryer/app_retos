import { prisma } from '@/lib/prisma';
import { getSupabaseAdmin, STORAGE_BUCKET } from '@/lib/supabase-server';

type EvidenceRow = {
  id: string;
  photoUrl: string | null;
  linkUrl: string | null;
};

function chunk<T>(list: T[], size: number): T[][] {
  const parts: T[][] = [];
  for (let i = 0; i < list.length; i += size) {
    parts.push(list.slice(i, i + size));
  }
  return parts;
}

/**
 * Converts a public storage URL into a bucket object path.
 * Example:
 * https://<project>.supabase.co/storage/v1/object/public/task-submissions/a/b.jpg
 * -> a/b.jpg
 */
export function getStorageObjectPathFromPublicUrl(
  publicUrl: string | null | undefined,
  bucket = STORAGE_BUCKET
): string | null {
  if (!publicUrl) return null;

  try {
    const parsed = new URL(publicUrl);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = parsed.pathname.indexOf(marker);
    if (idx < 0) return null;
    const path = parsed.pathname.slice(idx + marker.length);
    if (!path) return null;
    return decodeURIComponent(path);
  } catch {
    return null;
  }
}

export async function purgeEvidenceRows(rows: EvidenceRow[]) {
  if (rows.length === 0) {
    return {
      rowsMatched: 0,
      rowsUpdated: 0,
      storageObjectsRequested: 0,
      storageObjectsDeleted: 0,
    };
  }

  const ids = [...new Set(rows.map((r) => r.id))];

  const objectPaths = [...new Set(
    rows
      .map((r) => getStorageObjectPathFromPublicUrl(r.photoUrl))
      .filter((p): p is string => Boolean(p))
  )];

  let storageObjectsDeleted = 0;
  if (objectPaths.length > 0) {
    const supabase = getSupabaseAdmin();
    const batches = chunk(objectPaths, 100);
    for (const paths of batches) {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove(paths);
      if (error) {
        console.error('[evidence-cleanup] storage remove failed', error);
        continue;
      }
      storageObjectsDeleted += data?.length ?? 0;
    }
  }

  let rowsUpdated = 0;
  const idBatches = chunk(ids, 500);
  for (const idBatch of idBatches) {
    const result = await prisma.userTaskProgress.updateMany({
      where: { id: { in: idBatch } },
      data: {
        photoUrl: null,
        linkUrl: null,
      },
    });
    rowsUpdated += result.count;
  }

  return {
    rowsMatched: ids.length,
    rowsUpdated,
    storageObjectsRequested: objectPaths.length,
    storageObjectsDeleted,
  };
}
