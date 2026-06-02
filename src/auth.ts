import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import {
  consumeInviteAndCreateMember,
  InviteValidationError,
  validateInviteToken,
} from '@/lib/organization-access';
import { INVITE_COOKIE_NAME } from '@/lib/invite-cookie';
import { consumeAuthToken } from '@/lib/auth-tokens';

const googleConfigured =
  Boolean(process.env.AUTH_GOOGLE_ID?.trim()) && Boolean(process.env.AUTH_GOOGLE_SECRET?.trim());

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
  providers: [
    ...(googleConfigured
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
          }),
        ]
      : []),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        flow: { label: 'Flow', type: 'text' },
        loginToken: { label: 'Login token', type: 'text' },
      },
      async authorize(credentials) {
        try {
          const flow = credentials?.flow as string | undefined;

          if (flow === 'session_token') {
            const loginToken = credentials?.loginToken as string | undefined;
            if (!loginToken) return null;

            const userId = await consumeAuthToken(loginToken, 'MFA_LOGIN_SESSION');
            if (!userId) return null;

            const user = await prisma.user.findUnique({
              where: { id: userId },
              select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                role: true,
                emailVerified: true,
              },
            });

            if (!user || !user.emailVerified) return null;

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.avatar ?? null,
              role: user.role as 'USER' | 'ADMIN',
            };
          }

          return null;
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'google' || !user.email) {
        return true;
      }
      const email = user.email.trim().toLowerCase();
      const existing = await prisma.user.findUnique({ where: { email } });

      if (!existing) {
        const cookieStore = await cookies();
        const inviteToken = cookieStore.get(INVITE_COOKIE_NAME)?.value;
        if (!inviteToken) {
          return false;
        }
        try {
          await validateInviteToken(inviteToken);
        } catch {
          return false;
        }
      }

      const placeholderPassword = await bcrypt.hash(randomBytes(32).toString('hex'), 12);
      const now = new Date();
      const dbUser = await prisma.user.upsert({
        where: { email },
        create: {
          email,
          name: user.name?.trim() || 'Usuario',
          password: placeholderPassword,
          avatar: user.image ?? null,
          role: 'USER',
          emailVerified: now,
        },
        update: {
          name: user.name?.trim() || undefined,
          avatar: user.image ?? undefined,
          emailVerified: existing?.emailVerified ?? now,
        },
      });

      if (!existing) {
        const cookieStore = await cookies();
        const inviteToken = cookieStore.get(INVITE_COOKIE_NAME)?.value;
        if (inviteToken) {
          try {
            await consumeInviteAndCreateMember(dbUser.id, inviteToken);
          } catch (e) {
            if (e instanceof InviteValidationError) {
              return false;
            }
            throw e;
          }
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === 'credentials') {
          if (typeof user.id === 'string') token.id = user.id;
          token.role = (user as { role?: 'USER' | 'ADMIN' }).role ?? 'USER';
        } else if (account?.provider === 'google' && user.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email.trim().toLowerCase() },
            select: { id: true, role: true },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
          }
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.id === 'string' ? token.id : '';
        session.user.role =
          token.role === 'ADMIN' || token.role === 'USER' ? token.role : 'USER';
      }
      return session;
    },
  },
});
