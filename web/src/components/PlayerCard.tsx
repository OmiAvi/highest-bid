import type { NBAPlayer } from "../lib/players";
import { POSITION_COLORS, TIER_COLORS } from "../lib/players";
import { getPlayerHeadshot } from "../lib/headshots";

interface Props { player: NBAPlayer; animKey?: number | string; large?: boolean; }

const TIER_LABEL: Record<NBAPlayer["tier"], string> = {
  superstar: "Superstar",
  allstar:   "All-Star",
  starter:   "Starter",
  role:      "Role Player",
};

export function PlayerCard({ player, animKey, large }: Props) {
  const pc = POSITION_COLORS[player.position];
  const tc = TIER_COLORS[player.tier];
  const headshot = getPlayerHeadshot(player.name, player.position);
  const imgSize = large ? 180 : 140;

  return (
    <div key={animKey} style={{
      background: "var(--court-surface)",
      border: "1px solid var(--border-strong)",
      borderRadius: 12,
      overflow: "hidden",
      animation: "popIn 0.2s ease-out",
    }}>
      {/* Top accent bar */}
      <div style={{ height: 3, background: pc }} />

      <div style={{ padding: large ? "24px 28px" : "20px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: `${imgSize}px minmax(0,1fr)`, gap: large ? 22 : 16, alignItems: "center", marginBottom: large ? 22 : 20 }}>
          <div style={{
            width: imgSize, height: imgSize, borderRadius: large ? 22 : 18, overflow: "hidden",
            border: "1px solid var(--border)", background: "var(--court-mid)", flexShrink: 0,
          }}>
            <img
              src={headshot}
              alt={`${player.name} headshot`}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>

          <div style={{ minWidth: 0 }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: large ? 18 : 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                <span style={{
                  fontFamily: "var(--font-d)", fontSize: large ? 13 : 11, fontWeight: 600,
                  letterSpacing: "0.06em", color: pc,
                  background: `${pc}18`, border: `1px solid ${pc}30`,
                  borderRadius: 5, padding: large ? "3px 10px" : "2px 8px",
                  flexShrink: 0,
                }}>{player.position}</span>
                <span style={{
                  fontFamily: "var(--font-d)", fontSize: large ? 13 : 11, fontWeight: 500,
                  color: tc, letterSpacing: "0.04em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{TIER_LABEL[player.tier]}</span>
              </div>
              <div style={{
                fontFamily: "var(--font-d)", fontSize: large ? 34 : "clamp(18px, 5vw, 28px)", fontWeight: 700,
                color: tc, letterSpacing: "-0.01em", flexShrink: 0,
              }}>
                {player.rating}
                <span style={{ fontSize: large ? 13 : 11, fontWeight: 500, color: "var(--white-dim)", marginLeft: 3 }}>OVR</span>
              </div>
            </div>

            {/* Name */}
            <div style={{ marginBottom: large ? 4 : 14 }}>
              <div style={{ fontSize: large ? 13 : 11, fontWeight: 500, color: "var(--white-dim)", letterSpacing: "0.04em", marginBottom: 3 }}>
                {player.team}
              </div>
              <div style={{
                fontFamily: "var(--font-d)", fontSize: large ? 42 : "clamp(18px, 6vw, 34px)", fontWeight: 600,
                lineHeight: 1.05, color: "var(--white)", letterSpacing: "-0.02em",
                overflowWrap: "break-word", wordBreak: "break-word",
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
              background: "var(--court-mid)", padding: large ? "14px 8px" : "12px 8px", textAlign: "center",
            }}>
              <div style={{ fontFamily: "var(--font-d)", fontSize: large ? 24 : 20, fontWeight: 600, color: "var(--white)", lineHeight: 1 }}>
                {value}
              </div>
              <div style={{ fontSize: large ? 11 : 10, fontWeight: 500, letterSpacing: "0.08em", color: "var(--white-dim)", marginTop: 3 }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
