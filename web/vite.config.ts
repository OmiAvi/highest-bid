import { defineConfig, type Plugin } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";

/**
 * Native HTTP clients (Android/OkHttp via expo-image) keep connections pooled
 * for minutes, but Node's default keepAliveTimeout is 5s. When the client
 * reuses a connection the dev server already closed, it reads EOF and throws
 * "unexpected end of stream", so headshots intermittently fail to load on the
 * mobile app (which hits this server over `adb reverse`). Hold dev connections
 * open longer so the pool stays valid.
 */
function devKeepAlive(): Plugin {
  return {
    name: "dev-keep-alive",
    apply: "serve",
    configureServer(server) {
      const http = server.httpServer;
      if (http) {
        http.keepAliveTimeout = 120_000;
        http.headersTimeout = 125_000;
      }
    },
  };
}

export default defineConfig({
  plugins: [
    devKeepAlive(),
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart(),
    react(),
  ],
});
