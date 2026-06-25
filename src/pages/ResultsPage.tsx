import { useState, useEffect } from "react";
import { useParams, Link } from "@tanstack/react-router";
import type { GameState, RosterSlot } from "../lib/game";
import { teamScore, teamTotals, fmt$, STARTING_BUDGET, effectiveRating, simulateBestOfSeven } from "../lib/game";
import { POSITIONS, POSITION_COLORS, POSITION_LABELS, TIER_COLORS } from "../lib/players";
import { loadSession, pollGame } from "../lib/api";
import { createResultsShareImage } from "../lib/shareImage";
import { getPlayerHeadshot } from "../lib/headshots";

export function ResultsPage() {
  const { gameId } = useParams({ from: "/results/$gameId" });
  const [gs, setGs] = useState<GameState | null>(null);
  const [sharePending, setSharePending] = useState(false);
  const [shareError, setShareError] = useState("");

  useEffect(() => {
    const sess = loadSession(gameId);
    const token = sess?.token ?? "";
    pollGame(gameId, token)
      .then(r => setGs(r.state))
      .catch(() => setGs(null));
  }, [gameId]);

  if (!gs) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 13, color: "var(--white-dim)" }}>Loading…</div>
    </div>
  );

  const s1 = teamScore(gs.roster1);
  const s2 = teamScore(gs.roster2);
  const t1 = teamTotals(gs.roster1);
  const t2 = teamTotals(gs.roster2);
  const spent1 = STARTING_BUDGET - gs.p1Budget;
  const spent2 = STARTING_BUDGET - gs.p2Budget;
  const series = simulateBestOfSeven(gs);
  const winner = series.winner === 1 ? gs.p1Name : series.winner === 2 ? gs.p2Name : null;
  const siteUrl = `${window.location.origin}${window.location.pathname}`;

  async function handleShareImage() {
    const currentGame = gs;
    if (!currentGame) return;
    setSharePending(true);
    setShareError("");
    try {
      const file = await createResultsShareImage(currentGame, series, siteUrl);
      const nav = navigator as Navigator & {
        canShare?: (data?: ShareData) => boolean;
        share?: (data?: ShareData) => Promise<void>;
      };

      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({
          title: "Highest Bid Results",
          text: winner ? `${winner} won the series on Highest Bid.` : "Our Highest Bid series ended in a draw.",
          files: [file],
          url: siteUrl,
        });
      } else {
        const url = URL.createObjectURL(file);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      setShareError(error instanceof Error ? error.message : "Could not create share image");
    } finally {
      setSharePending(false);
    }
  }

  return (
    <div style={pg.page}>
      <div style={pg.content}>

        {/* Header */}
        <div style={pg.header}>
          <div style={pg.headerTop}>
            <div style={pg.logoDot} />
            <span style={pg.logoText}>Highest Bid</span>
            <span style={{ fontSize: 11, color: "var(--white-dim)", marginLeft: 8 }}>Game #{gameId}</span>
          </div>
          <div style={pg.resultBanner}>
            {winner
              ? <><span style={{ color: winner === gs.p1Name ? "var(--gold)" : "var(--accent)" }}>{winner}</span> wins the series</>
              : <span style={{ color: "var(--white-dim)" }}>Series drawn</span>
            }
          </div>
        </div>

        {/* Score row */}
        <div style={pg.scoreRow}>
          <ScoreCard name={gs.p1Name} score={s1} totals={t1} spent={spent1} won={winner === gs.p1Name} color="var(--gold)" num={1} />
          <div style={pg.scoreCenter}>
            <div style={pg.scoreLine}>
              <span style={{ color: "var(--gold)" }}>{series.p1Wins}</span>
              <span style={{ color: "var(--white-dim)", margin: "0 6px" }}>—</span>
              <span style={{ color: "var(--accent)" }}>{series.p2Wins}</span>
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--white-dim)" }}>BEST OF 7</div>
          </div>
          <ScoreCard name={gs.p2Name} score={s2} totals={t2} spent={spent2} won={winner === gs.p2Name} color="var(--accent)" num={2} />
        </div>

        <Section label="Series simulation">
          <div style={{ ...pg.card, padding: 0, overflow: "hidden" }}>
            <div style={pg.tHeadSeries}>
              <span>Game</span>
              <span style={{ textAlign: "right", color: "var(--gold)" }}>{gs.p1Name}</span>
              <span style={{ textAlign: "right", color: "var(--accent)" }}>{gs.p2Name}</span>
              <span style={{ textAlign: "right" }}>Winner</span>
            </div>
            {series.games.map((game) => (
              <div key={game.game} style={pg.tRowSeries}>
                <span>Game {game.game}</span>
                <span style={{ textAlign: "right", color: "var(--gold)", fontFamily: "var(--font-d)", fontWeight: 700 }}>{game.p1Score}</span>
                <span style={{ textAlign: "right", color: "var(--accent)", fontFamily: "var(--font-d)", fontWeight: 700 }}>{game.p2Score}</span>
                <span style={{ textAlign: "right", color: game.winner === 1 ? "var(--gold)" : "var(--accent)" }}>
                  {game.winner === 1 ? gs.p1Name : gs.p2Name}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* Stat comparison */}
        <Section label="Stat comparison">
          <div style={pg.card}>
            {[
              { label: "PPG", v1: t1.ppg, v2: t2.ppg, max: 36 },
              { label: "RPG", v1: t1.rpg, v2: t2.rpg, max: 14 },
              { label: "APG", v1: t1.apg, v2: t2.apg, max: 11 },
            ].map(b => <StatBar key={b.label} {...b} />)}
          </div>
        </Section>

        {/* Lineups */}
        <Section label="Final lineups">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FullRoster name={gs.p1Name} slots={gs.roster1} color="var(--gold)" num={1} />
            <FullRoster name={gs.p2Name} slots={gs.roster2} color="var(--accent)" num={2} />
          </div>
        </Section>

        {/* Auction recap */}
        {gs.history.length > 0 && (
          <Section label="Auction recap">
            <div style={{ ...pg.card, padding: 0, overflow: "hidden" }}>
              <div style={pg.tHead}>
                <span>Player</span>
                <span style={{ textAlign: "center" }}>Pos</span>
                <span style={{ textAlign: "right", color: "var(--gold)" }}>{gs.p1Name}</span>
                <span style={{ textAlign: "right", color: "var(--accent)" }}>{gs.p2Name}</span>
                <span style={{ textAlign: "right" }}>Winner</span>
              </div>
              {gs.history.map(h => (
                <div key={h.id} style={pg.tRow}>
                  <span style={{ fontFamily: "var(--font-d)", fontSize: 13, fontWeight: 600 }}>{h.playerName}</span>
                  <span style={{ display: "flex", justifyContent: "center" }}>
                    <span style={{
                      fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
                      color: POSITION_COLORS[h.position as keyof typeof POSITION_COLORS] ?? "var(--white-dim)",
                      background: `${POSITION_COLORS[h.position as keyof typeof POSITION_COLORS] ?? "#888"}18`,
                      border: `1px solid ${POSITION_COLORS[h.position as keyof typeof POSITION_COLORS] ?? "#888"}30`,
                      borderRadius: 4, padding: "1px 6px",
                    }}>{h.position}</span>
                  </span>
                  <span style={{ textAlign: "right", color: "var(--gold)", fontFamily: "var(--font-d)", fontSize: 13, fontWeight: 600 }}>
                    {h.bid1 > 0 ? fmt$(h.bid1) : "—"}
                  </span>
                  <span style={{ textAlign: "right", color: "var(--accent)", fontFamily: "var(--font-d)", fontSize: 13, fontWeight: 600 }}>
                    {h.bid2 > 0 ? fmt$(h.bid2) : "—"}
                  </span>
                  <span style={{ textAlign: "right", fontSize: 12, fontWeight: 500, color: h.winner === 1 ? "var(--gold)" : h.winner === 2 ? "var(--accent)" : "var(--white-dim)" }}>
                    {h.winner === 1 ? gs.p1Name : h.winner === 2 ? gs.p2Name : "—"}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {shareError && (
          <div style={pg.shareError}>{shareError}</div>
        )}

        <div style={pg.ctaRow}>
          <button onClick={handleShareImage} disabled={sharePending} style={{ ...pg.shareBtn, opacity: sharePending ? 0.6 : 1 }}>
            {sharePending ? "Creating image..." : "Share results image"}
          </button>
          <Link to="/" style={pg.playAgain}>Play again</Link>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--white-dim)", textTransform: "uppercase" as const }}>{label}</div>
      {children}
    </div>
  );
}

function ScoreCard({ name, score, totals, spent, won, color, num }: {
  name: string; score: number; totals: { ppg: number; rpg: number; apg: number; penalty: number };
  spent: number; won: boolean; color: string; num: 1 | 2;
}) {
  return (
    <div style={{
      flex: 1, border: `1px solid ${won ? color + "40" : "var(--border)"}`,
      borderRadius: 12, padding: "18px 16px", textAlign: "center",
      background: won ? `${color}06` : "var(--court-surface)",
      position: "relative",
    }}>
      {won && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          height: 2, background: color, borderRadius: "12px 12px 0 0",
        }} />
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 10, marginTop: won ? 8 : 0 }}>
        <div style={{ width: 20, height: 20, borderRadius: 5, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-d)", fontWeight: 700, fontSize: 10, color: "#fff" }}>P{num}</div>
        <div style={{ fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 600 }}>{name}</div>
      </div>
      <div style={{ fontFamily: "var(--font-d)", fontSize: 48, fontWeight: 700, color, lineHeight: 1, letterSpacing: "-0.02em" }}>{score}</div>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--white-dim)", marginBottom: 12 }}>EFFECTIVE OVR</div>
      <div style={{ display: "flex", justifyContent: "center", gap: 14 }}>
        {[["PPG", totals.ppg], ["RPG", totals.rpg], ["APG", totals.apg]].map(([l, v]) => (
          <div key={l as string} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-d)", fontSize: 15, fontWeight: 600, color }}>{(v as number).toFixed(1)}</div>
            <div style={{ fontSize: 10, color: "var(--white-dim)" }}>{l as string}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: "var(--white-dim)", marginTop: 10 }}>Spent {fmt$(spent)} · Penalty {totals.penalty}</div>
    </div>
  );
}

function StatBar({ label, v1, v2, max }: { label: string; v1: number; v2: number; max: number }) {
  const p1 = Math.min((v1 / max) * 100, 100);
  const p2 = Math.min((v2 / max) * 100, 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ fontFamily: "var(--font-d)", fontSize: 13, fontWeight: 600, color: "var(--gold)", minWidth: 38, textAlign: "right" }}>{v1.toFixed(1)}</div>
      <div style={{ flex: 1, height: 4, background: "var(--border-strong)", borderRadius: 2, overflow: "hidden", display: "flex" }}>
        <div style={{ marginLeft: `${100 - p1}%`, width: `${p1}%`, height: "100%", background: "var(--gold)", borderRadius: 2 }} />
      </div>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--white-dim)", minWidth: 28, textAlign: "center" }}>{label}</div>
      <div style={{ flex: 1, height: 4, background: "var(--border-strong)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${p2}%`, height: "100%", background: "var(--accent)", borderRadius: 2 }} />
      </div>
      <div style={{ fontFamily: "var(--font-d)", fontSize: 13, fontWeight: 600, color: "var(--accent)", minWidth: 38 }}>{v2.toFixed(1)}</div>
    </div>
  );
}

