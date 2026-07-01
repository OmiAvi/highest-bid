import { createFileRoute } from "@tanstack/react-router";
import { applyRaise, getMaxBidForPlayer, type GameState } from "../../lib/game";
import { err, handle, json, preflight } from "../../lib/server";
import { getGameById, roleOf, updateGameState } from "../../lib/queries";

// POST /api/games/:id/raise — raise the current bid
export const Route = createFileRoute("/api/games/$gameId/raise")({
  server: {
    handlers: {
      OPTIONS: () => preflight(),
      POST: handle(async ({ request, params }) => {
        const body = (await request.json()) as { token: string; bidCents: number };
        const game = await getGameById(params.gameId);

        if (!game) return err("Game not found", 404);

        const playerNum = roleOf(body.token, game);
        if (!playerNum) return err("Unauthorized", 403);

        const state: GameState = JSON.parse(game.stateJson);
        if (state.phase !== "bidding") return err("Not in bidding phase");
        if (state.biddingTurn !== playerNum) return err("Not your turn");

        const bid = Math.round(Number(body.bidCents));
        const maxBid = getMaxBidForPlayer(state, playerNum);

        if (isNaN(bid) || bid <= state.currentBid) return err("Bid must be higher than current bid");
        if (bid > maxBid) return err(`Bid exceeds your max allowed bid of $${maxBid}`);

        const newState = applyRaise(state, playerNum, bid);
        await updateGameState(params.gameId, JSON.stringify(newState));

        return json({ ok: true });
      }),
    },
  },
});
