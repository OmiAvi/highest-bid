import { POSITIONS, POSITION_COLORS, POSITION_LABELS } from "../lib/players";
import type { RosterSlot } from "../lib/game";
import { effectiveRating, fmt$ } from "../lib/game";
import { getPlayerHeadshot } from "../lib/headshots";

interface Props {
  name: string;
  slots: RosterSlot[];
  budget: number;
  num: 1 | 2;
}

export function RosterPanel({ name, slots, budget, num }: Props) {
  const color = num === 1 ? "var(--gold)" : "var(--accent)";
  const filledCount = slots.filter(s => s.playerName).length;

  return (
    <div style={{
      border: "1px solid var(--border)",
      borderRadius: 10, overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "10px 12px",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 5,
            background: color, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-d)", fontWeight: 700, fontSize: 11, color: "#fff",
          }}>P{num}</div>
          <div style={{ fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 600, color: "var(--white)" }}>
            {name}
          </div>
        </div>
        <div style={{ fontSize: 11, color: "var(--white-dim)", fontVariantNumeric: "tabular-nums" }}>
          {filledCount}/5 · {fmt$(budget)}
        </div>
      </div>

      {/* Slots */}
      {POSITIONS.map((pos) => {
        const slot = slots.find((s) => s.position === pos)!;
        const pc = POSITION_COLORS[pos];
        const filled = slot.playerName !== null;
        const headshot = filled && slot.sourcePosition ? getPlayerHeadshot(slot.playerName!, slot.sourcePosition) : null;

        return (
          <div key={pos} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 12px",
            borderBottom: "1px solid var(--border)",
            opacity: filled ? 1 : 0.4,
          }}>
            <span style={{
              fontFamily: "var(--font-d)", fontSize: 10, fontWeight: 600,
              letterSpacing: "0.05em", color: pc, width: 22, flexShrink: 0,
            }}>{pos}</span>

            {filled ? (
              <>
                <div style={{
                  width: 34, height: 34, borderRadius: 10, overflow: "hidden",
                  border: "1px solid var(--border)", background: "var(--court-mid)", flexShrink: 0,
                }}>
                  <img
                    src={headshot ?? ""}
                    alt={`${slot.playerName} headshot`}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-d)", fontSize: 13, fontWeight: 600, color: "var(--white)", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {slot.playerName}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--white-dim)", marginTop: 1 }}>
                    {slot.playerTeam} · {slot.sourcePosition}
                    {slot.sourcePosition !== slot.position && slot.sourcePosition ? ` in ${slot.position} (-${slot.penalty})` : ""}
                    {slot.cost != null ? ` · ${fmt$(slot.cost)}` : ""}
                  </div>
                </div>
                <div style={{ fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 600, color, flexShrink: 0, minWidth: 30, textAlign: "right" as const }}>
                  {effectiveRating(slot)}
                </div>
              </>
            ) : (
              <div style={{ flex: 1, fontSize: 12, color: "var(--white-dim)" }}>
                {POSITION_LABELS[pos]}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
