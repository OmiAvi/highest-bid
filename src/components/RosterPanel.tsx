import { POSITIONS, POSITION_COLORS, POSITION_LABELS } from "../lib/players";
import type { RosterSlot } from "../lib/game";
import { fmt$ } from "../lib/game";

interface Props {
  name: string;
  slots: RosterSlot[];
  budget: number;
  num: 1 | 2;
}

export function RosterPanel({ name, slots, budget, num }: Props) {
  const color = num === 1 ? "var(--gold)" : "var(--accent)";
  const bg    = num === 1 ? "var(--gold)" : "var(--accent)";

  return (
    <div style={{
      background: "var(--court-surface)", border: "1px solid var(--border)",
      borderRadius: 10, overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 14px", background: "rgba(0,0,0,0.3)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 7, background: bg,
          color: "#000", fontFamily: "var(--font-d)", fontWeight: 900, fontSize: 14,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>P{num}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--font-d)", fontSize: 18, fontWeight: 800 }}>{name}</div>
          <div style={{ fontSize: 11, color: "var(--white-dim)" }}>{fmt$(budget)} remaining</div>
        </div>
      </div>

      {/* Slots */}
      {POSITIONS.map((pos) => {
        const slot = slots.find((s) => s.position === pos)!;
        const pc   = POSITION_COLORS[pos];
        const filled = slot.playerName !== null;

        return (
          <div key={pos} style={{
            display: "flex", alignItems: "center", gap: 9,
            padding: "9px 14px", borderBottom: "1px solid rgba(255,255,255,0.03)",
            opacity: filled ? 1 : 0.45,
          }}>
            <div style={{
              background: pc, color: "#000",
              fontFamily: "var(--font-d)", fontWeight: 800, fontSize: 11,
              padding: "3px 7px", borderRadius: 5, letterSpacing: "0.04em", flexShrink: 0,
            }}>{pos}</div>

            {filled ? (
              <>
                <div style={{ flex: 1, fontFamily: "var(--font-d)", fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>
                  {slot.playerName}
                  <div style={{ fontSize: 11, fontWeight: 500, color: "var(--white-dim)", fontFamily: "var(--font-b)" }}>
                    {slot.playerTeam} · {slot.cost != null ? fmt$(slot.cost) : ""}
                  </div>
                </div>
                <div style={{ fontFamily: "var(--font-d)", fontSize: 15, fontWeight: 800, color }}>
                  {slot.stats?.rating}
                </div>
              </>
            ) : (
              <div style={{ flex: 1, fontSize: 13, color: "rgba(155,144,128,0.4)" }}>
                {POSITION_LABELS[pos]}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
