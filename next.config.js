const remotePatterns = [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'pedalia.cc' },
      { protocol: 'https', hostname: 'www.chilevision.cl' },
      { protocol: 'https', hostname: 'contents.mediadecathlon.com' },
      { protocol: 'https', hostname: 'previews.123rf.com' },
      { protocol: 'https', hostname: 'i0.wp.com' },
      { protocol: 'https', hostname: 'cdn0.expertoanimal.com' },
      { protocol: 'https', hostname: 'i.ibb.co' },
];

try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    const hostname = new URL(supabaseUrl).hostname;
    remotePatterns.push({
      protocol: 'https',
      hostname,
      pathname: '/storage/v1/object/public/**',
    });
  }
} catch {
  /* invalid env at build */
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns,
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  async headers() {
    return [
      {
        // JS/CSS chunks: revalidate every request but allow reuse if unchanged (ETag/304)
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            // immutable only for hashed filenames; we use a shorter max-age
            // so browsers re-validate on next visit instead of serving stale chunks
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // HTML pages: always revalidate so users get the latest shell
        source: '/((?!_next/static|_next/image|favicon.ico).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig