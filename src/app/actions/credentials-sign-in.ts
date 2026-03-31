'use server';

import { signIn } from '@/auth';
import { CredentialsSignin } from 'next-auth';
import { prisma } from '@/lib/prisma';

export type CredentialsSignInState = { error?: string } | undefined;

export async function credentialsSignInAction(
  _prev: CredentialsSignInState,
  formData: FormData,
): Promise<CredentialsSignInState> {
  const email = formData.get('email')?.toString()?.trim() ?? '';
  const password = formData.get('password')?.toString() ?? '';
  const intent = formData.get('intent')?.toString();

  if (!email || !password) {
    return { error: 'Completa email y contraseña.' };
  }

  let redirectTo = '/home';
  if (intent === 'admin') {
    redirectTo = '/admin';
  } else {
    const u = await prisma.user.findUnique({
      where: { email },
      select: { role: true },
    });
    if (u?.role === 'ADMIN') redirectTo = '/admin';
  }

  try {
    await signIn('credentials', { email, password, redirectTo });
  } catch (e) {
    if (e instanceof CredentialsSignin) {
      return {
        error:
          intent === 'admin'
            ? 'Credenciales incorrectas o sin permisos de administrador.'
            : 'Credenciales incorrectas. Verifica tu email y contraseña.',
      };
    }
    throw e;
  }
}
