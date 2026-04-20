import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/prisma';

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
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.error('[authorize] missing credentials');
            return null;
          }
          const email = credentials.email as string;
          const inputPassword = credentials.password as string;

          console.log('[authorize] attempting login for:', email);

          const user = await prisma.user.findUnique({ where: { email } });

          if (!user) {
            console.error('[authorize] user not found:', email);
            return null;
          }

          console.log('[authorize] user found, role:', user.role, 'passwordMode:', user.password?.startsWith('$2') ? 'bcrypt' : 'plaintext');

          let passwordMatch = false;

          if (user.password?.startsWith('$2')) {
            passwordMatch = await bcrypt.compare(inputPassword, user.password);
          } else {
            passwordMatch = user.password === inputPassword;
            if (passwordMatch) {
              const rehashed = await bcrypt.hash(inputPassword, 12);
              await prisma.user.update({
                where: { id: user.id },
                data: { password: rehashed },
              });
            }
          }

          console.log('[authorize] passwordMatch:', passwordMatch);

          if (!passwordMatch) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.avatar ?? null,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            role: (user.role as any) as 'USER' | 'ADMIN',
          };
        } catch (error) {
          console.error('[authorize] unexpected error:', error);
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
      const email = user.email;
      const placeholderPassword = await bcrypt.hash(randomBytes(32).toString('hex'), 12);
      await prisma.user.upsert({
        where: { email },
        create: {
          email,
          name: user.name?.trim() || 'Usuario',
          password: placeholderPassword,
          avatar: user.image ?? null,
          role: 'USER',
        },
        update: {
          name: user.name?.trim() || undefined,
          avatar: user.image ?? undefined,
        },
      });
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === 'credentials') {
          if (typeof user.id === 'string') token.id = user.id;
          token.role = ((user as { role?: 'USER' | 'ADMIN' }).role ?? 'USER');
        } else if (account?.provider === 'google' && user.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
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
