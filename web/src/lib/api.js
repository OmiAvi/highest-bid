import { advanceRound as advanceLocalRound, applyAssignmentChoice, applyPassResult, applyRaise, createGame as createLocalState, genId } from "./game";
const BASE = import.meta.env.VITE_API_BASE?.replace(/\/$/, "") || "/api";
function sessionKey(gameId) {
    return `hb-session-${gameId}`;
}
function localGameKey(gameId) {
    return `hb-local-game-${gameId}`;
}
export function saveSession(gameId, session) {
    localStorage.setItem(sessionKey(gameId), JSON.stringify(session));
}
export function loadSession(gameId) {
    const raw = localStorage.getItem(sessionKey(gameId));
    if (!raw)
        return null;
    const parsed = JSON.parse(raw);
    return { ...parsed, mode: parsed.mode ?? "online" };
}
function saveLocalGameState(gameId, state) {
    localStorage.setItem(localGameKey(gameId), JSON.stringify(state));
}
function loadLocalGameState(gameId) {
    const raw = localStorage.getItem(localGameKey(gameId));
    return raw ? JSON.parse(raw) : null;
}
export function createLocalGame(p1Name, p2Name, gameMode = "nba") {
    const gameId = genId();
    const state = createLocalState(gameId, p1Name, p2Name, gameMode);
    saveLocalGameState(gameId, state);
    return { gameId, token: "local" };
}
export async function createGame(p1Name, gameMode = "nba") {
    const res = await fetch(`${BASE}/games`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ p1Name, gameMode }),
    });
    if (!res.ok)
        throw new Error(await res.text());
    return res.json();
}
export async function joinGame(joinCode, p2Name, _gameMode) {
    const res = await fetch(`${BASE}/games/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode: joinCode.toUpperCase(), p2Name }),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(body.error || "Failed to join");
    }
    return res.json();
}
export async function pollGame(gameId, token) {
    if (token === "local") {
        const state = loadLocalGameState(gameId);
        if (!state)
            throw new Error("Local game not found");
        return { state, myRole: null, joinCode: "LOCAL" };
    }
    const res = await fetch(`${BASE}/games/${gameId}?token=${encodeURIComponent(token)}`);
    if (!res.ok)
        throw new Error(await res.text());
    return res.json();
}
export async function raiseBid(gameId, token, bidCents) {
    if (token === "local") {
        const state = loadLocalGameState(gameId);
        if (!state || state.phase !== "bidding")
            throw new Error("Local game not found");
        const updated = applyRaise(state, state.biddingTurn, bidCents);
        saveLocalGameState(gameId, updated);
        return;
    }
    const res = await fetch(`${BASE}/games/${gameId}/raise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, bidCents }),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(body.error || "Failed to raise bid");
    }
}
export async function passBid(gameId, token) {
    if (token === "local") {
        const state = loadLocalGameState(gameId);
        if (!state || state.phase !== "bidding")
            throw new Error("Local game not found");
        const updated = applyPassResult(state);
        saveLocalGameState(gameId, updated);
        return;
    }
    const res = await fetch(`${BASE}/games/${gameId}/pass`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(body.error || "Failed to pass");
    }
}
export async function advanceRound(gameId, token) {
    if (token === "local") {
        const state = loadLocalGameState(gameId);
        if (!state)
            throw new Error("Local game not found");
        if (state.phase !== "reveal")
            return;
        const updated = advanceLocalRound(state);
        saveLocalGameState(gameId, updated);
        return;
    }
    const res = await fetch(`${BASE}/games/${gameId}/advance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
    });
    if (!res.ok)
        throw new Error(await res.text());
}
export async function assignSlot(gameId, token, position) {
    if (token === "local") {
        const state = loadLocalGameState(gameId);
        if (!state)
            throw new Error("Local game not found");
        const winner = state.lastResult?.winner;
        if (!winner)
            throw new Error("No player awaiting placement");
        const updated = applyAssignmentChoice(state, winner, position);
        saveLocalGameState(gameId, updated);
        return;
    }
    const res = await fetch(`${BASE}/games/${gameId}/assign-slot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, position }),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(body.error || "Failed to assign slot");
    }
}
