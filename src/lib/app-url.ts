/** Public path prefix when the app is mounted under a subpath (e.g. /retos). */
export function getAppBasePath(): string {
  const raw = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? '';
  if (!raw || raw === '/') return '';
  const withSlash = raw.startsWith('/') ? raw : `/${raw}`;
  return withSlash.replace(/\/$/, '');
}

/** Canonical public origin from NEXT_PUBLIC_APP_URL (e.g. https://www.boxchallenge.co). */
export function getConfiguredAppOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return new URL(withProtocol).origin;
  } catch {
    return null;
  }
}

/** Production *.vercel.app host (Vercel system env, e.g. app-retos.vercel.app). */
export function getProductionVercelHost(): string | null {
  const raw = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (!raw) return null;
  try {
    const host = /^https?:\/\//i.test(raw) ? new URL(raw).host : raw.split('/')[0];
    return host?.toLowerCase() || null;
  } catch {
    return raw.replace(/\/$/, '').toLowerCase();
  }
}

/** Origin from incoming request (Vercel/proxy-aware). */
export function getRequestPublicOrigin(req: Request): string {
  const forwardedHost = req.headers.get('x-forwarded-host');
  const host = forwardedHost?.split(',')[0]?.trim() || req.headers.get('host');
  if (!host) {
    try {
      return new URL(req.url).origin;
    } catch {
      return '';
    }
  }
  const forwardedProto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const protocol =
    forwardedProto ||
    (host.includes('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');
  return `${protocol}://${host}`;
}

export function buildInviteUrl(token: string, requestOrigin?: string): string {
  const registerPath = `/register?invite=${encodeURIComponent(token)}`;

  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  if (configured) {
    return `${configured}${registerPath}`;
  }

  const basePath = getAppBasePath();
  const origin = requestOrigin?.replace(/\/$/, '');
  if (origin) {
    return `${origin}${basePath}${registerPath}`;
  }

  return `${basePath}${registerPath}`;
}

/** Ensures a copy-pasteable absolute URL in the admin UI. */
export function resolveInviteUrlForDisplay(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  if (typeof window === 'undefined') return url;

  const basePath = getAppBasePath();
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${window.location.origin}${basePath}${path}`;
}
