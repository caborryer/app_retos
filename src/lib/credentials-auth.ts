import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export type CredentialUser = {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: 'USER' | 'ADMIN';
  emailVerified: Date | null;
  mfaEnabled: boolean;
};

export async function findUserByEmail(email: string): Promise<CredentialUser | null> {
  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalized },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      password: true,
      emailVerified: true,
      mfaEnabled: true,
    },
  });
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    role: user.role,
    emailVerified: user.emailVerified,
    mfaEnabled: user.mfaEnabled,
  };
}

export async function verifyUserPassword(
  userId: string,
  inputPassword: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });
  if (!user?.password) return false;

  if (user.password.startsWith('$2')) {
    return bcrypt.compare(inputPassword, user.password);
  }
  if (user.password === inputPassword) {
    const rehashed = await bcrypt.hash(inputPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: rehashed },
    });
    return true;
  }
  return false;
}
