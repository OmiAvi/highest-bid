import { createFileRoute } from "@tanstack/react-router";
import { applyPassResult, type GameState } from "../../lib/game";
import { err, handle, json, preflight } from "../../lib/server";
import { getGameById, roleOf, updateGameState } from "../../lib/queries";

// POST /api/games/:id/pass — pass (end bidding or give opponent a chance)
export const Route = createFileRoute("/api/games/$gameId/pass")({
  server: {
    handlers: {
      OPTIONS: () => preflight(),
      POST: handle(async ({ request, params }) => {
        const body = (await request.json()) as { token: string };
        const game = await getGameById(params.gameId);

        if (!game) return err("Game not found", 404);

        const playerNum = roleOf(body.token, game);
        if (!playerNum) return err("Unauthorized", 403);

        const state: GameState = JSON.parse(game.stateJson);
        if (state.phase !== "bidding") return err("Not in bidding phase");
        if (state.biddingTurn !== playerNum) return err("Not your turn");

        const newState = applyPassResult(state);
        await updateGameState(params.gameId, JSON.stringify(newState));

        return json({ ok: true });
      }),
    },
  },
});
