import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // Read the URL from process.env rather than the strict `env()` helper so that
  // `prisma generate` (run on postinstall) works even before .env is created.
  // Migrations still fail clearly if DATABASE_URL is missing.
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
