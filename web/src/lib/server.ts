import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";
import * as schema from "./schema";

/**
 * Server-only helpers shared by the `/api/*` server routes.
 * The Cloudflare D1 binding (`DB`, declared in wrangler.jsonc) is read from the
 * ambient Worker `env` and wrapped in Drizzle. CORS is preserved here because the
 * Expo mobile app calls this API cross-origin (see mobile/src/lib/config.ts).
 */

export function db() {
  return drizzle(env.DB, { schema });
}

export function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export function preflight(): Response {
  return new Response(null, { headers: cors() });
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...cors() },
  });
}

export function err(msg: string, status = 400): Response {
  return json({ error: msg }, status);
}

export function genId(len = 8): string {
  return Math.random().toString(36).substring(2, 2 + len).toUpperCase();
}

export function genJoinCode(): string {
  const alpha = "ABCDEFGHJKLMNPQRSTVWXYZ";
  return Array.from({ length: 6 }, () => alpha[Math.floor(Math.random() * alpha.length)]).join("");
}

type ServerCtx = { request: Request; params: Record<string, string> };

/** Wraps a handler so thrown errors become a JSON 500 with CORS, matching the old worker. */
export function handle(fn: (ctx: ServerCtx) => Promise<Response>) {
  return async (ctx: ServerCtx): Promise<Response> => {
    try {
      return await fn(ctx);
    } catch (e) {
      console.error(e);
      return err("Internal server error", 500);
    }
  };
}
