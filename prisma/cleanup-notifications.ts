/**
 * One-off: delete all Notification rows (post cross-user client fix cleanup).
 * Run: npx tsx prisma/cleanup-notifications.ts
 */
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

config({ path: '.env.local' });
config({ path: '.env' });

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const pool = new Pool({ connectionString });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const before = await prisma.notification.count();
    console.log(`Notifications in DB before cleanup: ${before}`);

    if (before === 0) {
      console.log('Nothing to delete.');
      return;
    }

    const { count } = await prisma.notification.deleteMany({});
    const after = await prisma.notification.count();
    console.log(`Deleted: ${count}`);
    console.log(`Remaining: ${after}`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
