import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // Prisma CLI (db push, migrate, etc.) needs a direct/session connection.
  // Do not use the Supabase transaction pooler (port 6543) here — it hangs silently.
  datasource: {
    url: env("DIRECT_URL"),
  },
});