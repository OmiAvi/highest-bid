import { createFileRoute } from "@tanstack/react-router";
import type { GameState } from "../../lib/game";
import { err, handle, json, preflight } from "../../lib/server";
import { getGameById, roleOf } from "../../lib/queries";

// GET /api/games/:id — poll game state
export const Route = createFileRoute("/api/games/$gameId")({
  server: {
    handlers: {
      OPTIONS: () => preflight(),
      GET: handle(async ({ request, params }) => {
        const token = new URL(request.url).searchParams.get("token") ?? "";
        const game = await getGameById(params.gameId);

        if (!game) return err("Game not found", 404);

        const myRole = roleOf(token, game);
        const state: GameState = JSON.parse(game.stateJson);

        return json({ state, myRole, joinCode: game.joinCode });
      }),
    },
  },
});
