import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "@tanstack/react-router";
import type { GameState, RosterSlot } from "../lib/game";
import { teamScore, teamTotals, fmt$, STARTING_BUDGET } from "../lib/game";
import { POSITIONS, POSITION_COLORS, POSITION_LABELS, TIER_COLORS } from "../lib/players";

export function ResultsPage() {
  const { gameId } = useParams({ from: "/results/$gameId" });
  const nav = useNavigate();
  const [gs, setGs] = useState<GameState | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(`hb-${gameId}`);
    if (!raw) { nav({ to: "/" }); return; }
    setGs(JSON.parse(raw));
  }, [gameId]);

  if (!gs) return <div style={{ padding: 40, color: "var(--white)" }}>Loading…</div>;

  const s1 = teamScore(gs.roster1);
  const s2 = teamScore(gs.roster2);
  const t1 = teamTotals(gs.roster1);
  const t2 = teamTotals(gs.roster2);
  const spent1 = STARTING_BUDGET - gs.p1Budget;
  const spent2 = STARTING_BUDGET - gs.p2Budget;

  const winner = s1 > s2 ? gs.p1Name : s2 > s1 ? gs.p2Name : null;

  return (
    <div style={s.page}>
      <div style={s.content}>

        {/* Trophy banner */}
        <div style={s.banner}>
          <div style={{ fontSize: 64, marginBottom: 10 }}>🏆</div>
          <div style={{ fontFamily: "var(--font-d)", fontSize: 52, fontWeight: 900, lineHeight: 1 }}>
            {winner ? (
              <><span style={{ color: "var(--gold)" }}>{winner}</span>{" WINS"}</>
            ) : (
              <span style={{ color: "var(--white-dim)" }}>IT'S A TIE</span>
            )}
          </div>
          <div style={{ fontFamily: "var(--font-d)", fontSize: 12, letterSpacing: "0.22em", color: "var(--white-dim)", marginTop: 6 }}>
            GAME #{gameId}
          </div>
        </div>

        {/* Score cards */}
        <div style={s.scoreRow}>
          <ScoreCard name={gs.p1Name} score={s1} totals={t1} spent={spent1} isWinner={winner === gs.p1Name} color="var(--gold)" num={1} />
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{ fontFamily: "var(--font-d)", fontSize: 52, fontWeight: 900, lineHeight: 1 }}>
              <span style={{ color: "var(--gold)" }}>{s1}</span>
              <span style={{ color: "var(--white-dim)" }}> — </span>
              <span style={{ color: "var(--accent)" }}>{s2}</span>
            </div>
            <div style={{ fontFamily: "var(--font-d)", fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", color: "var(--white-dim)" }}>OVR</div>
          </div>
          <ScoreCard name={gs.p2Name} score={s2} totals={t2} spent={spent2} isWinner={winner === gs.p2Name} color="var(--accent)" num={2} />
        </div>

        {/* Stat bars */}
        <Section label="STAT COMPARISON">
          <div style={{ background: "var(--court-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
            <StatBar label="PPG" v1={t1.ppg} v2={t2.ppg} max={36} c1="var(--gold)" c2="var(--accent)" />
            <StatBar label="RPG" v1={t1.rpg} v2={t2.rpg} max={14} c1="var(--gold)" c2="var(--accent)" />
            <StatBar label="APG" v1={t1.apg} v2={t2.apg} max={11} c1="var(--gold)" c2="var(--accent)" />
          </div>
        </Section>

        {/* Side-by-side rosters */}
        <Section label="FINAL LINEUPS">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <FullRoster name={gs.p1Name} slots={gs.roster1} color="var(--gold)" num={1} />
            <FullRoster name={gs.p2Name} slots={gs.roster2} color="var(--accent)" num={2} />
          </div>
        </Section>

        {/* Auction log table */}
        {gs.history.length > 0 && (
          <Section label="AUCTION RECAP">
            <div style={{ background: "var(--court-surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
              <div style={s.tHead}>
                <span>PLAYER</span>
                <span style={{ textAlign: "center" }}>POS</span>
                <span style={{ textAlign: "right", color: "var(--gold)" }}>{gs.p1Name}</span>
                <span style={{ textAlign: "right", color: "var(--accent)" }}>{gs.p2Name}</span>
                <span style={{ textAlign: "right" }}>WINNER</span>
              </div>
              {gs.history.map((h) => (
                <div key={h.id} style={s.tRow}>
                  <span style={{ fontFamily: "var(--font-d)", fontSize: 15, fontWeight: 700 }}>{h.playerName}</span>
                  <span style={{ display: "flex", justifyContent: "center" }}>
                    <span style={{ background: POSITION_COLORS[h.position as keyof typeof POSITION_COLORS] ?? "#888", color: "#000", fontFamily: "var(--font-d)", fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 4 }}>
                      {h.position}
                    </span>
                  </span>
                  <span style={{ textAlign: "right", color: "var(--gold)", fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 700 }}>{fmt$(h.bid1)}</span>
                  <span style={{ textAlign: "right", color: "var(--accent)", fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 700 }}>{fmt$(h.bid2)}</span>
                  <span style={{ textAlign: "right", fontFamily: "var(--font-d)", fontSize: 13, fontWeight: 700, color: h.winner === 1 ? "var(--gold)" : h.winner === 2 ? "var(--accent)" : "var(--white-dim)" }}>
                    {h.winner === 1 ? gs.p1Name : h.winner === 2 ? gs.p2Name : "—"}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Play again */}
        <div style={{ display: "flex", justifyContent: "center", paddingBottom: 40 }}>
          <Link to="/" style={{
            background: "var(--gold)", color: "#000",
            fontFamily: "var(--font-d)", fontSize: 22, fontWeight: 800, letterSpacing: "0.05em",
            padding: "16px 44px", borderRadius: 10, animation: "pulseGold 2.5s infinite",
          }}>🔨 PLAY AGAIN</Link>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontFamily: "var(--font-d)", fontSize: 11, fontWeight: 700, letterSpacing: "0.24em", color: "var(--white-dim)" }}>{label}</div>
      {children}
    </div>
  );
}

function ScoreCard({ name, score, totals, spent, isWinner, color, num }: {
  name: string; score: number; totals: { ppg: number; rpg: number; apg: number };
  spent: number; isWinner: boolean; color: string; num: 1 | 2;
}) {
  return (
    <div style={{
      flex: 1, border: `2px solid ${isWinner ? color : "var(--border)"}`,
      borderRadius: 14, padding: "22px 16px", textAlign: "center",
      background: isWinner ? `${color}08` : "var(--court-surface)",
      position: "relative", overflow: "hidden",
    }}>
      {isWinner && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, background: color, color: "#000", fontFamily: "var(--font-d)", fontWeight: 800, fontSize: 11, letterSpacing: "0.15em", padding: "3px 0", textAlign: "center" }}>
          WINNER
        </div>
      )}
      <div style={{ marginTop: isWinner ? 16 : 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: 7, background: color, color: "#000", fontFamily: "var(--font-d)", fontWeight: 900, fontSize: 14, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 6 }}>P{num}</div>
        <div style={{ fontFamily: "var(--font-d)", fontSize: 22, fontWeight: 800 }}>{name}</div>
        <div style={{ fontFamily: "var(--font-d)", fontSize: 64, fontWeight: 900, color, lineHeight: 1, margin: "4px 0" }}>{score}</div>
        <div style={{ fontFamily: "var(--font-d)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "var(--white-dim)", marginBottom: 10 }}>AVG OVR</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
          {[["PPG", totals.ppg], ["RPG", totals.rpg], ["APG", totals.apg]].map(([l, v]) => (
            <div key={l as string} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-d)", fontSize: 18, fontWeight: 800, color }}>{(v as number).toFixed(1)}</div>
              <div style={{ fontSize: 10, color: "var(--white-dim)" }}>{l as string}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "var(--white-dim)", marginTop: 8 }}>Spent {fmt$(spent)}</div>
      </div>
    </div>
  );
}

function StatBar({ label, v1, v2, max, c1, c2 }: { label: string; v1: number; v2: number; max: number; c1: string; c2: string }) {
  const p1 = Math.min((v1 / max) * 100, 100);
  const p2 = Math.min((v2 / max) * 100, 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ fontFamily: "var(--font-d)", fontSize: 15, fontWeight: 800, color: c1, minWidth: 44, textAlign: "right" }}>{v1.toFixed(1)}</div>
      <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden", display: "flex" }}>
        <div style={{ marginLeft: `${100 - p1}%`, width: `${p1}%`, height: "100%", background: c1, borderRadius: "4px 0 0 4px" }} />
      </div>
      <div style={{ fontFamily: "var(--font-d)", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: "var(--white-dim)", minWidth: 34, textAlign: "center" }}>{label}</div>
      <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${p2}%`, height: "100%", background: c2, borderRadius: "0 4px 4px 0" }} />
      </div>
      <div style={{ fontFamily: "var(--font-d)", fontSize: 15, fontWeight: 800, color: c2, minWidth: 44 }}>{v2.toFixed(1)}</div>
    </div>
  );
}

function FullRoster({ name, slots, color, num }: { name: string; slots: RosterSlot[]; color: string; num: 1 | 2 }) {
  return (
    <div style={{ background: "var(--court-surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "12px 14px", background: "rgba(0,0,0,0.25)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: color, color: "#000", fontFamily: "var(--font-d)", fontWeight: 900, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>P{num}</div>
        <div style={{ fontFamily: "var(--font-d)", fontSize: 18, fontWeight: 800 }}>{name}</div>
      </div>
      {POSITIONS.map((pos) => {
        const slot = slots.find((s) => s.position === pos)!;
        const pc = POSITION_COLORS[pos];
        const tc = slot.stats ? TIER_COLORS[slot.stats.tier as keyof typeof TIER_COLORS] : "var(--white-dim)";
        return (
          <div key={pos} style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
            <div style={{ background: pc, color: "#000", fontFamily: "var(--font-d)", fontSize: 10, fontWeight: 800, padding: "3px 6px", borderRadius: 4, flexShrink: 0 }}>{pos}</div>
            {slot.playerName ? (
              <>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>{slot.playerName}</div>
                  <div style={{ fontSize: 11, color: "var(--white-dim)" }}>{slot.playerTeam} · {fmt$(slot.cost ?? 0)}</div>
                </div>
                <div style={{ fontFamily: "var(--font-d)", fontSize: 16, fontWeight: 800, color: tc }}>{slot.stats?.rating}</div>
              </>
            ) : (
              <div style={{ flex: 1, fontSize: 12, color: "rgba(155,144,128,0.4)" }}>{POSITION_LABELS[pos]} — empty</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", padding: "28px 16px" },
  content: { maxWidth: 820, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24, animation: "fadeUp 0.5s ease" },
  banner: { textAlign: "center", padding: "24px 0 8px" },
  scoreRow: { display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 14, alignItems: "center" },
  tHead: { display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "10px 16px", background: "rgba(0,0,0,0.25)", borderBottom: "1px solid var(--border)", fontFamily: "var(--font-d)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "var(--white-dim)" },
  tRow: { display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.03)", alignItems: "center", fontSize: 13 },
};
