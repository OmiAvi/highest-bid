import type { NBAPlayer } from "../lib/players";
import { POSITION_COLORS, TIER_COLORS } from "../lib/players";

interface Props { player: NBAPlayer; animKey?: number | string; }

export function PlayerCard({ player, animKey }: Props) {
  const pc = POSITION_COLORS[player.position];
  const tc = TIER_COLORS[player.tier];

  return (
    <div key={animKey} style={{
      background: "linear-gradient(145deg, #1e1408 0%, #0f0900 100%)",
      border: `1px solid ${pc}40`,
      borderRadius: 16,
      padding: "22px 20px",
      animation: "popIn 0.35s ease",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* faint position watermark */}
      <div style={{
        position: "absolute", right: -10, bottom: -20,
        fontFamily: "var(--font-d)", fontSize: 120, fontWeight: 900,
        color: `${pc}10`, lineHeight: 1, userSelect: "none",
      }}>{player.position}</div>

      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{
          fontFamily: "var(--font-d)", fontWeight: 800, fontSize: 14,
          color: "#000", background: pc, padding: "4px 12px", borderRadius: 6, letterSpacing: "0.04em",
        }}>{player.position}</div>
        <div style={{
          fontFamily: "var(--font-d)", fontSize: 11, fontWeight: 700,
          letterSpacing: "0.12em", color: tc,
          border: `1px solid ${tc}50`, borderRadius: 100, padding: "3px 10px",
        }}>★ {player.tier.toUpperCase()}</div>
      </div>

      {/* Name */}
      <div style={{ marginBottom: 18 }}>
        <div style={{
          fontFamily: "var(--font-d)", fontSize: 12, fontWeight: 600,
          letterSpacing: "0.28em", color: "var(--white-dim)", marginBottom: 2,
        }}>{player.team}</div>
        <div style={{
          fontFamily: "var(--font-d)", fontSize: 42, fontWeight: 900,
          lineHeight: 1, color: "var(--white)",
        }}>{player.name}</div>
      </div>

      {/* OVR ring */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
        <div style={{
          width: 76, height: 76, borderRadius: "50%",
          border: `3px solid ${tc}`, display: "flex",
          flexDirection: "column", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 20px ${tc}30`,
        }}>
          <div style={{ fontFamily: "var(--font-d)", fontSize: 30, fontWeight: 900, color: tc, lineHeight: 1 }}>
            {player.rating}
          </div>
          <div style={{ fontFamily: "var(--font-d)", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "var(--white-dim)" }}>
            OVR
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
        {[
          { label: "PPG", value: player.ppg.toFixed(1), color: "var(--gold)" },
          { label: "RPG", value: player.rpg.toFixed(1), color: "var(--pg)" },
          { label: "APG", value: player.apg.toFixed(1), color: "var(--sf)" },
          { label: "FG%", value: `${player.fg_pct.toFixed(1)}%`, color: "var(--sg)" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 4px", textAlign: "center",
          }}>
            <div style={{ fontFamily: "var(--font-d)", fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontFamily: "var(--font-d)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--white-dim)", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
