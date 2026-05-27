function isAllowedMediaHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h.endsWith('.supabase.co') || h.endsWith('.supabase.in')) return true;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return false;
  try {
    return h === new URL(supabaseUrl).hostname.toLowerCase();
  } catch {
    return false;
  }
}

/** Same-origin proxy for external media — avoids Cloudflare __cf_bm cookie warnings in the browser. */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('/') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return url;
    if (!isAllowedMediaHostname(parsed.hostname)) return url;
    return `/api/media?url=${encodeURIComponent(url)}`;
  } catch {
    return url;
  }
}
