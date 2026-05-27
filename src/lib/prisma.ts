import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

type G = typeof globalThis & {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

function makePool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }
  return new Pool({
    connectionString,
    // Stay well under Supabase session pooler limits (often 15).
    max: Number(process.env.DATABASE_POOL_MAX ?? 4),
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 15_000,
  });
}

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

  const g = globalThis as G;
  const pool = g.pgPool ?? makePool();
  g.pgPool = pool;

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const g = globalThis as G;

export const prisma: PrismaClient = g.prisma ?? makePrismaClient();

if (process.env.NODE_ENV !== 'production') g.prisma = prisma;
