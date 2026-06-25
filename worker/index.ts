/// <reference types="@cloudflare/workers-types" />

import { createWaitingGame, applyRaise, applyPassResult, advanceRound } from "../src/lib/game";
import type { GameState } from "../src/lib/game";

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
}

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...cors() },
  });
}

function err(msg: string, status = 400) {
  return json({ error: msg }, status);
}

function genId(len = 8) {
  return Math.random().toString(36).substring(2, 2 + len).toUpperCase();
}

function genJoinCode(): string {
  const alpha = "ABCDEFGHJKLMNPQRSTVWXYZ";
  return Array.from({ length: 6 }, () => alpha[Math.floor(Math.random() * alpha.length)]).join("");
}

interface GameRow {
  id: string;
  player1_name: string;
  player2_name: string;
  state_json: string;
  join_code: string | null;
  p1_token: string | null;
  p2_token: string | null;
}

function roleOf(token: string, game: GameRow): 1 | 2 | null {
  if (token === game.p1_token) return 1;
  if (token === game.p2_token) return 2;
  return null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors() });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // POST /api/games — create game (P1)
      if (path === "/api/games" && request.method === "POST") {
        const body = (await request.json()) as { p1Name?: string };
        const id = genId();
        const joinCode = genJoinCode();
        const p1Token = genId(16);
        const p1Name = (body.p1Name || "Player 1").trim().slice(0, 20);
        const state = createWaitingGame(id, p1Name);

        await env.DB.prepare(
          `INSERT INTO games (id, player1_name, player2_name, state_json, join_code, p1_token, p2_token)
           VALUES (?, ?, ?, ?, ?, ?, NULL)`
        ).bind(id, p1Name, "Player 2", JSON.stringify(state), joinCode, p1Token).run();

        return json({ gameId: id, joinCode, token: p1Token });
      }

      // POST /api/games/join — join game (P2)
      if (path === "/api/games/join" && request.method === "POST") {
        const body = (await request.json()) as { joinCode?: string; p2Name?: string };
        if (!body.joinCode) return err("joinCode required");

        const code = body.joinCode.trim().toUpperCase();
        const p2Name = (body.p2Name || "Player 2").trim().slice(0, 20);
        const game = await env.DB.prepare("SELECT * FROM games WHERE join_code = ?")
          .bind(code).first<GameRow>();

        if (!game) return err("Game not found", 404);

        const state: GameState = JSON.parse(game.state_json);
        if (state.phase !== "waiting") return err("Game already in progress", 409);

        const p2Token = genId(16);
        state.p2Name = p2Name;
        state.phase = "bidding";

        await env.DB.prepare(
          `UPDATE games SET player2_name = ?, p2_token = ?, state_json = ? WHERE id = ?`
        ).bind(p2Name, p2Token, JSON.stringify(state), game.id).run();

        return json({ gameId: game.id, token: p2Token });
      }

      // GET /api/games/:id — poll game state
      if (path.match(/^\/api\/games\/[^/]+$/) && request.method === "GET") {
        const id = path.split("/")[3];
        const token = url.searchParams.get("token") ?? "";
        const game = await env.DB.prepare("SELECT * FROM games WHERE id = ?")
          .bind(id).first<GameRow>();

        if (!game) return err("Game not found", 404);

        const myRole = roleOf(token, game);
        const state: GameState = JSON.parse(game.state_json);

        return json({ state, myRole, joinCode: game.join_code });
      }

      // POST /api/games/:id/raise — raise the current bid
      if (path.match(/^\/api\/games\/[^/]+\/raise$/) && request.method === "POST") {
        const id = path.split("/")[3];
        const body = (await request.json()) as { token: string; bidCents: number };
        const game = await env.DB.prepare("SELECT * FROM games WHERE id = ?")
          .bind(id).first<GameRow>();

        if (!game) return err("Game not found", 404);

        const playerNum = roleOf(body.token, game);
        if (!playerNum) return err("Unauthorized", 403);

        const state: GameState = JSON.parse(game.state_json);
        if (state.phase !== "bidding") return err("Not in bidding phase");
        if (state.biddingTurn !== playerNum) return err("Not your turn");

        const budget = playerNum === 1 ? state.p1Budget : state.p2Budget;
        const bid = Math.round(Number(body.bidCents));

        if (isNaN(bid) || bid <= state.currentBid) return err("Bid must be higher than current bid");
        if (bid > budget) return err("Bid exceeds your budget");

        const newState = applyRaise(state, playerNum, bid);
        await env.DB.prepare(`UPDATE games SET state_json = ? WHERE id = ?`)
          .bind(JSON.stringify(newState), id).run();

        return json({ ok: true });
      }

      // POST /api/games/:id/pass — pass (end bidding or give opponent a chance)
      if (path.match(/^\/api\/games\/[^/]+\/pass$/) && request.method === "POST") {
        const id = path.split("/")[3];
        const body = (await request.json()) as { token: string };
        const game = await env.DB.prepare("SELECT * FROM games WHERE id = ?")
          .bind(id).first<GameRow>();

        if (!game) return err("Game not found", 404);

        const playerNum = roleOf(body.token, game);
        if (!playerNum) return err("Unauthorized", 403);

        const state: GameState = JSON.parse(game.state_json);
        if (state.phase !== "bidding") return err("Not in bidding phase");
        if (state.biddingTurn !== playerNum) return err("Not your turn");

        const newState = applyPassResult(state);
        await env.DB.prepare(`UPDATE games SET state_json = ? WHERE id = ?`)
          .bind(JSON.stringify(newState), id).run();

        return json({ ok: true });
      }

      // POST /api/games/:id/advance — advance to next round (after reveal)
      if (path.match(/^\/api\/games\/[^/]+\/advance$/) && request.method === "POST") {
        const id = path.split("/")[3];
        const body = (await request.json()) as { token: string };
        const game = await env.DB.prepare("SELECT * FROM games WHERE id = ?")
          .bind(id).first<GameRow>();

        if (!game) return err("Game not found", 404);

        const playerNum = roleOf(body.token, game);
        if (!playerNum) return err("Unauthorized", 403);

        const state: GameState = JSON.parse(game.state_json);
        if (state.phase !== "reveal") return json({ ok: true }); // idempotent

        const newState = advanceRound(state);
        await env.DB.prepare(`UPDATE games SET state_json = ? WHERE id = ?`)
          .bind(JSON.stringify(newState), id).run();

        return json({ ok: true });
      }

      return env.ASSETS.fetch(request);
    } catch (e) {
      console.error(e);
      return err("Internal server error", 500);
    }
  },
};
