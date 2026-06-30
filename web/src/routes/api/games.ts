import { createFileRoute } from "@tanstack/react-router";
import { createWaitingGame, type GameMode } from "../../lib/game";
import { genId, genJoinCode, handle, json, preflight } from "../../lib/server";
import { insertGame } from "../../lib/queries";

// POST /api/games — create a game (Player 1)
export const Route = createFileRoute("/api/games")({
  server: {
    handlers: {
      OPTIONS: () => preflight(),
      POST: handle(async ({ request }) => {
        const body = (await request.json()) as { p1Name?: string; gameMode?: GameMode };
        const id = genId();
        const joinCode = genJoinCode();
        const p1Token = genId(16);
        const p1Name = (body.p1Name || "Player 1").trim().slice(0, 20);
        const gameMode: GameMode = body.gameMode === "cbb" ? "cbb" : "nba";
        const state = createWaitingGame(id, p1Name, gameMode);

        await insertGame({ id, player1Name: p1Name, joinCode, p1Token, stateJson: JSON.stringify(state) });

        return json({ gameId: id, joinCode, token: p1Token });
      }),
    },
  },
});
