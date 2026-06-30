import { createFileRoute } from "@tanstack/react-router";
import type { GameState } from "../../lib/game";
import { err, genId, handle, json, preflight } from "../../lib/server";
import { getGameByJoinCode, joinGame } from "../../lib/queries";

// POST /api/games/join — join a game (Player 2)
export const Route = createFileRoute("/api/games/join")({
  server: {
    handlers: {
      OPTIONS: () => preflight(),
      POST: handle(async ({ request }) => {
        const body = (await request.json()) as { joinCode?: string; p2Name?: string };
        if (!body.joinCode) return err("joinCode required");

        const code = body.joinCode.trim().toUpperCase();
        const p2Name = (body.p2Name || "Player 2").trim().slice(0, 20);
        const game = await getGameByJoinCode(code);

        if (!game) return err("Game not found", 404);

        const state: GameState = JSON.parse(game.stateJson);
        if (state.phase !== "waiting") return err("Game already in progress", 409);

        const p2Token = genId(16);
        state.p2Name = p2Name;
        state.phase = "bidding";

        await joinGame(game.id, p2Name, p2Token, JSON.stringify(state));

        return json({ gameId: game.id, token: p2Token });
      }),
    },
  },
});
