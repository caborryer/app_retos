'use server';

import { signIn } from '@/auth';
import { CredentialsSignin } from 'next-auth';
import { prisma } from '@/lib/prisma';

export type CredentialsSignInState =
  | { error: string }
  | { ok: true; redirectTo: string }
  | undefined;

/** useFormState may submit names like `1_email` / `1_password` on the wire. */
function getFormField(formData: FormData, field: string): string {
  const direct = formData.get(field);
  if (direct != null && String(direct).length > 0) {
    return field === 'password' ? String(direct) : String(direct).trim();
  }
  for (const key of formData.keys()) {
    if (key === field || key.endsWith(`_${field}`)) {
      const v = formData.get(key);
      if (v != null && String(v).length > 0) {
        return field === 'password' ? String(v) : String(v).trim();
      }
    }
  }
  return '';
}

export async function credentialsSignInAction(
  _prev: CredentialsSignInState,
  formData: FormData,
): Promise<CredentialsSignInState> {
  const email = getFormField(formData, 'email');
  const password = getFormField(formData, 'password');
  const intent = getFormField(formData, 'intent') || undefined;

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
    const nextUrl = await signIn('credentials', {
      email,
      password,
      redirectTo,
      redirect: false,
    });
    const target =
      typeof nextUrl === 'string' && nextUrl.length > 0 ? nextUrl : redirectTo;
    return { ok: true, redirectTo: target };
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
