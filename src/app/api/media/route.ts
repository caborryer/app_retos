import { NextResponse } from 'next/server';

function isAllowedMediaUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    const h = parsed.hostname.toLowerCase();
    if (h.endsWith('.supabase.co') || h.endsWith('.supabase.in')) return true;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return false;
    return h === new URL(supabaseUrl).hostname.toLowerCase();
  } catch {
    return false;
  }
}

/** GET /api/media?url=... — proxy public storage images through same origin. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get('url');
  if (!target || !isAllowedMediaUrl(target)) {
    return NextResponse.json({ error: 'Invalid media URL' }, { status: 400 });
  }

  try {
    const upstream = await fetch(target, {
      headers: { Accept: 'image/*,*/*;q=0.8' },
      next: { revalidate: 86400 },
    });
    if (!upstream.ok) {
      return NextResponse.json({ error: 'Upstream fetch failed' }, { status: upstream.status });
    }
    const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream';
    const body = await upstream.arrayBuffer();
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch (error) {
    console.error('[GET /api/media]', error);
    return NextResponse.json({ error: 'Media proxy failed' }, { status: 502 });
  }
}
