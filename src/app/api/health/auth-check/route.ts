import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, password } = (await req.json()) as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, reason: 'missing_email_or_password' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ ok: false, reason: 'user_not_found' });
    }

    let passwordMatch = false;
    let passwordMode: 'bcrypt' | 'legacy_plaintext' = 'bcrypt';

    if (user.password?.startsWith('$2')) {
      passwordMatch = await bcrypt.compare(password, user.password);
    } else {
      passwordMode = 'legacy_plaintext';
      passwordMatch = user.password === password;
    }

    return NextResponse.json({
      ok: passwordMatch,
      reason: passwordMatch ? 'ok' : 'password_mismatch',
      passwordMode,
      role: user.role,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason: 'server_error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

