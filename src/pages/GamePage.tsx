import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import type { GameState } from "../lib/game";
import { fmt$, getMaxBidForPlayer, getPlacementOptions, toC, STARTING_BUDGET } from "../lib/game";
import { PlayerCard } from "../components/PlayerCard";
import { RosterPanel } from "../components/RosterPanel";
import { GavelIcon } from "../components/GavelIcon";
import { loadSession, pollGame, raiseBid, passBid, assignSlot, advanceRound } from "../lib/api";
import type { GameSession, PollResponse } from "../lib/api";
import type { Position } from "../lib/players";

const POLL_MS = 1500;

export function GamePage() {
  const { gameId } = useParams({ from: "/game/$gameId" });
  const nav = useNavigate();

  const [session, setSession] = useState<GameSession | null>(null);
  const [poll, setPoll] = useState<PollResponse | null>(null);
  const [bidInput, setBidInput] = useState("");
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState("");
  const [cardKey, setCardKey] = useState(0);
  const [rosterOpen, setRosterOpen] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const advancingRef = useRef(false);

  useEffect(() => {
    const sess = loadSession(gameId);
    if (!sess) { nav({ to: "/" }); return; }
    setSession(sess);
  }, [gameId]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    async function tick() {
      if (cancelled) return;
      try {
        const data = await pollGame(gameId, session!.token);
        if (cancelled) return;
        setPoll(prev => {
          if (prev && prev.state.round !== data.state.round) {
            setBidInput(""); setActionError(""); setCardKey(k => k + 1);
          }
          return data;
        });
        if (data.state.phase === "complete") {
          nav({ to: "/results/$gameId", params: { gameId } });
          return;
        }
      } catch { /* retry */ }
      if (!cancelled) setTimeout(tick, POLL_MS);
    }

    tick();
    return () => { cancelled = true; };
  }, [session, gameId]);

  async function handleRaise(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !poll || actionPending) return;
    const gs = poll.state;
    const myNum: 1 | 2 = session.mode === "local"
      ? gs.biddingTurn
      : (poll.myRole ?? (session.role === "p1" ? 1 : 2));
    const maxBid = getMaxBidForPlayer(gs, myNum);
    const cents = toC(bidInput || "0");
    if (cents <= gs.currentBid) { setActionError(`Must exceed ${fmt$(gs.currentBid)}`); return; }
    if (cents > maxBid) { setActionError(`Max bid is ${fmt$(maxBid)}`); return; }
    setActionPending(true); setActionError("");
    try {
      await raiseBid(gameId, session.token, cents);
      if (session.mode === "local") setPoll(await pollGame(gameId, session.token));
      setBidInput("");
    }
    catch (e: unknown) { setActionError(e instanceof Error ? e.message : "Failed"); }
    finally { setActionPending(false); }
  }

  async function handlePass() {
    if (!session || !poll || actionPending) return;
    setActionPending(true); setActionError("");
    try {
      await passBid(gameId, session.token);
      if (session.mode === "local") setPoll(await pollGame(gameId, session.token));
    }
    catch (e: unknown) { setActionError(e instanceof Error ? e.message : "Failed"); }
    finally { setActionPending(false); }
  }

  async function handleAdvance() {
    if (!session || advancingRef.current) return;
    advancingRef.current = true;
    try {
      await advanceRound(gameId, session.token);
      if (session.mode === "local") setPoll(await pollGame(gameId, session.token));
    } catch { /* poll picks it up */ }
    finally { advancingRef.current = false; }
  }

  async function handleAssignSlot(position: Position) {
    if (!session || !poll || actionPending) return;
    setActionPending(true); setActionError("");
    try {
      await assignSlot(gameId, session.token, position);
      if (session.mode === "local") setPoll(await pollGame(gameId, session.token));
    }
    catch (e: unknown) { setActionError(e instanceof Error ? e.message : "Failed"); }
    finally { setActionPending(false); }
  }

  function copyCode() {
    if (!poll?.joinCode) return;
    navigator.clipboard.writeText(poll.joinCode).then(() => {
      setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000);
    });
  }

  if (!session || !poll) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={s.connectingDot} />
        <span style={{ fontSize: 13, color: "var(--white-dim)", marginLeft: 10 }}>Connecting…</span>
      </div>
    );
  }

  const gs: GameState = poll.state;
  const isLocal = session.mode === "local";
  const myNum: 1 | 2 = isLocal ? gs.biddingTurn : (poll.myRole ?? (session.role === "p1" ? 1 : 2));
  const myColor = myNum === 1 ? "var(--gold)" : "var(--accent)";
  const isMyTurn = gs.phase === "bidding" && (isLocal || gs.biddingTurn === myNum);
  const myBudget = myNum === 1 ? gs.p1Budget : gs.p2Budget;
  const lr = gs.lastResult;
  const minBid = gs.currentBid + 1;
  const maxBid = gs.phase === "bidding" ? getMaxBidForPlayer(gs, myNum) : 0;
  const canRaise = maxBid > gs.currentBid;
  const currentTurnName = gs.biddingTurn === 1 ? gs.p1Name : gs.p2Name;
  const revealWinner = lr?.winner ?? null;
  const canChooseSlot = gs.phase === "reveal" && !!revealWinner && !lr?.assignedSlot && (isLocal || revealWinner === myNum);
  const waitingForSlotChoice = gs.phase === "reveal" && !!revealWinner && !lr?.assignedSlot && !canChooseSlot;
  const winningBid = lr?.winner === 1 ? lr.bid1 : lr?.winner === 2 ? lr.bid2 : 0;
  const placementOptions = gs.phase === "reveal" && lr?.winner && !lr.assignedSlot
    ? getPlacementOptions(lr.winner === 1 ? gs.roster1 : gs.roster2, lr.player, winningBid)
    : [];

  const passHint =
    gs.currentLeader === myNum ? "Pass — let opponent respond"
    : gs.currentLeader !== null ? `Pass — ${gs.currentLeader === 1 ? gs.p1Name : gs.p2Name} wins at ${fmt$(gs.currentBid)}`
    : gs.firstPassUsed ? "Pass — player goes to no one"
    : "Pass — give opponent a chance";

  return (
    <div style={s.layout}>
      {/* Sidebar */}
      <aside style={s.sidebar} className="desktop-sidebar">
        <div style={s.sideInner}>
          <div style={s.sideHeader}>
            <GavelIcon size={20} glow />
            <span style={s.logoText}>Highest Bid</span>
          </div>
          <div style={s.sideLabel}>Rosters</div>
          <RosterPanel name={gs.p1Name} slots={gs.roster1} budget={gs.p1Budget} num={1} />
          <RosterPanel name={gs.p2Name} slots={gs.roster2} budget={gs.p2Budget} num={2} />
        </div>
      </aside>

      {/* Mobile roster drawer */}
      {rosterOpen && (
        <div style={s.overlay} onClick={() => setRosterOpen(false)}>
          <div style={s.drawer} onClick={e => e.stopPropagation()}>
            <button style={s.drawerClose} onClick={() => setRosterOpen(false)}>Close</button>
            <div style={s.sideLabel}>Rosters</div>
            <RosterPanel name={gs.p1Name} slots={gs.roster1} budget={gs.p1Budget} num={1} />
            <RosterPanel name={gs.p2Name} slots={gs.roster2} budget={gs.p2Budget} num={2} />
          </div>
        </div>
      )}

      <main style={s.main}>
        {/* Topbar */}
        <div style={s.topbar}>
          <div style={s.topLeft}>
            {gs.phase === "waiting"
              ? <span style={s.roundLabel}>Waiting room</span>
              : <><span style={s.roundLabel}>Round {gs.round}</span>
                  <span style={s.roundDot} />
                  <span style={{ fontSize: 12, color: isMyTurn && gs.phase === "bidding" ? myColor : "var(--white-dim)" }}>
                    {gs.phase === "bidding"
                      ? (isLocal ? `${currentTurnName}'s turn` : (isMyTurn ? "Your turn" : "Opponent's turn"))
                      : gs.phase === "reveal" ? "Reveal" : ""}
                  </span>
                </>
            }
          </div>
          <div style={s.topRight}>
            {gs.phase !== "waiting" && (
              <div style={s.budgetRow}>
                <BudgetChip name={gs.p1Name} budget={gs.p1Budget} color="var(--gold)" isMe={!isLocal && myNum === 1} />
                <span style={{ color: "var(--border-strong)", fontSize: 12 }}>·</span>
                <BudgetChip name={gs.p2Name} budget={gs.p2Budget} color="var(--accent)" isMe={!isLocal && myNum === 2} />
              </div>
            )}
            <button className="mobile-roster-toggle" style={s.rosterToggle} onClick={() => setRosterOpen(true)}>Roster</button>
          </div>
        </div>

        {/* ── WAITING ── */}
        {gs.phase === "waiting" && (
          <div style={{ animation: "fadeUp 0.3s ease-out" }}>
            <div style={s.waitingCard}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--white-dim)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>
                Share this code
              </div>
              <div style={s.joinCodeDisplay} onClick={copyCode}>
                <span style={s.joinCodeText}>{poll.joinCode}</span>
                <span style={{ fontSize: 11, color: codeCopied ? "var(--gold)" : "var(--white-dim)", transition: "color 150ms" }}>
                  {codeCopied ? "Copied" : "Click to copy"}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "var(--white-dim)", marginTop: 16, lineHeight: 1.6 }}>
                Your opponent opens this site and clicks <strong style={{ color: "var(--white)", fontWeight: 600 }}>Join with code</strong>.
                The game starts automatically.
              </div>
            </div>
          </div>
        )}

        {/* ── BIDDING ── */}
        {gs.phase === "bidding" && gs.currentPlayer && (
          <div style={{ animation: "fadeUp 0.25s ease-out", display: "flex", flexDirection: "column", gap: 16 }} key={cardKey}>
            <PlayerCard player={gs.currentPlayer} animKey={cardKey} />

            {/* Current bid status */}
            <div style={s.statusBar}>
              {gs.currentLeader ? (
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={s.currentBidAmount}>{fmt$(gs.currentBid)}</span>
                  <span style={{ fontSize: 13, color: "var(--white-dim)" }}>
                    led by {!isLocal && gs.currentLeader === myNum ? "you" : (gs.currentLeader === 1 ? gs.p1Name : gs.p2Name)}
                    {gs.firstPassUsed ? " · opponent passed" : ""}
                  </span>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "var(--font-d)", fontSize: 16, fontWeight: 600, color: "var(--white-dim)" }}>
                    No bids yet
                  </span>
                  {gs.firstPassUsed && (
                    <span style={s.pill}>Opponent passed</span>
                  )}
                </div>
              )}
            </div>

            {/* My turn panel */}
            {isMyTurn && (
              <form onSubmit={handleRaise} style={{ ...s.panel, borderColor: `${myColor.replace("var(", "").replace(")", "")} 30` }}>
                <div style={{ borderLeft: `2px solid ${myColor === "var(--gold)" ? "var(--gold)" : "var(--accent)"}`, paddingLeft: 12, marginBottom: 16 }}>
                  <div style={{ fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 600, color: "var(--white)" }}>{isLocal ? `${currentTurnName}'s turn` : "Your turn"}</div>
                  <div style={{ fontSize: 12, color: "var(--white-dim)", marginTop: 2 }}>
                    Budget: {fmt$(myBudget)} · Max bid: {fmt$(maxBid)}{gs.currentBid > 0 ? ` · min raise ${fmt$(minBid)}` : ""}
                  </div>
                </div>

                {canRaise && (
                  <div style={s.bidRow}>
                    <span style={{ fontFamily: "var(--font-d)", fontSize: 26, fontWeight: 600, color: myColor, lineHeight: 1 }}>$</span>
                    <input
                      type="number"
                      min={minBid}
                      max={maxBid}
                      step="1"
                      value={bidInput}
                      onChange={e => { setBidInput(e.target.value); setActionError(""); }}
                      placeholder={`${minBid}`}
                      autoFocus
                      style={{ ...s.bidInput, color: myColor }}
                    />
                  </div>
                )}

                {!canRaise && (
                  <div style={{ fontSize: 13, color: "#F87171", marginBottom: 12 }}>
                    You must keep at least $1 for each remaining open slot, so you have to pass.
                  </div>
                )}

                {actionError && <div style={s.errMsg}>{actionError}</div>}

                <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                  {canRaise && (
                    <button
                      type="submit"
                      disabled={actionPending || !bidInput}
                      style={{
                        ...s.btnRaise,
                        background: myNum === 1 ? "var(--gold)" : "var(--accent)",
                        opacity: actionPending || !bidInput ? 0.45 : 1,
                      }}
                    >
                      Raise bid
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handlePass}
                    disabled={actionPending}
                    style={{ ...s.btnPass, flex: canRaise ? "0 0 auto" : "1" }}
                    title={passHint}
                  >
                    Pass
                  </button>
                </div>
                <div style={{ fontSize: 12, color: "var(--white-dim)", marginTop: 10 }}>{passHint}</div>
              </form>
            )}

            {/* Waiting panel */}
            {!isMyTurn && !isLocal && (
              <div style={s.waitingTurnPanel}>
                <div style={s.spinnerSm} />
                <div>
                  <div style={{ fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 600, color: "var(--white)" }}>
                    {gs.biddingTurn === 1 ? gs.p1Name : gs.p2Name} is deciding
                  </div>
                  <div style={{ fontSize: 12, color: "var(--white-dim)", marginTop: 2 }}>
                    They can raise or pass
                  </div>
                </div>
              </div>
            )}

            {/* History */}
            {gs.history.length > 0 && (
              <div style={s.historyPanel}>
                <div style={s.sideLabel}>Recent</div>
                {[...gs.history].reverse().slice(0, 3).map(h => (
                  <div key={h.id} style={s.historyRow}>
                    <span style={{ fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 600 }}>{h.playerName}</span>
                    <span style={{ color: "var(--white-dim)" }}>·</span>
                    {h.winner ? (
                      <span style={{ fontSize: 13, color: h.winner === 1 ? "var(--gold)" : "var(--accent)", fontWeight: 500 }}>
                        {h.winner === 1 ? gs.p1Name : gs.p2Name} — {fmt$(h.winningBid!)}
                      </span>
                    ) : (
                      <span style={{ fontSize: 13, color: "var(--white-dim)" }}>No winner</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── REVEAL ── */}
        {gs.phase === "reveal" && lr && (
          <div style={{ animation: "fadeUp 0.25s ease-out", display: "flex", flexDirection: "column", gap: 16 }}>
            <PlayerCard player={lr.player} animKey={-1} />

            <div style={s.revealGrid}>
              <RevealSide name={gs.p1Name} bid={lr.bid1} won={lr.winner === 1} color="var(--gold)" isMe={!isLocal && myNum === 1} />
              <div style={s.vsLabel}>vs</div>
              <RevealSide name={gs.p2Name} bid={lr.bid2} won={lr.winner === 2} color="var(--accent)" isMe={!isLocal && myNum === 2} />
            </div>

            <div style={s.outcomePanel}>
              {lr.winner && lr.assignedSlot ? (
                <>
                  <span style={{ fontFamily: "var(--font-d)", fontSize: 20, fontWeight: 700, color: lr.winner === 1 ? "var(--gold)" : "var(--accent)" }}>
                    {lr.winner === 1 ? gs.p1Name : gs.p2Name} wins
                  </span>
                  <span style={{ fontSize: 12, color: "var(--white-dim)", marginLeft: 10 }}>
                    {lr.slotFilled
                      ? `${lr.player.name} → ${lr.assignedSlot}${lr.outOfPosition ? ` from ${lr.player.position} (-${lr.penaltyApplied})` : ""} · ${fmt$(lr.winner === 1 ? lr.bid1 : lr.bid2)}`
                      : `No roster slot left for ${lr.player.name}`}
                  </span>
                </>
              ) : lr.winner ? (
                <span style={{ fontFamily: "var(--font-d)", fontSize: 18, fontWeight: 600, color: lr.winner === 1 ? "var(--gold)" : "var(--accent)" }}>
                  {lr.winner === 1 ? gs.p1Name : gs.p2Name} wins the auction
                </span>
              ) : (
                <span style={{ fontFamily: "var(--font-d)", fontSize: 18, fontWeight: 600, color: "var(--white-dim)" }}>
                  Both passed — player skipped
                </span>
              )}
            </div>

            {canChooseSlot && (
              <div style={s.slotPicker}>
                <div style={{ fontFamily: "var(--font-d)", fontSize: 15, fontWeight: 600, color: "var(--white)" }}>
                  Choose a lineup slot
                </div>
                <div style={{ fontSize: 12, color: "var(--white-dim)" }}>
                  Pick the position and we&apos;ll place the rest of the lineup around it.
                </div>
                <div style={s.slotGrid}>
                  {placementOptions.map((option) => (
                    <button
                      key={option.position}
                      type="button"
                      onClick={() => handleAssignSlot(option.position)}
                      disabled={actionPending}
                      style={s.slotButton}
                    >
                      <span style={{ fontFamily: "var(--font-d)", fontSize: 15, fontWeight: 700, color: "var(--white)" }}>
                        {option.position}
                      </span>
                      <span style={{ fontFamily: "var(--font-d)", fontSize: 22, fontWeight: 700, color: option.overall >= 85 ? "var(--gold)" : "var(--white)" }}>
                        {option.overall}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--white-dim)" }}>
                        {option.outOfPosition ? `-${option.penalty} penalty` : "natural fit"}
                      </span>
                    </button>
                  ))}
                </div>
                {actionError && <div style={s.errMsg}>{actionError}</div>}
              </div>
            )}

            {waitingForSlotChoice && (
              <div style={s.waitingTurnPanel}>
                <div style={s.spinnerSm} />
                <div>
                  <div style={{ fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 600, color: "var(--white)" }}>
                    {lr.winner === 1 ? gs.p1Name : gs.p2Name} is choosing a lineup slot
                  </div>
                  <div style={{ fontSize: 12, color: "var(--white-dim)", marginTop: 2 }}>
                    The roster updates as soon as they lock it in
                  </div>
                </div>
              </div>
            )}

            {(!lr.winner || lr.assignedSlot) && (
              <button style={s.nextBtn} onClick={handleAdvance}>Next player</button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/* ─── Sub-components ─── */

function BudgetChip({ name, budget, color, isMe }: { name: string; budget: number; color: string; isMe: boolean }) {
  const pct = budget / STARTING_BUDGET;
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 10, color: "var(--white-dim)", fontWeight: 500, marginBottom: 1 }}>{name}{isMe ? " ·you" : ""}</div>
      <div style={{ fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 700, color: pct > 0.2 ? color : "#F87171" }}>
        {fmt$(budget)}
      </div>
    </div>
  );
}

function RevealSide({ name, bid, won, color, isMe }: { name: string; bid: number; won: boolean; color: string; isMe: boolean }) {
  return (
    <div style={{
      border: `1px solid ${won ? color + "60" : "var(--border)"}`,
      borderRadius: 10, padding: "14px 12px", textAlign: "center",
      background: won ? `${color}08` : "transparent",
    }}>
      {won && <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color, marginBottom: 6, textTransform: "uppercase" as const }}>Winner</div>}
      <div style={{ fontSize: 11, color: "var(--white-dim)", marginBottom: 6 }}>{name}{isMe ? " (you)" : ""}</div>
      {bid > 0
        ? <div style={{ fontFamily: "var(--font-d)", fontSize: 28, fontWeight: 700, color }}>{fmt$(bid)}</div>
        : <div style={{ fontFamily: "var(--font-d)", fontSize: 16, fontWeight: 500, color: "var(--white-dim)" }}>Passed</div>
      }
    </div>
  );
}

/* ─── Styles ─── */
const s: Record<string, React.CSSProperties> = {
  layout: { minHeight: "100vh", display: "flex" },
  sidebar: {
    width: 320, background: "var(--court-mid)", borderRight: "1px solid var(--border)",
    flexShrink: 0, position: "sticky" as const, top: 0, height: "100vh", overflowY: "auto",
  },
  sideInner: { padding: 20, display: "flex", flexDirection: "column", gap: 14 },
  sideHeader: { display: "flex", alignItems: "center", gap: 8, padding: "4px 0 8px", borderBottom: "1px solid var(--border)", marginBottom: 4 },
  logoText: { fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 700, color: "var(--white)", letterSpacing: "-0.01em" },
  sideLabel: { fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--white-dim)", textTransform: "uppercase" as const, padding: "2px 0 6px" },
  overlay: { position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 50, display: "flex" },
  drawer: { background: "var(--court-mid)", width: "min(320px, 92vw)", padding: 14, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 },
  drawerClose: { background: "transparent", border: "1px solid var(--border)", color: "var(--white-dim)", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 500, alignSelf: "flex-end" as const, marginBottom: 4 },
  main: { flex: 1, padding: "24px 36px", display: "flex", flexDirection: "column", gap: 18, maxWidth: 780, margin: "0 auto", width: "100%" },
  topbar: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, paddingBottom: 12, borderBottom: "1px solid var(--border)" },
  topLeft: { display: "flex", alignItems: "center", gap: 8 },
  roundLabel: { fontFamily: "var(--font-d)", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", color: "var(--white-dim)", textTransform: "uppercase" as const },
  roundDot: { width: 3, height: 3, borderRadius: "50%", background: "var(--border-strong)" },
  topRight: { display: "flex", alignItems: "center", gap: 12 },
  budgetRow: { display: "flex", alignItems: "center", gap: 12 },
  rosterToggle: { fontSize: 12, fontWeight: 500, color: "var(--white-dim)", background: "var(--court-surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 10px" },
  // Waiting room
  waitingCard: {
    background: "var(--court-surface)", border: "1px solid var(--border)",
    borderRadius: 12, padding: "28px 32px", textAlign: "center",
  },
  joinCodeDisplay: {
    display: "inline-flex", flexDirection: "column" as const, alignItems: "center", gap: 8,
    cursor: "pointer", padding: "20px 32px",
    background: "var(--court-mid)", border: "1px solid var(--border-strong)",
    borderRadius: 10,
  },
  joinCodeText: {
    fontFamily: "var(--font-d)", fontSize: 44, fontWeight: 700,
    color: "var(--gold)", letterSpacing: "0.18em", lineHeight: 1,
  },
  // Bidding
  statusBar: {
    background: "var(--court-surface)", border: "1px solid var(--border)",
    borderRadius: 10, padding: "16px 20px",
  },
  currentBidAmount: {
    fontFamily: "var(--font-d)", fontSize: 38, fontWeight: 700,
    color: "var(--white)", letterSpacing: "-0.02em", lineHeight: 1,
  },
  pill: {
    fontSize: 10, fontWeight: 600, letterSpacing: "0.06em",
    color: "var(--accent)", background: "rgba(16,185,129,0.1)",
    border: "1px solid rgba(16,185,129,0.2)", borderRadius: 100, padding: "2px 8px",
  },
  panel: {
    background: "var(--court-surface)", border: "1px solid var(--border)",
    borderRadius: 12, padding: "20px",
  },
  bidRow: {
    display: "flex", alignItems: "center", gap: 4,
    background: "var(--court-mid)", borderRadius: 8, padding: "10px 16px", marginBottom: 14,
  },
  bidInput: {
    background: "none", border: "none",
    fontFamily: "var(--font-d)", fontSize: 36, fontWeight: 700,
    width: "100%", minWidth: 0, letterSpacing: "-0.01em",
  },
  errMsg: {
    fontSize: 11, color: "#F87171",
    background: "rgba(248,113,113,0.08)", borderRadius: 6, padding: "6px 10px", marginBottom: 8,
  },
  btnRaise: {
    flex: 1, padding: "12px 20px",
    color: "#fff", fontFamily: "var(--font-d)", fontSize: 15, fontWeight: 600,
    letterSpacing: "0.02em", borderRadius: 8, border: "none", transition: "opacity 150ms",
  },
  btnPass: {
    padding: "12px 20px",
    color: "var(--white-dim)", fontFamily: "var(--font-d)", fontSize: 15, fontWeight: 500,
    background: "transparent", borderRadius: 8,
    border: "1px solid var(--border-strong)", transition: "border-color 150ms",
  },
  waitingTurnPanel: {
    background: "var(--court-surface)", border: "1px solid var(--border)",
    borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
  },
  spinnerSm: {
    width: 16, height: 16, borderRadius: "50%",
    border: "2px solid var(--border-strong)", borderTopColor: "var(--white-dim)",
    animation: "spin 0.9s linear infinite", flexShrink: 0,
  },
  historyPanel: {
    background: "var(--court-surface)", border: "1px solid var(--border)",
    borderRadius: 10, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8,
  },
  historyRow: { display: "flex", alignItems: "center", gap: 8 },
  // Reveal
  revealGrid: { display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 10, alignItems: "center" },
  vsLabel: { fontFamily: "var(--font-d)", fontSize: 12, fontWeight: 600, color: "var(--white-dim)", textAlign: "center" as const },
  outcomePanel: {
    background: "var(--court-surface)", border: "1px solid var(--border)",
    borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center",
  },
  slotPicker: {
    background: "var(--court-surface)", border: "1px solid var(--border)",
    borderRadius: 12, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10,
  },
  slotGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 10,
  },
  slotButton: {
    background: "var(--court-mid)", border: "1px solid var(--border)", borderRadius: 10,
    padding: "12px 10px", display: "flex", flexDirection: "column", alignItems: "flex-start",
    gap: 6, color: "var(--white)", cursor: "pointer",
  },
  nextBtn: {
    alignSelf: "center" as const,
    background: "var(--court-surface)", border: "1px solid var(--border-strong)",
    color: "var(--white)", fontFamily: "var(--font-d)", fontSize: 13, fontWeight: 600,
    letterSpacing: "0.02em", padding: "10px 24px", borderRadius: 8,
  },
  connectingDot: {
    width: 8, height: 8, borderRadius: "50%",
    background: "var(--gold)", animation: "pulse 1.2s ease-in-out infinite",
  },
};
