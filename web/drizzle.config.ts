import { defineConfig } from "drizzle-kit";

/**
 * Drizzle is used as the typed query layer over Cloudflare D1 (see src/lib/schema.ts).
 * The hand-written SQL in ./migrations is what's actually applied to D1 and remains
 * the source of truth. This config enables drizzle-kit tooling (e.g. `drizzle-kit
 * generate` into ./drizzle, `drizzle-kit studio`) against the same schema.
 */
export default defineConfig({
  schema: "./src/lib/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
});
