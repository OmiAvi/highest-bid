import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { createGame, genId } from "../lib/game";

export function LobbyPage() {
  const nav = useNavigate();
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");

  function start(e: React.FormEvent) {
    e.preventDefault();
    const id = genId();
    const state = createGame(id, p1.trim() || "Player 1", p2.trim() || "Player 2");
    sessionStorage.setItem(`hb-${id}`, JSON.stringify(state));
    nav({ to: "/game/$gameId", params: { gameId: id } });
  }

  return (
    <div style={s.page}>
      {/* Court lines BG */}
      <svg style={s.bg} viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
        <circle cx="400" cy="300" r="220" fill="none" stroke="#C17B3D" strokeWidth="2" opacity="0.06"/>
        <circle cx="400" cy="300" r="60"  fill="none" stroke="#C17B3D" strokeWidth="2" opacity="0.06"/>
        <line x1="0" y1="300" x2="800" y2="300" stroke="#C17B3D" strokeWidth="2" opacity="0.06"/>
        <path d="M0,500 Q400,180 800,500" fill="none" stroke="#C17B3D" strokeWidth="2" opacity="0.06"/>
      </svg>

      <div style={s.wrap}>
        {/* Hero */}
        <div style={s.hero}>
          <div style={s.gavel}>🔨</div>
          <h1 style={s.title}>HIGHEST BID</h1>
          <p style={s.sub}>NBA DRAFT AUCTION</p>
          <div style={s.pills}>
            <Pill>$20 Budget Each</Pill>
            <Pill>Sealed Simultaneous Bids</Pill>
            <Pill>Build Your Best 5</Pill>
          </div>
        </div>

        {/* Rules card */}
        <div style={s.card}>
          <div style={s.cardLabel}>HOW TO PLAY</div>
          {[
            ["01", "A random NBA starter is revealed each round"],
            ["02", "Both players privately enter their bid from their $20 budget"],
            ["03", "Bids lock in — then both are revealed simultaneously"],
            ["04", "Highest bid wins the player for their PG/SG/SF/PF/C slot"],
            ["05", "Fill your 5-man lineup and compare rosters to find the champion"],
          ].map(([n, rule]) => (
            <div key={n} style={s.rule}>
              <span style={s.ruleN}>{n}</span>
              <span style={s.ruleT}>{rule}</span>
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={start} style={s.form}>
          <div style={s.inputs}>
            <PlayerInput
              num={1} value={p1} onChange={setP1} color="var(--gold)"
            />
            <div style={s.vs}>VS</div>
            <PlayerInput
              num={2} value={p2} onChange={setP2} color="var(--accent)"
            />
          </div>
          <button type="submit" style={s.btn}>
            START AUCTION 🏀
          </button>
        </form>
      </div>
    </div>
  );
}

function Pill({ children }: { children: string }) {
  return (
    <span style={{
      background: "rgba(255,184,0,0.1)", border: "1px solid rgba(255,184,0,0.22)",
      color: "var(--gold)", borderRadius: 100, padding: "4px 13px",
      fontSize: 11, fontWeight: 600, letterSpacing: "0.05em",
    }}>{children}</span>
  );
}

function PlayerInput({ num, value, onChange, color }: {
  num: 1 | 2; value: string; onChange: (v: string) => void; color: string;
}) {
  return (
    <div style={{
      flex: 1, display: "flex", alignItems: "center", gap: 10,
      background: "var(--court-surface)", border: "1px solid var(--border)",
      borderRadius: 10, padding: "11px 14px",
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 7, background: color,
        color: "#000", fontFamily: "var(--font-d)", fontWeight: 900, fontSize: 15,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>P{num}</div>
      <input
        style={{ background: "none", border: "none", color: "var(--white)", fontSize: 15, fontWeight: 500, width: "100%", minWidth: 0 }}
        placeholder={`Player ${num} name`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={20}
      />
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    padding: "32px 16px", position: "relative", overflow: "hidden",
  },
  bg: { position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" },
  wrap: {
    width: "100%", maxWidth: 520, display: "flex", flexDirection: "column",
    gap: 22, position: "relative", zIndex: 1, animation: "fadeUp 0.5s ease",
  },
  hero: { textAlign: "center" },
  gavel: {
    fontSize: 56, display: "block", marginBottom: 10,
    animation: "gavel 2.4s ease-in-out infinite", transformOrigin: "bottom right",
  },
  title: {
    fontFamily: "var(--font-d)", fontSize: 80, fontWeight: 900,
    letterSpacing: "0.04em", lineHeight: 1, color: "var(--gold)",
    textShadow: "0 0 60px rgba(255,184,0,0.2)",
  },
  sub: {
    fontFamily: "var(--font-d)", fontSize: 18, fontWeight: 600,
    letterSpacing: "0.35em", color: "var(--white-dim)", marginTop: 4, marginBottom: 14,
  },
  pills: { display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" },
  card: {
    background: "var(--court-surface)", border: "1px solid var(--border)",
    borderRadius: 12, padding: "18px 22px", display: "flex", flexDirection: "column", gap: 10,
  },
  cardLabel: {
    fontFamily: "var(--font-d)", fontSize: 11, fontWeight: 700,
    letterSpacing: "0.22em", color: "var(--white-dim)", marginBottom: 4,
  },
  rule: { display: "flex", alignItems: "flex-start", gap: 12 },
  ruleN: { fontFamily: "var(--font-d)", fontSize: 20, fontWeight: 900, color: "var(--gold)", lineHeight: 1, width: 24, flexShrink: 0 },
  ruleT: { fontSize: 13.5, color: "var(--white)", lineHeight: 1.5 },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  inputs: { display: "flex", alignItems: "center", gap: 10 },
  vs: { fontFamily: "var(--font-d)", fontSize: 22, fontWeight: 900, color: "var(--white-dim)", flexShrink: 0 },
  btn: {
    background: "var(--gold)", color: "#000",
    fontFamily: "var(--font-d)", fontSize: 22, fontWeight: 800, letterSpacing: "0.05em",
    padding: "16px 32px", borderRadius: 10, border: "none",
    animation: "pulseGold 2.5s infinite",
  },
};
