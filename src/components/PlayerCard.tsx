import type { NBAPlayer } from "../lib/players";
import { POSITION_COLORS, TIER_COLORS } from "../lib/players";
import { getPlayerHeadshot } from "../lib/headshots";

interface Props { player: NBAPlayer; animKey?: number | string; }

const TIER_LABEL: Record<NBAPlayer["tier"], string> = {
  superstar: "Superstar",
  allstar:   "All-Star",
  starter:   "Starter",
  role:      "Role Player",
};

export function PlayerCard({ player, animKey }: Props) {
  const pc = POSITION_COLORS[player.position];
  const tc = TIER_COLORS[player.tier];
  const headshot = getPlayerHeadshot(player.name, player.position);

  return (
    <div key={animKey} style={{
      background: "var(--court-surface)",
      border: "1px solid var(--border-strong)",
      borderRadius: 12,
      overflow: "hidden",
      animation: "popIn 0.2s ease-out",
    }}>
      {/* Top accent bar */}
      <div style={{ height: 2, background: pc }} />

      <div style={{ padding: "18px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 16, alignItems: "center", marginBottom: 16 }}>
          <div style={{
            width: 120, height: 120, borderRadius: 18, overflow: "hidden",
            border: "1px solid var(--border)", background: "var(--court-mid)", flexShrink: 0,
          }}>
            <img
              src={headshot}
              alt={`${player.name} headshot`}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>

          <div>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontFamily: "var(--font-d)", fontSize: 11, fontWeight: 600,
              letterSpacing: "0.06em", color: pc,
              background: `${pc}18`, border: `1px solid ${pc}30`,
              borderRadius: 5, padding: "2px 8px",
            }}>{player.position}</span>
            <span style={{
              fontFamily: "var(--font-d)", fontSize: 11, fontWeight: 500,
              color: tc, letterSpacing: "0.04em",
            }}>{TIER_LABEL[player.tier]}</span>
          </div>
          <div style={{
            fontFamily: "var(--font-d)", fontSize: 24, fontWeight: 700,
            color: tc, letterSpacing: "-0.01em",
          }}>
            {player.rating}
            <span style={{ fontSize: 11, fontWeight: 500, color: "var(--white-dim)", marginLeft: 3 }}>OVR</span>
          </div>
        </div>

        {/* Name */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "var(--white-dim)", letterSpacing: "0.04em", marginBottom: 3 }}>
            {player.team}
          </div>
          <div style={{
            fontFamily: "var(--font-d)", fontSize: 30, fontWeight: 600,
            lineHeight: 1.1, color: "var(--white)", letterSpacing: "-0.02em",
          }}>{player.name}</div>
        </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4,1fr)",
          gap: 1, borderRadius: 7, overflow: "hidden",
          border: "1px solid var(--border)",
        }}>
          {[
            { label: "PPG", value: player.ppg.toFixed(1) },
            { label: "RPG", value: player.rpg.toFixed(1) },
            { label: "APG", value: player.apg.toFixed(1) },
            { label: "FG%", value: `${player.fg_pct.toFixed(1)}` },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: "var(--court-mid)", padding: "10px 6px", textAlign: "center",
            }}>
              <div style={{ fontFamily: "var(--font-d)", fontSize: 18, fontWeight: 600, color: "var(--white)", lineHeight: 1 }}>
                {value}
              </div>
              <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.08em", color: "var(--white-dim)", marginTop: 3 }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
