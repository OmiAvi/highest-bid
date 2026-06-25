import { useState, useEffect } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import type { GameState } from "../lib/game";
import { applyBids, advanceRound, fmt$, toC, STARTING_BUDGET } from "../lib/game";
import { PlayerCard } from "../components/PlayerCard";
import { RosterPanel } from "../components/RosterPanel";

export function GamePage() {
  const { gameId } = useParams({ from: "/game/$gameId" });
  const nav = useNavigate();

  const [gs, setGs] = useState<GameState | null>(null);
  const [bid1, setBid1] = useState("");
  const [bid2, setBid2] = useState("");
  const [p1Locked, setP1Locked] = useState(false);
  const [p2Locked, setP2Locked] = useState(false);
  const [cardKey, setCardKey] = useState(0);
  const [rosterOpen, setRosterOpen] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(`hb-${gameId}`);
    if (!raw) { nav({ to: "/" }); return; }
    setGs(JSON.parse(raw));
  }, [gameId]);

  function save(next: GameState) {
    sessionStorage.setItem(`hb-${gameId}`, JSON.stringify(next));
    setGs(next);
  }

  function lockBid(player: 1 | 2) {
    if (!gs) return;
    const raw = player === 1 ? bid1 : bid2;
    const budget = player === 1 ? gs.p1Budget : gs.p2Budget;
    const cents = toC(raw || "0");
    if (cents < 0 || cents > budget) {
      alert(`Bid must be between $0.00 and ${fmt$(budget)}`);
      return;
    }
    if (player === 1) setP1Locked(true);
    else setP2Locked(true);
  }

  function reveal() {
    if (!gs) return;
    const b1 = toC(bid1 || "0");
    const b2 = toC(bid2 || "0");
    const next = applyBids(gs, b1, b2);
    save(next);
    if (next.phase === "complete") nav({ to: "/results/$gameId", params: { gameId } });
  }

  function nextRound() {
    if (!gs) return;
    const next = advanceRound(gs);
    setBid1(""); setBid2("");
    setP1Locked(false); setP2Locked(false);
    setCardKey((k) => k + 1);
    save(next);
  }

  if (!gs) return <div style={{ padding: 40, color: "var(--white)" }}>Loading…</div>;

  const bothLocked = p1Locked && p2Locked;
  const lr = gs.lastResult;

  return (
    <div style={s.layout}>

      {/* ── Sidebar ── */}
      <aside style={s.sidebar} className="desktop-sidebar">
        <div style={s.sidebarInner}>
          <div style={s.sideLabel}>ROSTERS</div>
          <RosterPanel name={gs.p1Name} slots={gs.roster1} budget={gs.p1Budget} num={1} />
          <RosterPanel name={gs.p2Name} slots={gs.roster2} budget={gs.p2Budget} num={2} />
        </div>
      </aside>

      {/* ── Mobile roster drawer ── */}
      {rosterOpen && (
        <div style={s.overlay} onClick={() => setRosterOpen(false)}>
          <div style={s.drawer} onClick={(e) => e.stopPropagation()}>
            <button style={s.closeBtn} onClick={() => setRosterOpen(false)}>✕ Close</button>
            <div style={s.sideLabel}>ROSTERS</div>
            <RosterPanel name={gs.p1Name} slots={gs.roster1} budget={gs.p1Budget} num={1} />
            <RosterPanel name={gs.p2Name} slots={gs.roster2} budget={gs.p2Budget} num={2} />
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <main style={s.main}>
        {/* Top bar */}
        <div style={s.topBar}>
          <div style={s.roundBadge}>ROUND {gs.round}</div>
          <div style={s.budgets}>
            <BudgetPip name={gs.p1Name} budget={gs.p1Budget} color="var(--gold)" />
            <span style={{ color: "var(--white-dim)", fontSize: 16 }}>·</span>
            <BudgetPip name={gs.p2Name} budget={gs.p2Budget} color="var(--accent)" />
          </div>
          <button style={s.rosterBtn} onClick={() => setRosterOpen(true)}>📋</button>
        </div>

        {/* ─── BIDDING PHASE ─── */}
        {gs.phase === "bidding" && gs.currentPlayer && (
          <div style={{ animation: "fadeUp 0.35s ease", display: "flex", flexDirection: "column", gap: 20 }} key={cardKey}>
            <div>
              <div style={s.auctionLabel}>ON THE BLOCK</div>
              <PlayerCard player={gs.currentPlayer} animKey={cardKey} />
            </div>

            <div style={s.bidsGrid}>
              <BidInput
                label={gs.p1Name} num={1} value={bid1} onChange={setBid1}
                maxBudget={gs.p1Budget} locked={p1Locked} onLock={() => lockBid(1)}
                color="var(--gold)"
              />
              <BidInput
                label={gs.p2Name} num={2} value={bid2} onChange={setBid2}
                maxBudget={gs.p2Budget} locked={p2Locked} onLock={() => lockBid(2)}
                color="var(--accent)"
              />
            </div>

            {bothLocked && (
              <button style={s.revealBtn} onClick={reveal}>🔨 REVEAL BIDS</button>
            )}

            {!bothLocked && (
              <div style={s.waitingMsg}>
                {!p1Locked && !p2Locked && "Both players enter their bid — then lock in"}
                {p1Locked && !p2Locked && `Waiting for ${gs.p2Name} to lock…`}
                {!p1Locked && p2Locked && `Waiting for ${gs.p1Name} to lock…`}
              </div>
            )}
          </div>
        )}

        {/* ─── REVEAL PHASE ─── */}
        {gs.phase === "reveal" && lr && (
          <div style={{ animation: "fadeUp 0.4s ease", display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ maxWidth: 400, alignSelf: "center", width: "100%" }}>
              <PlayerCard player={lr.player} animKey={-1} />
            </div>

            {/* Bid comparison */}
            <div style={s.bidReveal}>
              <BidResult name={gs.p1Name} bid={lr.bid1} isWinner={lr.winner === 1} color="var(--gold)" />
              <div style={s.vsReveal}>VS</div>
              <BidResult name={gs.p2Name} bid={lr.bid2} isWinner={lr.winner === 2} color="var(--accent)" />
            </div>

            {/* Outcome */}
            <div style={s.outcome}>
              {lr.winner ? (
                <>
                  <div style={{ fontFamily: "var(--font-d)", fontSize: 36, fontWeight: 900, color: lr.winner === 1 ? "var(--gold)" : "var(--accent)", letterSpacing: "0.04em" }}>
                    {lr.winner === 1 ? gs.p1Name : gs.p2Name} WINS
                  </div>
                  {lr.slotFilled ? (
                    <div style={{ fontSize: 13, color: "var(--white-dim)", marginTop: 4 }}>
                      {lr.player.name} → {lr.player.position} slot for {fmt$(lr.winner === 1 ? lr.bid1 : lr.bid2)}
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: "var(--accent)", marginTop: 4 }}>
                      ⚠️ {lr.player.position} slot already filled — player is lost
                    </div>
                  )}
                </>
              ) : (
                <div style={{ fontFamily: "var(--font-d)", fontSize: 28, fontWeight: 800, color: "var(--white-dim)" }}>
                  TIE — no winner, player passes
                </div>
              )}
            </div>

            <button style={s.nextBtn} onClick={nextRound}>NEXT PLAYER →</button>
          </div>
        )}

        {/* Recent log */}
        {gs.history.length > 0 && gs.phase === "bidding" && (
          <div style={s.log}>
            <div style={s.logLabel}>RECENT RESULTS</div>
            {[...gs.history].reverse().slice(0, 4).map((h) => (
              <div key={h.id} style={s.logRow}>
                <span style={{ fontFamily: "var(--font-d)", fontSize: 15, fontWeight: 700 }}>{h.playerName}</span>
                <span style={{ color: "var(--white-dim)", fontSize: 13 }}>→</span>
                {h.winner ? (
                  <span style={{ color: h.winner === 1 ? "var(--gold)" : "var(--accent)", fontSize: 13, fontWeight: 600 }}>
                    {h.winner === 1 ? gs.p1Name : gs.p2Name} ({fmt$(h.winningBid!)})
                  </span>
                ) : (
                  <span style={{ color: "var(--white-dim)", fontSize: 13 }}>No winner</span>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

/* ─────────── Sub-components ─────────── */

function BudgetPip({ name, budget, color }: { name: string; budget: number; color: string }) {
  const pct = budget / STARTING_BUDGET;
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 10, color: "var(--white-dim)", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 1 }}>{name}</div>
      <div style={{ fontFamily: "var(--font-d)", fontSize: 18, fontWeight: 800, color: pct > 0.25 ? color : "var(--accent)" }}>
        {fmt$(budget)}
      </div>
    </div>
  );
}

function BidInput({ label, num, value, onChange, maxBudget, locked, onLock, color }: {
  label: string; num: 1 | 2; value: string; onChange: (v: string) => void;
  maxBudget: number; locked: boolean; onLock: () => void; color: string;
}) {
  return (
    <div style={{
      background: "var(--court-surface)", border: `2px solid ${locked ? color + "60" : "var(--border)"}`,
      borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 12,
      transition: "border-color 0.2s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 7, background: color, color: "#000",
          fontFamily: "var(--font-d)", fontWeight: 900, fontSize: 14,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>P{num}</div>
        <div>
          <div style={{ fontFamily: "var(--font-d)", fontSize: 18, fontWeight: 800 }}>{label}</div>
          <div style={{ fontSize: 11, color: "var(--white-dim)" }}>Budget: {fmt$(maxBudget)}</div>
        </div>
        {locked && <div style={{ marginLeft: "auto", fontFamily: "var(--font-d)", fontSize: 12, fontWeight: 700, color, letterSpacing: "0.05em" }}>LOCKED ✓</div>}
      </div>

      <div style={{ display: "flex", alignItems: "center", background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: "8px 12px", gap: 4 }}>
        <span style={{ fontFamily: "var(--font-d)", fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>$</span>
        <input
          type="number" min="0" max={(maxBudget / 100).toFixed(2)} step="0.25"
          value={value} onChange={(e) => onChange(e.target.value)}
          disabled={locked} placeholder="0.00"
          style={{
            background: "none", border: "none", color,
            fontFamily: "var(--font-d)", fontSize: 34, fontWeight: 900, width: "100%", minWidth: 0,
          }}
        />
      </div>

      {locked ? (
        <div style={{ fontFamily: "var(--font-d)", fontSize: 12, fontWeight: 700, color, textAlign: "center", letterSpacing: "0.05em" }}>
          Waiting for other player…
        </div>
      ) : (
        <button style={{
          border: `2px solid ${color}`, borderRadius: 8, background: "transparent",
          color, fontFamily: "var(--font-d)", fontSize: 15, fontWeight: 800,
          letterSpacing: "0.08em", padding: "10px",
        }} onClick={onLock}>
          LOCK IN BID
        </button>
      )}
    </div>
  );
}

function BidResult({ name, bid, isWinner, color }: { name: string; bid: number; isWinner: boolean; color: string }) {
  return (
    <div style={{
      flex: 1, border: `2px solid ${isWinner ? color : "var(--border)"}`,
      borderRadius: 12, padding: "16px 12px", textAlign: "center",
      background: isWinner ? `${color}10` : "transparent", position: "relative",
      transition: "all 0.3s",
    }}>
      {isWinner && <div style={{ position: "absolute", top: -16, left: "50%", transform: "translateX(-50%)", fontSize: 24 }}>👑</div>}
      <div style={{ fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 700, color: "var(--white-dim)", marginBottom: 4 }}>{name}</div>
      <div style={{ fontFamily: "var(--font-d)", fontSize: 38, fontWeight: 900, color, lineHeight: 1 }}>{fmt$(bid)}</div>
    </div>
  );
}

/* ─────────── Styles ─────────── */
const s: Record<string, React.CSSProperties> = {
  layout: { minHeight: "100vh", display: "flex" },
  sidebar: {
    width: 280, background: "var(--court-mid)", borderRight: "1px solid var(--border)",
    flexShrink: 0, position: "sticky" as const, top: 0, height: "100vh", overflowY: "auto",
  },
  sidebarInner: { padding: 12, display: "flex", flexDirection: "column", gap: 12 },
  sideLabel: { fontFamily: "var(--font-d)", fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", color: "var(--white-dim)", padding: "4px 2px" },
  overlay: { position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex" },
  drawer: { background: "var(--court-mid)", width: 300, padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 },
  closeBtn: { background: "none", border: "1px solid var(--border)", color: "var(--white-dim)", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, alignSelf: "flex-start" },
  main: { flex: 1, padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20, maxWidth: 680, margin: "0 auto", width: "100%" },
  topBar: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 12 },
  roundBadge: { fontFamily: "var(--font-d)", fontSize: 13, fontWeight: 700, letterSpacing: "0.25em", color: "var(--white-dim)" },
  budgets: { display: "flex", alignItems: "center", gap: 20, background: "var(--court-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 20px" },
  rosterBtn: { background: "var(--court-surface)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--white)", fontSize: 18, padding: "6px 12px", display: "none" },
  auctionLabel: { fontFamily: "var(--font-d)", fontSize: 11, fontWeight: 700, letterSpacing: "0.25em", color: "var(--gold)", marginBottom: 10 },
  bidsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  revealBtn: { background: "var(--gold)", color: "#000", fontFamily: "var(--font-d)", fontSize: 22, fontWeight: 800, letterSpacing: "0.05em", padding: "16px", borderRadius: 10, animation: "pulseGold 2s infinite", alignSelf: "center" as const },
  waitingMsg: { textAlign: "center" as const, fontSize: 13, color: "var(--white-dim)", fontStyle: "italic" },
  bidReveal: { display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center" },
  vsReveal: { fontFamily: "var(--font-d)", fontSize: 22, fontWeight: 900, color: "var(--white-dim)", textAlign: "center" as const },
  outcome: { background: "var(--court-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px", textAlign: "center" as const },
  nextBtn: { background: "var(--court-surface)", border: "2px solid rgba(255,255,255,0.18)", borderRadius: 10, color: "var(--white)", fontFamily: "var(--font-d)", fontSize: 20, fontWeight: 800, letterSpacing: "0.05em", padding: "14px 32px", alignSelf: "center" as const },
  log: { background: "var(--court-mid)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 18px" },
  logLabel: { fontFamily: "var(--font-d)", fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", color: "var(--white-dim)", marginBottom: 10 },
  logRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 },
};
