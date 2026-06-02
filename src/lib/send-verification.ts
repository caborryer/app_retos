import { prisma } from '@/lib/prisma';
import { createAuthToken } from '@/lib/auth-tokens';
import { sendVerificationEmail } from '@/lib/email';

const RESEND_COOLDOWN_MS = 2 * 60 * 1000;

export async function issueAndSendVerificationEmail(userId: string): Promise<{
  sent: boolean;
  devLink?: string;
  cooldownSec?: number;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      emailVerificationSentAt: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }
  if (user.emailVerified) {
    return { sent: false };
  }

  if (user.emailVerificationSentAt) {
    const elapsed = Date.now() - user.emailVerificationSentAt.getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      return {
        sent: false,
        cooldownSec: Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000),
      };
    }
  }

  const rawToken = await createAuthToken(userId, 'EMAIL_VERIFY');
  const result = await sendVerificationEmail({
    to: user.email,
    name: user.name,
    rawToken,
  });

  await prisma.user.update({
    where: { id: userId },
    data: { emailVerificationSentAt: new Date() },
  });

  return result;
}
