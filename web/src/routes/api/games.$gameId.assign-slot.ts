import { createFileRoute } from "@tanstack/react-router";
import { applyAssignmentChoice, type GameState } from "../../lib/game";
import type { Position } from "../../lib/players";
import { err, handle, json, preflight } from "../../lib/server";
import { getGameById, roleOf, updateGameState } from "../../lib/queries";

// POST /api/games/:id/assign-slot — winner chooses a lineup slot (reveal phase)
export const Route = createFileRoute("/api/games/$gameId/assign-slot")({
  server: {
    handlers: {
      OPTIONS: () => preflight(),
      POST: handle(async ({ request, params }) => {
        const body = (await request.json()) as { token: string; position: Position };
        const game = await getGameById(params.gameId);

        if (!game) return err("Game not found", 404);

        const playerNum = roleOf(body.token, game);
        if (!playerNum) return err("Unauthorized", 403);

        const state: GameState = JSON.parse(game.stateJson);
        if (state.phase !== "reveal") return err("Not in reveal phase");
        if (!state.lastResult?.winner) return err("No player awaiting placement");
        if (state.lastResult.winner !== playerNum) return err("Only the winner can choose the slot");
        if (state.lastResult.assignedSlot) return err("Player already assigned");

        const newState = applyAssignmentChoice(state, playerNum, body.position);
        await updateGameState(params.gameId, JSON.stringify(newState));

        return json({ ok: true });
      }),
    },
  },
});
