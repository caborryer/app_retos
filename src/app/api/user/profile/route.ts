import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getUserProfileMetrics } from '@/lib/profile-metrics';

type ProfilePatchBody = {
  name?: unknown;
  avatar?: unknown;
  removeAvatar?: unknown;
  notifications?: {
    notificationsEnabled?: unknown;
    activityReminders?: unknown;
    marketingEmails?: unknown;
  };
};

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [user, metrics] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        settings: {
          select: {
            notificationsEnabled: true,
            activityReminders: true,
            marketingEmails: true,
          },
        },
      },
    }),
    getUserProfileMetrics(prisma, session.user.id),
  ]);
  const [recentCompletedChallenges, activeChallengeTitles] = await Promise.all([
    prisma.userChallengeProgress.findMany({
      where: { userId: session.user.id, status: 'COMPLETED', completedAt: { not: null } },
      select: {
        id: true,
        completedAt: true,
        challenge: { select: { title: true, icon: true } },
      },
      orderBy: { completedAt: 'desc' },
      take: 8,
    }),
    prisma.userChallengeProgress.findMany({
      where: { userId: session.user.id, status: 'IN_PROGRESS' },
      select: {
        id: true,
        challenge: { select: { title: true, icon: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 6,
    }),
  ]);

  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  const notifications = user.settings ?? {
    notificationsEnabled: true,
    activityReminders: true,
    marketingEmails: false,
  };

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
    },
    metrics,
    notifications,
    recentCompletedChallenges: recentCompletedChallenges.map((row) => ({
      id: row.id,
      title: row.challenge.title,
      icon: row.challenge.icon,
      completedAt: row.completedAt?.toISOString() ?? null,
    })),
    activeChallenges: activeChallengeTitles.map((row) => ({
      id: row.id,
      title: row.challenge.title,
      icon: row.challenge.icon,
    })),
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as ProfilePatchBody;

  const data: { name?: string; avatar?: string | null } = {};
  if (typeof body.name === 'string') {
    const trimmed = body.name.trim();
    if (trimmed.length < 2 || trimmed.length > 60) {
      return NextResponse.json(
        { error: 'El nombre debe tener entre 2 y 60 caracteres.' },
        { status: 400 }
      );
    }
    data.name = trimmed;
  }

  if (body.removeAvatar === true) {
    data.avatar = null;
  } else if (typeof body.avatar === 'string') {
    const avatar = body.avatar.trim();
    if (!avatar.startsWith('http://') && !avatar.startsWith('https://')) {
      return NextResponse.json({ error: 'URL de avatar inválida.' }, { status: 400 });
    }
    data.avatar = avatar;
  }

  const settingsPatch = body.notifications;
  const notificationsEnabled =
    typeof settingsPatch?.notificationsEnabled === 'boolean'
      ? settingsPatch.notificationsEnabled
      : undefined;
  const activityReminders =
    typeof settingsPatch?.activityReminders === 'boolean'
      ? settingsPatch.activityReminders
      : undefined;
  const marketingEmails =
    typeof settingsPatch?.marketingEmails === 'boolean'
      ? settingsPatch.marketingEmails
      : undefined;

  await prisma.$transaction(async (tx) => {
    if (Object.keys(data).length > 0) {
      await tx.user.update({
        where: { id: session.user.id },
        data,
      });
    }

    if (
      notificationsEnabled !== undefined ||
      activityReminders !== undefined ||
      marketingEmails !== undefined
    ) {
      await tx.userSettings.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          notificationsEnabled: notificationsEnabled ?? true,
          activityReminders: activityReminders ?? true,
          marketingEmails: marketingEmails ?? false,
        },
        update: {
          ...(notificationsEnabled !== undefined ? { notificationsEnabled } : {}),
          ...(activityReminders !== undefined ? { activityReminders } : {}),
          ...(marketingEmails !== undefined ? { marketingEmails } : {}),
        },
      });
    }
  });

  return GET();
}

