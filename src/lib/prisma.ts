import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

type G = typeof globalThis & { prisma?: PrismaClient };

function makePrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    // Return a Proxy so the module can be imported at build time without
    // throwing. Any actual query at runtime will fail with a clear message.
    return new Proxy({} as PrismaClient, {
      get(_, prop: string) {
        throw new Error(
          `DATABASE_URL is not set. Cannot execute prisma.${prop}(). ` +
            'Make sure DATABASE_URL is configured in your environment.',
        );
      },
    });
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

const g = globalThis as G;

export const prisma: PrismaClient = g.prisma ?? makePrismaClient();

if (process.env.NODE_ENV !== 'production') g.prisma = prisma;
