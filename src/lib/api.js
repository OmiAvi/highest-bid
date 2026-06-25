const BASE = import.meta.env.VITE_API_BASE?.replace(/\/$/, "") || "/api";
function sessionKey(gameId) {
    return `hb-session-${gameId}`;
}
export function saveSession(gameId, session) {
    localStorage.setItem(sessionKey(gameId), JSON.stringify(session));
}
export function loadSession(gameId) {
    const raw = localStorage.getItem(sessionKey(gameId));
    return raw ? JSON.parse(raw) : null;
}
export async function createGame(p1Name) {
    const res = await fetch(`${BASE}/games`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ p1Name }),
    });
    if (!res.ok)
        throw new Error(await res.text());
    return res.json();
}
export async function joinGame(joinCode, p2Name) {
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
    const res = await fetch(`${BASE}/games/${gameId}?token=${encodeURIComponent(token)}`);
    if (!res.ok)
        throw new Error(await res.text());
    return res.json();
}
export async function raiseBid(gameId, token, bidCents) {
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
    const res = await fetch(`${BASE}/games/${gameId}/advance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
    });
    if (!res.ok)
        throw new Error(await res.text());
}
