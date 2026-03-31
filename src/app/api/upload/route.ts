import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSupabaseAdmin, STORAGE_BUCKET } from '@/lib/supabase-server';

/**
 * POST /api/upload
 * Accepts multipart/form-data with a "file" field.
 * Uploads the file to Supabase Storage and returns the public URL.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 413 });
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 415 });
  }

  const ext = file.name.split('.').pop() ?? 'jpg';
  const filename = `${session.user.id}/${Date.now()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filename, buffer, { contentType: file.type, upsert: false });

  if (error) {
    console.error('Supabase Storage error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filename);

  return NextResponse.json({ url: data.publicUrl }, { status: 201 });
}
