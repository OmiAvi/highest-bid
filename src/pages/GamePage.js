import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { fmt$, toC, STARTING_BUDGET } from "../lib/game";
import { PlayerCard } from "../components/PlayerCard";
import { RosterPanel } from "../components/RosterPanel";
import { loadSession, pollGame, raiseBid, passBid, advanceRound } from "../lib/api";
const POLL_MS = 1500;
export function GamePage() {
    const { gameId } = useParams({ from: "/game/$gameId" });
    const nav = useNavigate();
    const [session, setSession] = useState(null);
    const [poll, setPoll] = useState(null);
    const [bidInput, setBidInput] = useState("");
    const [actionPending, setActionPending] = useState(false);
    const [actionError, setActionError] = useState("");
    const [cardKey, setCardKey] = useState(0);
    const [rosterOpen, setRosterOpen] = useState(false);
    const [codeCopied, setCodeCopied] = useState(false);
    const advancingRef = useRef(false);
    useEffect(() => {
        const sess = loadSession(gameId);
        if (!sess) {
            nav({ to: "/" });
            return;
        }
        setSession(sess);
    }, [gameId]);
    useEffect(() => {
        if (!session)
            return;
        let cancelled = false;
        async function tick() {
            if (cancelled)
                return;
            try {
                const data = await pollGame(gameId, session.token);
                if (cancelled)
                    return;
                setPoll(prev => {
                    if (prev && prev.state.round !== data.state.round) {
                        setBidInput("");
                        setActionError("");
                        setCardKey(k => k + 1);
                    }
                    return data;
                });
                if (data.state.phase === "complete") {
                    nav({ to: "/results/$gameId", params: { gameId } });
                    return;
                }
            }
            catch { /* retry */ }
            if (!cancelled)
                setTimeout(tick, POLL_MS);
        }
        tick();
        return () => { cancelled = true; };
    }, [session, gameId]);
    async function handleRaise(e) {
        e.preventDefault();
        if (!session || !poll || actionPending)
            return;
        const gs = poll.state;
        const myNum = poll.myRole === "p1" ? 1 : 2;
        const budget = myNum === 1 ? gs.p1Budget : gs.p2Budget;
        const cents = toC(bidInput || "0");
        if (cents <= gs.currentBid) {
            setActionError(`Must exceed ${fmt$(gs.currentBid)}`);
            return;
        }
        if (cents > budget) {
            setActionError(`Exceeds your budget of ${fmt$(budget)}`);
            return;
        }
        setActionPending(true);
        setActionError("");
        try {
            await raiseBid(gameId, session.token, cents);
            setBidInput("");
        }
        catch (e) {
            setActionError(e instanceof Error ? e.message : "Failed");
        }
        finally {
            setActionPending(false);
        }
    }
    async function handlePass() {
        if (!session || !poll || actionPending)
            return;
        setActionPending(true);
        setActionError("");
        try {
            await passBid(gameId, session.token);
        }
        catch (e) {
            setActionError(e instanceof Error ? e.message : "Failed");
        }
        finally {
            setActionPending(false);
        }
    }
    async function handleAdvance() {
        if (!session || advancingRef.current)
            return;
        advancingRef.current = true;
        try {
            await advanceRound(gameId, session.token);
        }
        catch { /* poll picks it up */ }
        finally {
            advancingRef.current = false;
        }
    }
    function copyCode() {
        if (!poll?.joinCode)
            return;
        navigator.clipboard.writeText(poll.joinCode).then(() => {
            setCodeCopied(true);
            setTimeout(() => setCodeCopied(false), 2000);
        });
    }
    if (!session || !poll) {
        return (_jsxs("div", { style: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }, children: [_jsx("div", { style: s.connectingDot }), _jsx("span", { style: { fontSize: 13, color: "var(--white-dim)", marginLeft: 10 }, children: "Connecting\u2026" })] }));
    }
    const gs = poll.state;
    const myNum = poll.myRole === "p1" ? 1 : 2;
    const myColor = myNum === 1 ? "var(--gold)" : "var(--accent)";
    const isMyTurn = gs.phase === "bidding" && gs.biddingTurn === myNum;
    const myBudget = myNum === 1 ? gs.p1Budget : gs.p2Budget;
    const lr = gs.lastResult;
    const minBid = gs.currentBid + 1;
    const canRaise = myBudget > gs.currentBid;
    const passHint = gs.currentLeader === myNum ? "Pass — let opponent respond"
        : gs.currentLeader !== null ? `Pass — ${gs.currentLeader === 1 ? gs.p1Name : gs.p2Name} wins at ${fmt$(gs.currentBid)}`
            : gs.firstPassUsed ? "Pass — player goes to no one"
                : "Pass — give opponent a chance";
    return (_jsxs("div", { style: s.layout, children: [_jsx("aside", { style: s.sidebar, className: "desktop-sidebar", children: _jsxs("div", { style: s.sideInner, children: [_jsxs("div", { style: s.sideHeader, children: [_jsx("div", { style: s.logoDot }), _jsx("span", { style: s.logoText, children: "Highest Bid" })] }), _jsx("div", { style: s.sideLabel, children: "Rosters" }), _jsx(RosterPanel, { name: gs.p1Name, slots: gs.roster1, budget: gs.p1Budget, num: 1 }), _jsx(RosterPanel, { name: gs.p2Name, slots: gs.roster2, budget: gs.p2Budget, num: 2 })] }) }), rosterOpen && (_jsx("div", { style: s.overlay, onClick: () => setRosterOpen(false), children: _jsxs("div", { style: s.drawer, onClick: e => e.stopPropagation(), children: [_jsx("button", { style: s.drawerClose, onClick: () => setRosterOpen(false), children: "Close" }), _jsx("div", { style: s.sideLabel, children: "Rosters" }), _jsx(RosterPanel, { name: gs.p1Name, slots: gs.roster1, budget: gs.p1Budget, num: 1 }), _jsx(RosterPanel, { name: gs.p2Name, slots: gs.roster2, budget: gs.p2Budget, num: 2 })] }) })), _jsxs("main", { style: s.main, children: [_jsxs("div", { style: s.topbar, children: [_jsx("div", { style: s.topLeft, children: gs.phase === "waiting"
                                    ? _jsx("span", { style: s.roundLabel, children: "Waiting room" })
                                    : _jsxs(_Fragment, { children: [_jsxs("span", { style: s.roundLabel, children: ["Round ", gs.round] }), _jsx("span", { style: s.roundDot }), _jsx("span", { style: { fontSize: 12, color: isMyTurn && gs.phase === "bidding" ? myColor : "var(--white-dim)" }, children: gs.phase === "bidding" ? (isMyTurn ? "Your turn" : "Opponent's turn") : gs.phase === "reveal" ? "Reveal" : "" })] }) }), _jsxs("div", { style: s.topRight, children: [gs.phase !== "waiting" && (_jsxs("div", { style: s.budgetRow, children: [_jsx(BudgetChip, { name: gs.p1Name, budget: gs.p1Budget, color: "var(--gold)", isMe: myNum === 1 }), _jsx("span", { style: { color: "var(--border-strong)", fontSize: 12 }, children: "\u00B7" }), _jsx(BudgetChip, { name: gs.p2Name, budget: gs.p2Budget, color: "var(--accent)", isMe: myNum === 2 })] })), _jsx("button", { style: s.rosterToggle, onClick: () => setRosterOpen(true), children: "Roster" })] })] }), gs.phase === "waiting" && (_jsx("div", { style: { animation: "fadeUp 0.3s ease-out" }, children: _jsxs("div", { style: s.waitingCard, children: [_jsx("div", { style: { fontSize: 12, fontWeight: 600, color: "var(--white-dim)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }, children: "Share this code" }), _jsxs("div", { style: s.joinCodeDisplay, onClick: copyCode, children: [_jsx("span", { style: s.joinCodeText, children: poll.joinCode }), _jsx("span", { style: { fontSize: 11, color: codeCopied ? "var(--gold)" : "var(--white-dim)", transition: "color 150ms" }, children: codeCopied ? "Copied" : "Click to copy" })] }), _jsxs("div", { style: { fontSize: 13, color: "var(--white-dim)", marginTop: 16, lineHeight: 1.6 }, children: ["Your opponent opens this site and clicks ", _jsx("strong", { style: { color: "var(--white)", fontWeight: 600 }, children: "Join with code" }), ". The game starts automatically."] })] }) })), gs.phase === "bidding" && gs.currentPlayer && (_jsxs("div", { style: { animation: "fadeUp 0.25s ease-out", display: "flex", flexDirection: "column", gap: 16 }, children: [_jsx(PlayerCard, { player: gs.currentPlayer, animKey: cardKey }), _jsx("div", { style: s.statusBar, children: gs.currentLeader ? (_jsxs("div", { style: { display: "flex", alignItems: "baseline", gap: 8 }, children: [_jsx("span", { style: s.currentBidAmount, children: fmt$(gs.currentBid) }), _jsxs("span", { style: { fontSize: 12, color: "var(--white-dim)" }, children: ["led by ", gs.currentLeader === myNum ? "you" : (gs.currentLeader === 1 ? gs.p1Name : gs.p2Name), gs.firstPassUsed ? " · opponent passed" : ""] })] })) : (_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [_jsx("span", { style: { fontFamily: "var(--font-d)", fontSize: 15, fontWeight: 600, color: "var(--white-dim)" }, children: "No bids yet" }), gs.firstPassUsed && (_jsx("span", { style: s.pill, children: "Opponent passed" }))] })) }), isMyTurn && (_jsxs("form", { onSubmit: handleRaise, style: { ...s.panel, borderColor: `${myColor.replace("var(", "").replace(")", "")} 30` }, children: [_jsxs("div", { style: { borderLeft: `2px solid ${myColor === "var(--gold)" ? "var(--gold)" : "var(--accent)"}`, paddingLeft: 10, marginBottom: 14 }, children: [_jsx("div", { style: { fontFamily: "var(--font-d)", fontSize: 13, fontWeight: 600, color: "var(--white)" }, children: "Your turn" }), _jsxs("div", { style: { fontSize: 11, color: "var(--white-dim)", marginTop: 1 }, children: ["Budget: ", fmt$(myBudget), gs.currentBid > 0 ? ` · min raise ${fmt$(minBid)}` : ""] })] }), canRaise && (_jsxs("div", { style: s.bidRow, children: [_jsx("span", { style: { fontFamily: "var(--font-d)", fontSize: 22, fontWeight: 600, color: myColor, lineHeight: 1 }, children: "$" }), _jsx("input", { type: "number", min: (minBid / 100).toFixed(2), max: (myBudget / 100).toFixed(2), step: "0.01", value: bidInput, onChange: e => { setBidInput(e.target.value); setActionError(""); }, placeholder: `${(minBid / 100).toFixed(2)}`, autoFocus: true, style: {
                                                    ...s.bidInput,
                                                    color: myColor,
                                                } })] })), !canRaise && (_jsx("div", { style: { fontSize: 12, color: "#F87171", marginBottom: 12 }, children: "Not enough budget to raise \u2014 you must pass." })), actionError && _jsx("div", { style: s.errMsg, children: actionError }), _jsxs("div", { style: { display: "flex", gap: 8, marginTop: 4 }, children: [canRaise && (_jsx("button", { type: "submit", disabled: actionPending || !bidInput, style: {
                                                    ...s.btnRaise,
                                                    background: myNum === 1 ? "var(--gold)" : "var(--accent)",
                                                    opacity: actionPending || !bidInput ? 0.45 : 1,
                                                }, children: "Raise bid" })), _jsx("button", { type: "button", onClick: handlePass, disabled: actionPending, style: { ...s.btnPass, flex: canRaise ? "0 0 auto" : "1" }, title: passHint, children: "Pass" })] }), _jsx("div", { style: { fontSize: 11, color: "var(--white-dim)", marginTop: 8 }, children: passHint })] })), !isMyTurn && (_jsxs("div", { style: s.waitingTurnPanel, children: [_jsx("div", { style: s.spinnerSm }), _jsxs("div", { children: [_jsxs("div", { style: { fontFamily: "var(--font-d)", fontSize: 13, fontWeight: 600, color: "var(--white)" }, children: [gs.biddingTurn === 1 ? gs.p1Name : gs.p2Name, " is deciding"] }), _jsx("div", { style: { fontSize: 11, color: "var(--white-dim)", marginTop: 2 }, children: "They can raise or pass" })] })] })), gs.history.length > 0 && (_jsxs("div", { style: s.historyPanel, children: [_jsx("div", { style: s.sideLabel, children: "Recent" }), [...gs.history].reverse().slice(0, 3).map(h => (_jsxs("div", { style: s.historyRow, children: [_jsx("span", { style: { fontFamily: "var(--font-d)", fontSize: 13, fontWeight: 600 }, children: h.playerName }), _jsx("span", { style: { color: "var(--white-dim)" }, children: "\u00B7" }), h.winner ? (_jsxs("span", { style: { fontSize: 12, color: h.winner === 1 ? "var(--gold)" : "var(--accent)", fontWeight: 500 }, children: [h.winner === 1 ? gs.p1Name : gs.p2Name, " \u2014 ", fmt$(h.winningBid)] })) : (_jsx("span", { style: { fontSize: 12, color: "var(--white-dim)" }, children: "No winner" }))] }, h.id)))] }))] }, cardKey)), gs.phase === "reveal" && lr && (_jsxs("div", { style: { animation: "fadeUp 0.25s ease-out", display: "flex", flexDirection: "column", gap: 16 }, children: [_jsx("div", { style: { maxWidth: 400, alignSelf: "center", width: "100%" }, children: _jsx(PlayerCard, { player: lr.player, animKey: -1 }) }), _jsxs("div", { style: s.revealGrid, children: [_jsx(RevealSide, { name: gs.p1Name, bid: lr.bid1, won: lr.winner === 1, color: "var(--gold)", isMe: myNum === 1 }), _jsx("div", { style: s.vsLabel, children: "vs" }), _jsx(RevealSide, { name: gs.p2Name, bid: lr.bid2, won: lr.winner === 2, color: "var(--accent)", isMe: myNum === 2 })] }), _jsx("div", { style: s.outcomePanel, children: lr.winner ? (_jsxs(_Fragment, { children: [_jsxs("span", { style: { fontFamily: "var(--font-d)", fontSize: 20, fontWeight: 700, color: lr.winner === 1 ? "var(--gold)" : "var(--accent)" }, children: [lr.winner === 1 ? gs.p1Name : gs.p2Name, " wins"] }), _jsx("span", { style: { fontSize: 12, color: "var(--white-dim)", marginLeft: 10 }, children: lr.slotFilled
                                                ? `${lr.player.name} → ${lr.player.position} · ${fmt$(lr.winner === 1 ? lr.bid1 : lr.bid2)}`
                                                : `${lr.player.position} slot already filled — player lost` })] })) : (_jsx("span", { style: { fontFamily: "var(--font-d)", fontSize: 18, fontWeight: 600, color: "var(--white-dim)" }, children: "Both passed \u2014 player skipped" })) }), _jsx("button", { style: s.nextBtn, onClick: handleAdvance, children: "Next player" })] }))] })] }));
}
/* ─── Sub-components ─── */
function BudgetChip({ name, budget, color, isMe }) {
    const pct = budget / STARTING_BUDGET;
    return (_jsxs("div", { style: { textAlign: "center" }, children: [_jsxs("div", { style: { fontSize: 10, color: "var(--white-dim)", fontWeight: 500, marginBottom: 1 }, children: [name, isMe ? " ·you" : ""] }), _jsx("div", { style: { fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 700, color: pct > 0.2 ? color : "#F87171" }, children: fmt$(budget) })] }));
}
function RevealSide({ name, bid, won, color, isMe }) {
    return (_jsxs("div", { style: {
            border: `1px solid ${won ? color + "60" : "var(--border)"}`,
            borderRadius: 10, padding: "14px 12px", textAlign: "center",
            background: won ? `${color}08` : "transparent",
        }, children: [won && _jsx("div", { style: { fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color, marginBottom: 6, textTransform: "uppercase" }, children: "Winner" }), _jsxs("div", { style: { fontSize: 11, color: "var(--white-dim)", marginBottom: 6 }, children: [name, isMe ? " (you)" : ""] }), bid > 0
                ? _jsx("div", { style: { fontFamily: "var(--font-d)", fontSize: 28, fontWeight: 700, color }, children: fmt$(bid) })
                : _jsx("div", { style: { fontFamily: "var(--font-d)", fontSize: 16, fontWeight: 500, color: "var(--white-dim)" }, children: "Passed" })] }));
}
/* ─── Styles ─── */
const s = {
    layout: { minHeight: "100vh", display: "flex" },
    sidebar: {
        width: 260, background: "var(--court-mid)", borderRight: "1px solid var(--border)",
        flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflowY: "auto",
    },
    sideInner: { padding: 14, display: "flex", flexDirection: "column", gap: 12 },
    sideHeader: { display: "flex", alignItems: "center", gap: 8, padding: "4px 0 8px", borderBottom: "1px solid var(--border)", marginBottom: 4 },
    logoDot: { width: 20, height: 20, borderRadius: 5, background: "var(--gold)", flexShrink: 0 },
    logoText: { fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 700, color: "var(--white)", letterSpacing: "-0.01em" },
    sideLabel: { fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--white-dim)", textTransform: "uppercase", padding: "2px 0 6px" },
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 50, display: "flex" },
    drawer: { background: "var(--court-mid)", width: 280, padding: 14, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 },
    drawerClose: { background: "transparent", border: "1px solid var(--border)", color: "var(--white-dim)", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 500, alignSelf: "flex-end", marginBottom: 4 },
    main: { flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16, maxWidth: 600, margin: "0 auto", width: "100%" },
    topbar: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, paddingBottom: 12, borderBottom: "1px solid var(--border)" },
    topLeft: { display: "flex", alignItems: "center", gap: 8 },
    roundLabel: { fontFamily: "var(--font-d)", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", color: "var(--white-dim)", textTransform: "uppercase" },
    roundDot: { width: 3, height: 3, borderRadius: "50%", background: "var(--border-strong)" },
    topRight: { display: "flex", alignItems: "center", gap: 12 },
    budgetRow: { display: "flex", alignItems: "center", gap: 12 },
    rosterToggle: { fontSize: 12, fontWeight: 500, color: "var(--white-dim)", background: "var(--court-surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 10px", display: "none" },
    // Waiting room
    waitingCard: {
        background: "var(--court-surface)", border: "1px solid var(--border)",
        borderRadius: 12, padding: "28px 32px", textAlign: "center",
    },
    joinCodeDisplay: {
        display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 8,
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
        borderRadius: 10, padding: "12px 16px",
    },
    currentBidAmount: {
        fontFamily: "var(--font-d)", fontSize: 32, fontWeight: 700,
        color: "var(--white)", letterSpacing: "-0.02em", lineHeight: 1,
    },
    pill: {
        fontSize: 10, fontWeight: 600, letterSpacing: "0.06em",
        color: "var(--accent)", background: "rgba(16,185,129,0.1)",
        border: "1px solid rgba(16,185,129,0.2)", borderRadius: 100, padding: "2px 8px",
    },
    panel: {
        background: "var(--court-surface)", border: "1px solid var(--border)",
        borderRadius: 12, padding: "16px",
    },
    bidRow: {
        display: "flex", alignItems: "center", gap: 4,
        background: "var(--court-mid)", borderRadius: 8, padding: "8px 12px", marginBottom: 12,
    },
    bidInput: {
        background: "none", border: "none",
        fontFamily: "var(--font-d)", fontSize: 30, fontWeight: 700,
        width: "100%", minWidth: 0, letterSpacing: "-0.01em",
    },
    errMsg: {
        fontSize: 11, color: "#F87171",
        background: "rgba(248,113,113,0.08)", borderRadius: 6, padding: "6px 10px", marginBottom: 8,
    },
    btnRaise: {
        flex: 1, padding: "9px 16px",
        color: "#fff", fontFamily: "var(--font-d)", fontSize: 13, fontWeight: 600,
        letterSpacing: "0.02em", borderRadius: 7, border: "none", transition: "opacity 150ms",
    },
    btnPass: {
        padding: "9px 16px",
        color: "var(--white-dim)", fontFamily: "var(--font-d)", fontSize: 13, fontWeight: 500,
        background: "transparent", borderRadius: 7,
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
    vsLabel: { fontFamily: "var(--font-d)", fontSize: 12, fontWeight: 600, color: "var(--white-dim)", textAlign: "center" },
    outcomePanel: {
        background: "var(--court-surface)", border: "1px solid var(--border)",
        borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center",
    },
    nextBtn: {
        alignSelf: "center",
        background: "var(--court-surface)", border: "1px solid var(--border-strong)",
        color: "var(--white)", fontFamily: "var(--font-d)", fontSize: 13, fontWeight: 600,
        letterSpacing: "0.02em", padding: "10px 24px", borderRadius: 8,
    },
    connectingDot: {
        width: 8, height: 8, borderRadius: "50%",
        background: "var(--gold)", animation: "pulse 1.2s ease-in-out infinite",
    },
};