function FullRoster({ name, slots, color, num }: { name: string; slots: RosterSlot[]; color: string; num: 1 | 2 }) {
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
      <div style={{
        padding: "10px 12px", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <div style={{ width: 20, height: 20, borderRadius: 5, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-d)", fontWeight: 700, fontSize: 10, color: "#fff" }}>P{num}</div>
        <div style={{ fontFamily: "var(--font-d)", fontSize: 13, fontWeight: 600 }}>{name}</div>
      </div>
      {POSITIONS.map(pos => {
        const slot = slots.find(s => s.position === pos)!;
        const pc = POSITION_COLORS[pos];
        const tc = slot.stats ? TIER_COLORS[slot.stats.tier as keyof typeof TIER_COLORS] : "var(--white-dim)";
        const headshot = slot.playerName && slot.sourcePosition ? getPlayerHeadshot(slot.playerName, slot.sourcePosition) : null;
        return (
          <div key={pos} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: pc, width: 20, flexShrink: 0 }}>{pos}</span>
            {slot.playerName ? (
              <>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, overflow: "hidden",
                  border: "1px solid var(--border)", background: "var(--court-mid)", flexShrink: 0,
                }}>
                  <img
                    src={headshot ?? ""}
                    alt={`${slot.playerName} headshot`}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-d)", fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{slot.playerName}</div>
                  <div style={{ fontSize: 10, color: "var(--white-dim)" }}>
                    {slot.playerTeam} · {slot.sourcePosition}
                    {slot.sourcePosition !== slot.position && slot.sourcePosition ? ` in ${slot.position} (-${slot.penalty})` : ""}
                    {` · ${fmt$(slot.cost ?? 0)}`}
                  </div>
                </div>
                <div style={{ fontFamily: "var(--font-d)", fontSize: 13, fontWeight: 700, color: tc, flexShrink: 0 }}>{effectiveRating(slot)}</div>
              </>
            ) : (
              <div style={{ flex: 1, fontSize: 11, color: "var(--white-dim)", opacity: 0.45 }}>{POSITION_LABELS[pos]}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const pg: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", padding: "28px 16px" },
  content: { maxWidth: 780, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24, animation: "fadeUp 0.3s ease-out" },
  header: { paddingBottom: 16, borderBottom: "1px solid var(--border)" },
  headerTop: { display: "flex", alignItems: "center", gap: 8, marginBottom: 12 },
  logoDot: { width: 20, height: 20, borderRadius: 5, background: "var(--gold)" },
  logoText: { fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 700, color: "var(--white)", letterSpacing: "-0.01em" },
  resultBanner: { fontFamily: "var(--font-d)", fontSize: 40, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1 },
  scoreRow: { display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center" },
  scoreCenter: { textAlign: "center", flexShrink: 0 },
  scoreLine: { fontFamily: "var(--font-d)", fontSize: 40, fontWeight: 700, lineHeight: 1 },
  card: {
    background: "var(--court-surface)", border: "1px solid var(--border)",
    borderRadius: 12, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14,
  },
  tHead: {
    display: "grid", gridTemplateColumns: "2fr 0.8fr 1fr 1fr 1.2fr",
    padding: "8px 16px", borderBottom: "1px solid var(--border)",
    fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "var(--white-dim)",
    textTransform: "uppercase" as const,
  },
  tRow: {
    display: "grid", gridTemplateColumns: "2fr 0.8fr 1fr 1fr 1.2fr",
    padding: "9px 16px", borderBottom: "1px solid var(--border)", alignItems: "center",
  },
  tHeadSeries: {
    display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1.2fr",
    padding: "8px 16px", borderBottom: "1px solid var(--border)",
    fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "var(--white-dim)",
    textTransform: "uppercase" as const,
  },
  tRowSeries: {
    display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1.2fr",
    padding: "9px 16px", borderBottom: "1px solid var(--border)", alignItems: "center",
  },
  ctaRow: { display: "flex", justifyContent: "center", gap: 12, paddingBottom: 48, flexWrap: "wrap" as const },
  shareBtn: {
    background: "var(--court-surface)", color: "var(--white)",
    border: "1px solid var(--border-strong)", fontFamily: "var(--font-d)",
    fontSize: 14, fontWeight: 600, letterSpacing: "0.02em",
    padding: "11px 20px", borderRadius: 8,
  },
  shareError: {
    fontSize: 12, color: "#F87171", textAlign: "center" as const,
    background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.18)",
    borderRadius: 8, padding: "10px 12px",
  },
  playAgain: {
    background: "var(--gold)", color: "#fff",
    fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 600, letterSpacing: "0.02em",
    padding: "11px 28px", borderRadius: 8,
  },
};
