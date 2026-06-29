import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  advanceRound as advanceLocalRound,
  applyAssignmentChoice,
  applyPassResult,
  applyRaise,
  createGame as createLocalState,
  genId,
  type GameMode,
  type GameState,
} from "./game";
import type { Position } from "./players";
import { API_BASE } from "./config";

const BASE = API_BASE || "/api";

export interface GameSession {
  mode?: "online" | "local";
  role: "p1" | "p2" | "local";
  token: string;
  playerName: string;
  player2Name?: string;
}

export interface PollResponse {
  state: GameState;
  myRole: 1 | 2 | null;
  joinCode: string;
}

function sessionKey(gameId: string) {
  return `hb-session-${gameId}`;
}

function localGameKey(gameId: string) {
  return `hb-local-game-${gameId}`;
}

export async function saveSession(gameId: string, session: GameSession): Promise<void> {
  await AsyncStorage.setItem(sessionKey(gameId), JSON.stringify(session));
}

export async function loadSession(gameId: string): Promise<GameSession | null> {
  const raw = await AsyncStorage.getItem(sessionKey(gameId));
  if (!raw) return null;
  const parsed = JSON.parse(raw) as GameSession;
  return { ...parsed, mode: parsed.mode ?? "online" };
}

async function saveLocalGameState(gameId: string, state: GameState): Promise<void> {
  await AsyncStorage.setItem(localGameKey(gameId), JSON.stringify(state));
}

async function loadLocalGameState(gameId: string): Promise<GameState | null> {
  const raw = await AsyncStorage.getItem(localGameKey(gameId));
  return raw ? (JSON.parse(raw) as GameState) : null;
}

export async function createLocalGame(
  p1Name: string,
  p2Name: string,
  gameMode: GameMode = "nba",
): Promise<{ gameId: string; token: string }> {
  const gameId = genId();
  const state = createLocalState(gameId, p1Name, p2Name, gameMode);
  await saveLocalGameState(gameId, state);
  return { gameId, token: "local" };
}

export async function createGame(
  p1Name: string,
  gameMode: GameMode = "nba",
): Promise<{ gameId: string; joinCode: string; token: string }> {
  const res = await fetch(`${BASE}/games`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ p1Name, gameMode }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function joinGame(
  joinCode: string,
  p2Name: string,
  _gameMode?: GameMode,
): Promise<{ gameId: string; token: string }> {
  const res = await fetch(`${BASE}/games/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ joinCode: joinCode.toUpperCase(), p2Name }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({ error: "Unknown error" }))) as { error: string };
    throw new Error(body.error || "Failed to join");
  }
  return res.json();
}

export async function pollGame(gameId: string, token: string): Promise<PollResponse> {
  if (token === "local") {
    const state = await loadLocalGameState(gameId);
    if (!state) throw new Error("Local game not found");
    return { state, myRole: null, joinCode: "LOCAL" };
  }
  const res = await fetch(`${BASE}/games/${gameId}?token=${encodeURIComponent(token)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function raiseBid(gameId: string, token: string, bidCents: number): Promise<void> {
  if (token === "local") {
    const state = await loadLocalGameState(gameId);
    if (!state || state.phase !== "bidding") throw new Error("Local game not found");
    const updated = applyRaise(state, state.biddingTurn, bidCents);
    await saveLocalGameState(gameId, updated);
    return;
  }
  const res = await fetch(`${BASE}/games/${gameId}/raise`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, bidCents }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({ error: "Unknown error" }))) as { error: string };
    throw new Error(body.error || "Failed to raise bid");
  }
}

export async function passBid(gameId: string, token: string): Promise<void> {
  if (token === "local") {
    const state = await loadLocalGameState(gameId);
    if (!state || state.phase !== "bidding") throw new Error("Local game not found");
    const updated = applyPassResult(state);
    await saveLocalGameState(gameId, updated);
    return;
  }
  const res = await fetch(`${BASE}/games/${gameId}/pass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({ error: "Unknown error" }))) as { error: string };
    throw new Error(body.error || "Failed to pass");
  }
}

export async function advanceRound(gameId: string, token: string): Promise<void> {
  if (token === "local") {
    const state = await loadLocalGameState(gameId);
    if (!state) throw new Error("Local game not found");
    if (state.phase !== "reveal") return;
    const updated = advanceLocalRound(state);
    await saveLocalGameState(gameId, updated);
    return;
  }
  const res = await fetch(`${BASE}/games/${gameId}/advance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function assignSlot(gameId: string, token: string, position: Position): Promise<void> {
  if (token === "local") {
    const state = await loadLocalGameState(gameId);
    if (!state) throw new Error("Local game not found");
    const winner = state.lastResult?.winner;
    if (!winner) throw new Error("No player awaiting placement");
    const updated = applyAssignmentChoice(state, winner, position);
    await saveLocalGameState(gameId, updated);
    return;
  }

  const res = await fetch(`${BASE}/games/${gameId}/assign-slot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, position }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({ error: "Unknown error" }))) as { error: string };
    throw new Error(body.error || "Failed to assign slot");
  }
}
