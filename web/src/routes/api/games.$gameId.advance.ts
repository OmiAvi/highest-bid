import { createFileRoute } from "@tanstack/react-router";
import { advanceRound, type GameState } from "../../lib/game";
import { err, handle, json, preflight } from "../../lib/server";
import { getGameById, roleOf, updateGameState } from "../../lib/queries";

// POST /api/games/:id/advance — advance to next round (after reveal)
export const Route = createFileRoute("/api/games/$gameId/advance")({
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
        if (state.phase !== "reveal") return json({ ok: true }); // idempotent
        if (state.lastResult?.winner && !state.lastResult.assignedSlot) return err("Choose a lineup slot first");

        const newState = advanceRound(state);
        await updateGameState(params.gameId, JSON.stringify(newState));

        return json({ ok: true });
      }),
    },
  },
});
