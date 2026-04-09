'use server';

import { signIn } from '@/auth';
import { CredentialsSignin } from 'next-auth';
import { prisma } from '@/lib/prisma';

export type CredentialsSignInState =
  | { error: string }
  | { ok: true; redirectTo: string }
  | undefined;

/** Only allow same-origin paths for post-login navigation (avoids odd absolute URLs in Flight payloads). */
function toSafeAppPath(value: string, fallback: string): string {
  const fb = fallback.startsWith('/') ? fallback : `/${fallback}`;
  try {
    if (value.startsWith('/')) {
      const path = value.split('?')[0] ?? fb;
      return path.length > 0 ? path : fb;
    }
    const u = new URL(value);
    return u.pathname || fb;
  } catch {
    return fb;
  }
}

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
    const raw =
      typeof nextUrl === 'string' && nextUrl.length > 0 ? nextUrl : redirectTo;
    const target = toSafeAppPath(raw, redirectTo);
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

    // Any other Auth.js error (CallbackRouteError, UntrustedHost, etc.) or
    // unexpected exception — log server-side and return a safe message so the
    // Server Action never throws (which would produce "Application error").
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[credentialsSignInAction] unexpected error:', msg, e);
    return {
      error:
        'No se pudo completar el inicio de sesión. Intenta nuevamente o contacta al administrador.',
    };
  }
}
