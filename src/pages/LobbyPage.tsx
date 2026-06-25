import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { createGame, joinGame, saveSession } from "../lib/api";

type Tab = "create" | "join";

export function LobbyPage() {
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>("create");
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const { gameId, joinCode: code, token } = await createGame(name.trim() || "Player 1");
      saveSession(gameId, { role: "p1", token, playerName: name.trim() || "Player 1" });
      nav({ to: "/game/$gameId", params: { gameId } });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create game");
    } finally { setLoading(false); }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!joinCode.trim()) { setError("Enter a join code"); return; }
    setLoading(true); setError("");
    try {
      const { gameId, token } = await joinGame(joinCode.trim(), name.trim() || "Player 2");
      saveSession(gameId, { role: "p2", token, playerName: name.trim() || "Player 2" });
      nav({ to: "/game/$gameId", params: { gameId } });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to join");
    } finally { setLoading(false); }
  }

  const isCreate = tab === "create";

  return (
    <div style={s.page}>
      {/* Subtle mesh gradient */}
      <div style={s.mesh} />

      <div style={s.wrap}>
        {/* Wordmark */}
        <div style={s.header}>
          <div style={s.logoText}>Highest Bid</div>
          <div style={s.tagline}>NBA Draft Auction</div>
        </div>

        {/* How to play */}
        <div style={s.card}>
          <div style={s.cardLabel}>How it works</div>
          <div style={s.rules}>
            {[
              "One player creates a game and shares the 6-letter join code",
              "A random NBA player is put up for auction each round",
              "Players take turns bidding — raise or pass",
              "Pass and the current leader wins the player",
              "Fill your PG · SG · SF · PF · C slots with the best team",
            ].map((rule, i) => (
              <div key={i} style={s.rule}>
                <span style={s.ruleN}>{String(i + 1).padStart(2, "0")}</span>
                <span style={s.ruleT}>{rule}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Create / Join form */}
        <div style={s.card}>
          {/* Tabs */}
          <div style={s.tabs}>
            <button style={{ ...s.tab, ...(isCreate ? s.tabActive : {}) }} onClick={() => { setTab("create"); setError(""); }}>
              Create game
            </button>
            <button style={{ ...s.tab, ...(!isCreate ? s.tabActive : {}) }} onClick={() => { setTab("join"); setError(""); }}>
              Join with code
            </button>
          </div>

          {isCreate ? (
            <form onSubmit={handleCreate} style={s.form}>
              <label style={s.label}>Your name</label>
              <input
                style={s.input}
                placeholder="Player 1"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={20}
                autoFocus
              />
              {error && <div style={s.errMsg}>{error}</div>}
              <button type="submit" style={s.btnPrimary} disabled={loading}>
                {loading ? "Creating…" : "Create game"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin} style={s.form}>
              <label style={s.label}>Join code</label>
              <input
                style={{ ...s.input, ...s.codeInput }}
                placeholder="ABCXYZ"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                maxLength={6}
                autoCapitalize="characters"
                spellCheck={false}
                autoFocus
              />
              <label style={s.label}>Your name</label>
              <input
                style={s.input}
                placeholder="Player 2"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={20}
              />
              {error && <div style={s.errMsg}>{error}</div>}
              <button type="submit" style={{ ...s.btnPrimary, background: "var(--accent)" }} disabled={loading}>
                {loading ? "Joining…" : "Join game"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    padding: "40px 16px", position: "relative",
  },
  mesh: {
    position: "absolute", inset: 0, pointerEvents: "none",
    background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(94,106,210,0.08) 0%, transparent 100%)",
  },
  wrap: {
    width: "100%", maxWidth: 480, display: "flex", flexDirection: "column",
    gap: 16, position: "relative", zIndex: 1, animation: "fadeUp 0.3s ease-out",
  },
  header: { marginBottom: 4, textAlign: "center" as const },
  logoText: {
    fontFamily: "var(--font-d)", fontSize: 48, fontWeight: 800,
    color: "var(--white)", letterSpacing: "-0.03em", lineHeight: 1.05,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 20, color: "var(--white-dim)", fontWeight: 500, letterSpacing: "0.01em",
  },
  card: {
    background: "var(--court-surface)", border: "1px solid var(--border)",
    borderRadius: 12, padding: "20px",
  },
  cardLabel: {
    fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
    color: "var(--white-dim)", textTransform: "uppercase" as const, marginBottom: 14,
  },
  rules: { display: "flex", flexDirection: "column", gap: 10 },
  rule: { display: "flex", alignItems: "baseline", gap: 12 },
  ruleN: {
    fontFamily: "var(--font-d)", fontSize: 13, fontWeight: 700,
    color: "var(--gold)", minWidth: 22, letterSpacing: "0.02em",
  },
  ruleT: { fontSize: 13, color: "var(--white-dim)", lineHeight: 1.5 },
  tabs: {
    display: "flex", gap: 2, marginBottom: 20,
    background: "var(--court-mid)", borderRadius: 8, padding: 3,
  },
  tab: {
    flex: 1, padding: "7px 12px", borderRadius: 6,
    fontFamily: "var(--font-d)", fontSize: 13, fontWeight: 600,
    color: "var(--white-dim)", background: "transparent", border: "none",
    transition: "all 150ms ease-out",
  },
  tabActive: {
    background: "var(--court-surface)", color: "var(--white)",
    boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
  },
  form: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 12, fontWeight: 500, color: "var(--white-dim)", marginBottom: 2 },
  input: {
    background: "var(--court-mid)", border: "1px solid var(--border-strong)",
    borderRadius: 7, padding: "9px 12px",
    color: "var(--white)", fontSize: 14, fontWeight: 500,
    transition: "border-color 150ms ease-out",
  },
  codeInput: {
    fontFamily: "var(--font-d)", fontSize: 22, fontWeight: 700,
    letterSpacing: "0.16em", color: "var(--accent)",
  },
  errMsg: {
    fontSize: 12, color: "#F87171",
    background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
    borderRadius: 6, padding: "8px 12px",
  },
  btnPrimary: {
    marginTop: 4, padding: "10px 16px",
    background: "var(--gold)", color: "#fff",
    fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 600,
    letterSpacing: "0.02em", borderRadius: 7, border: "none",
    transition: "opacity 150ms ease-out",
  },
};
