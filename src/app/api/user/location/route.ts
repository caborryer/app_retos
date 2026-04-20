import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function validCoord(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * POST /api/user/location
 * Stores a location snapshot after the user accepted tracking in the app (and granted browser permission).
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { latitude, longitude, accuracy, consent } = body as {
    latitude?: unknown;
    longitude?: unknown;
    accuracy?: unknown;
    consent?: unknown;
  };

  if (consent !== true) {
    return NextResponse.json({ error: 'Se requiere consentimiento explícito.' }, { status: 400 });
  }

  const hasCoords = validCoord(latitude, longitude);
  const now = new Date();

  // Some devices/browsers cannot resolve GPS/network location (code 2/3).
  // In that case we still keep explicit opt-in timestamp and continue without a ping.
  if (!hasCoords) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { locationOptInAt: now },
    });
    return NextResponse.json({
      ok: true,
      storedPing: false,
      message: 'Consentimiento guardado sin coordenadas.',
    });
  }

  const lat = latitude as number;
  const lng = longitude as number;

  const accuracyMeters =
    typeof accuracy === 'number' && Number.isFinite(accuracy) && accuracy >= 0 && accuracy < 1_000_000
      ? accuracy
      : null;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { locationOptInAt: now },
    }),
    prisma.locationPing.create({
      data: {
        userId: session.user.id,
        latitude: lat,
        longitude: lng,
        accuracyMeters,
        consentSnapshot: true,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
