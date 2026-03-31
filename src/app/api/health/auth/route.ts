import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const hasAuthSecret = Boolean(process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET);
  const hasNextAuthUrl = Boolean(process.env.NEXTAUTH_URL);
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

  let dbOk = false;
  let dbError: string | null = null;

  try {
    await prisma.user.count();
    dbOk = true;
  } catch (error) {
    dbError = error instanceof Error ? error.message : 'Unknown database error';
  }

  return NextResponse.json({
    ok: hasAuthSecret && hasNextAuthUrl && hasDatabaseUrl && dbOk,
    env: {
      hasAuthSecret,
      hasNextAuthUrl,
      hasDatabaseUrl,
    },
    db: {
      ok: dbOk,
      error: dbError,
    },
  });
}

