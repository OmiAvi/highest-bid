import type { GameState } from "./game";

const BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") || "/api";

export interface GameSession {
  role: "p1" | "p2";
  token: string;
  playerName: string;
}

export interface PollResponse {
  state: GameState;
  myRole: 1 | 2 | null;
  joinCode: string;
}

function sessionKey(gameId: string) {
  return `hb-session-${gameId}`;
}

export function saveSession(gameId: string, session: GameSession) {
  localStorage.setItem(sessionKey(gameId), JSON.stringify(session));
}

export function loadSession(gameId: string): GameSession | null {
  const raw = localStorage.getItem(sessionKey(gameId));
  return raw ? (JSON.parse(raw) as GameSession) : null;
}

export async function createGame(p1Name: string): Promise<{ gameId: string; joinCode: string; token: string }> {
  const res = await fetch(`${BASE}/games`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ p1Name }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function joinGame(joinCode: string, p2Name: string): Promise<{ gameId: string; token: string }> {
  const res = await fetch(`${BASE}/games/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ joinCode: joinCode.toUpperCase(), p2Name }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" })) as { error: string };
    throw new Error(body.error || "Failed to join");
  }
  return res.json();
}

export async function pollGame(gameId: string, token: string): Promise<PollResponse> {
  const res = await fetch(`${BASE}/games/${gameId}?token=${encodeURIComponent(token)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function raiseBid(gameId: string, token: string, bidCents: number): Promise<void> {
  const res = await fetch(`${BASE}/games/${gameId}/raise`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, bidCents }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" })) as { error: string };
    throw new Error(body.error || "Failed to raise bid");
  }
}

export async function passBid(gameId: string, token: string): Promise<void> {
  const res = await fetch(`${BASE}/games/${gameId}/pass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" })) as { error: string };
    throw new Error(body.error || "Failed to pass");
  }
}

export async function advanceRound(gameId: string, token: string): Promise<void> {
  const res = await fetch(`${BASE}/games/${gameId}/advance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) throw new Error(await res.text());
}
