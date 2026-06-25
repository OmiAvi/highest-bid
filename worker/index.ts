/// <reference types="@cloudflare/workers-types" />

export interface Env {
  DB: D1Database;
}

function cors(origin: string = "*") {
  return {
    "Access-Control-Allow-Origin": origin,
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors() });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // POST /api/games — create game
      if (path === "/api/games" && request.method === "POST") {
        const body = (await request.json()) as { player1?: string; player2?: string; state?: string };
        const id = genId();
        const p1 = body.player1 || "Player 1";
        const p2 = body.player2 || "Player 2";
        const stateJson = body.state || "{}";

        await env.DB.prepare(
          `INSERT INTO games (id, player1_name, player2_name, state_json) VALUES (?, ?, ?, ?)`
        )
          .bind(id, p1, p2, stateJson)
          .run();

        return json({ id, player1_name: p1, player2_name: p2 });
      }

      // GET /api/games/:id — get game state
      if (path.startsWith("/api/games/") && request.method === "GET") {
        const id = path.split("/")[3];
        const game = await env.DB.prepare("SELECT * FROM games WHERE id = ?")
          .bind(id)
          .first<{ id: string; player1_name: string; player2_name: string; state_json: string }>();

        if (!game) return err("Game not found", 404);

        const log = await env.DB.prepare(
          "SELECT * FROM auction_log WHERE game_id = ? ORDER BY round_number"
        )
          .bind(id)
          .all<Record<string, unknown>>();

        return json({ ...game, state: JSON.parse(game.state_json), log: log.results });
      }

      // PUT /api/games/:id — save game state
      if (path.startsWith("/api/games/") && request.method === "PUT") {
        const id = path.split("/")[3];
        const body = (await request.json()) as { state: unknown };

        await env.DB.prepare(
          `UPDATE games SET state_json = ?, updated_at = unixepoch() WHERE id = ?`
        )
          .bind(JSON.stringify(body.state), id)
          .run();

        return json({ ok: true });
      }

      // POST /api/games/:id/log — append auction log entry
      if (path.match(/^\/api\/games\/[^/]+\/log$/) && request.method === "POST") {
        const id = path.split("/")[3];
        const body = (await request.json()) as {
          player_name: string;
          player_position: string;
          player_team: string;
          player_rating: number;
          winner: number | null;
          winning_bid: number | null;
          player1_bid: number;
          player2_bid: number;
          round_number: number;
        };

        await env.DB.prepare(
          `INSERT INTO auction_log (id, game_id, player_name, player_position, player_team, player_rating, winner, winning_bid, player1_bid, player2_bid, round_number)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(
            genId(12),
            id,
            body.player_name,
            body.player_position,
            body.player_team,
            body.player_rating,
            body.winner,
            body.winning_bid,
            body.player1_bid,
            body.player2_bid,
            body.round_number
          )
          .run();

        return json({ ok: true });
      }

      return err("Not found", 404);
    } catch (e) {
      console.error(e);
      return err("Internal server error", 500);
    }
  },
};
