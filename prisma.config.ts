import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Prefer .env.local for local development values (Supabase credentials),
// then fall back to .env.
config({ path: ".env.local" });
config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
