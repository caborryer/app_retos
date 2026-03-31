import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null;
          const email = credentials.email as string;
          const inputPassword = credentials.password as string;

          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) return null;

          let passwordMatch = false;

          // Current path: hashed password
          if (user.password?.startsWith('$2')) {
            passwordMatch = await bcrypt.compare(inputPassword, user.password);
          } else {
            // Legacy fallback: plain-text password stored in DB.
            // If it matches, migrate it immediately to bcrypt hash.
            passwordMatch = user.password === inputPassword;
            if (passwordMatch) {
              const rehashed = await bcrypt.hash(inputPassword, 12);
              await prisma.user.update({
                where: { id: user.id },
                data: { password: rehashed },
              });
            }
          }

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
          console.error('NextAuth authorize error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        if (typeof user.id === 'string') token.id = user.id;
        token.role = ((user as { role?: 'USER' | 'ADMIN' }).role ?? 'USER');
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as 'USER' | 'ADMIN';
      return session;
    },
  },
});
