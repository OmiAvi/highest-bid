import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { teamScore, teamTotals, fmt$, STARTING_BUDGET, effectiveRating, simulateBestOfSeven } from "../lib/game";
import { POSITIONS, POSITION_COLORS, POSITION_LABELS, TIER_COLORS } from "../lib/players";
import { loadSession, pollGame } from "../lib/api";
import { createResultsShareImage } from "../lib/shareImage";
import { getPlayerHeadshot } from "../lib/headshots";
export function ResultsPage() {
    const { gameId } = useParams({ from: "/results/$gameId" });
    const [gs, setGs] = useState(null);
    const [sharePending, setSharePending] = useState(false);
    const [shareError, setShareError] = useState("");
    useEffect(() => {
        const sess = loadSession(gameId);
        const token = sess?.token ?? "";
        pollGame(gameId, token)
            .then(r => setGs(r.state))
            .catch(() => setGs(null));
    }, [gameId]);
    if (!gs)
        return (_jsx("div", { style: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }, children: _jsx("div", { style: { fontSize: 13, color: "var(--white-dim)" }, children: "Loading\u2026" }) }));
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
        if (!currentGame)
            return;
        setSharePending(true);
        setShareError("");
        try {
            const file = await createResultsShareImage(currentGame, series, siteUrl);
            const nav = navigator;
            if (nav.share && nav.canShare?.({ files: [file] })) {
                await nav.share({
                    title: "Highest Bid Results",
                    text: winner ? `${winner} won the series on Highest Bid.` : "Our Highest Bid series ended in a draw.",
                    files: [file],
                    url: siteUrl,
                });
            }
            else {
                const url = URL.createObjectURL(file);
                const a = document.createElement("a");
                a.href = url;
                a.download = file.name;
                a.click();
                URL.revokeObjectURL(url);
            }
        }
        catch (error) {
            setShareError(error instanceof Error ? error.message : "Could not create share image");
        }
        finally {
            setSharePending(false);
        }
    }
    return (_jsx("div", { style: pg.page, children: _jsxs("div", { style: pg.content, children: [_jsxs("div", { style: pg.header, children: [_jsxs("div", { style: pg.headerTop, children: [_jsx("div", { style: pg.logoDot }), _jsx("span", { style: pg.logoText, children: "Highest Bid" }), _jsxs("span", { style: { fontSize: 11, color: "var(--white-dim)", marginLeft: 8 }, children: ["Game #", gameId] })] }), _jsx("div", { style: pg.resultBanner, children: winner
                                ? _jsxs(_Fragment, { children: [_jsx("span", { style: { color: winner === gs.p1Name ? "var(--gold)" : "var(--accent)" }, children: winner }), " wins the series"] })
                                : _jsx("span", { style: { color: "var(--white-dim)" }, children: "Series drawn" }) })] }), _jsxs("div", { style: pg.scoreRow, children: [_jsx(ScoreCard, { name: gs.p1Name, score: s1, totals: t1, spent: spent1, won: winner === gs.p1Name, color: "var(--gold)", num: 1 }), _jsxs("div", { style: pg.scoreCenter, children: [_jsxs("div", { style: pg.scoreLine, children: [_jsx("span", { style: { color: "var(--gold)" }, children: series.p1Wins }), _jsx("span", { style: { color: "var(--white-dim)", margin: "0 6px" }, children: "\u2014" }), _jsx("span", { style: { color: "var(--accent)" }, children: series.p2Wins })] }), _jsx("div", { style: { fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--white-dim)" }, children: "BEST OF 7" })] }), _jsx(ScoreCard, { name: gs.p2Name, score: s2, totals: t2, spent: spent2, won: winner === gs.p2Name, color: "var(--accent)", num: 2 })] }), _jsx(Section, { label: "Series simulation", children: _jsxs("div", { style: { ...pg.card, padding: 0, overflow: "hidden" }, children: [_jsxs("div", { style: pg.tHeadSeries, children: [_jsx("span", { children: "Game" }), _jsx("span", { style: { textAlign: "right", color: "var(--gold)" }, children: gs.p1Name }), _jsx("span", { style: { textAlign: "right", color: "var(--accent)" }, children: gs.p2Name }), _jsx("span", { style: { textAlign: "right" }, children: "Winner" })] }), series.games.map((game) => (_jsxs("div", { style: pg.tRowSeries, children: [_jsxs("span", { children: ["Game ", game.game] }), _jsx("span", { style: { textAlign: "right", color: "var(--gold)", fontFamily: "var(--font-d)", fontWeight: 700 }, children: game.p1Score }), _jsx("span", { style: { textAlign: "right", color: "var(--accent)", fontFamily: "var(--font-d)", fontWeight: 700 }, children: game.p2Score }), _jsx("span", { style: { textAlign: "right", color: game.winner === 1 ? "var(--gold)" : "var(--accent)" }, children: game.winner === 1 ? gs.p1Name : gs.p2Name })] }, game.game)))] }) }), _jsx(Section, { label: "Stat comparison", children: _jsx("div", { style: pg.card, children: [
                            { label: "PPG", v1: t1.ppg, v2: t2.ppg, max: 36 },
                            { label: "RPG", v1: t1.rpg, v2: t2.rpg, max: 14 },
                            { label: "APG", v1: t1.apg, v2: t2.apg, max: 11 },
                        ].map(b => _jsx(StatBar, { ...b }, b.label)) }) }), _jsx(Section, { label: "Final lineups", children: _jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }, children: [_jsx(FullRoster, { name: gs.p1Name, slots: gs.roster1, color: "var(--gold)", num: 1 }), _jsx(FullRoster, { name: gs.p2Name, slots: gs.roster2, color: "var(--accent)", num: 2 })] }) }), gs.history.length > 0 && (_jsx(Section, { label: "Auction recap", children: _jsxs("div", { style: { ...pg.card, padding: 0, overflow: "hidden" }, children: [_jsxs("div", { style: pg.tHead, children: [_jsx("span", { children: "Player" }), _jsx("span", { style: { textAlign: "center" }, children: "Pos" }), _jsx("span", { style: { textAlign: "right", color: "var(--gold)" }, children: gs.p1Name }), _jsx("span", { style: { textAlign: "right", color: "var(--accent)" }, children: gs.p2Name }), _jsx("span", { style: { textAlign: "right" }, children: "Winner" })] }), gs.history.map(h => (_jsxs("div", { style: pg.tRow, children: [_jsx("span", { style: { fontFamily: "var(--font-d)", fontSize: 13, fontWeight: 600 }, children: h.playerName }), _jsx("span", { style: { display: "flex", justifyContent: "center" }, children: _jsx("span", { style: {
                                                fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
                                                color: POSITION_COLORS[h.position] ?? "var(--white-dim)",
                                                background: `${POSITION_COLORS[h.position] ?? "#888"}18`,
                                                border: `1px solid ${POSITION_COLORS[h.position] ?? "#888"}30`,
                                                borderRadius: 4, padding: "1px 6px",
                                            }, children: h.position }) }), _jsx("span", { style: { textAlign: "right", color: "var(--gold)", fontFamily: "var(--font-d)", fontSize: 13, fontWeight: 600 }, children: h.bid1 > 0 ? fmt$(h.bid1) : "—" }), _jsx("span", { style: { textAlign: "right", color: "var(--accent)", fontFamily: "var(--font-d)", fontSize: 13, fontWeight: 600 }, children: h.bid2 > 0 ? fmt$(h.bid2) : "—" }), _jsx("span", { style: { textAlign: "right", fontSize: 12, fontWeight: 500, color: h.winner === 1 ? "var(--gold)" : h.winner === 2 ? "var(--accent)" : "var(--white-dim)" }, children: h.winner === 1 ? gs.p1Name : h.winner === 2 ? gs.p2Name : "—" })] }, h.id)))] }) })), shareError && (_jsx("div", { style: pg.shareError, children: shareError })), _jsxs("div", { style: pg.ctaRow, children: [_jsx("button", { onClick: handleShareImage, disabled: sharePending, style: { ...pg.shareBtn, opacity: sharePending ? 0.6 : 1 }, children: sharePending ? "Creating image..." : "Share results image" }), _jsx(Link, { to: "/", style: pg.playAgain, children: "Play again" })] })] }) }));
}
function Section({ label, children }) {
    return (_jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 10 }, children: [_jsx("div", { style: { fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--white-dim)", textTransform: "uppercase" }, children: label }), children] }));
}
function ScoreCard({ name, score, totals, spent, won, color, num }) {
    return (_jsxs("div", { style: {
            flex: 1, border: `1px solid ${won ? color + "40" : "var(--border)"}`,
            borderRadius: 12, padding: "18px 16px", textAlign: "center",
            background: won ? `${color}06` : "var(--court-surface)",
            position: "relative",
        }, children: [won && (_jsx("div", { style: {
                    position: "absolute", top: 0, left: 0, right: 0,
                    height: 2, background: color, borderRadius: "12px 12px 0 0",
                } })), _jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 10, marginTop: won ? 8 : 0 }, children: [_jsxs("div", { style: { width: 20, height: 20, borderRadius: 5, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-d)", fontWeight: 700, fontSize: 10, color: "#fff" }, children: ["P", num] }), _jsx("div", { style: { fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 600 }, children: name })] }), _jsx("div", { style: { fontFamily: "var(--font-d)", fontSize: 48, fontWeight: 700, color, lineHeight: 1, letterSpacing: "-0.02em" }, children: score }), _jsx("div", { style: { fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--white-dim)", marginBottom: 12 }, children: "EFFECTIVE OVR" }), _jsx("div", { style: { display: "flex", justifyContent: "center", gap: 14 }, children: [["PPG", totals.ppg], ["RPG", totals.rpg], ["APG", totals.apg]].map(([l, v]) => (_jsxs("div", { style: { textAlign: "center" }, children: [_jsx("div", { style: { fontFamily: "var(--font-d)", fontSize: 15, fontWeight: 600, color }, children: v.toFixed(1) }), _jsx("div", { style: { fontSize: 10, color: "var(--white-dim)" }, children: l })] }, l))) }), _jsxs("div", { style: { fontSize: 11, color: "var(--white-dim)", marginTop: 10 }, children: ["Spent ", fmt$(spent), " \u00B7 Penalty ", totals.penalty] })] }));
}
function StatBar({ label, v1, v2, max }) {
    const p1 = Math.min((v1 / max) * 100, 100);
    const p2 = Math.min((v2 / max) * 100, 100);
    return (_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10 }, children: [_jsx("div", { style: { fontFamily: "var(--font-d)", fontSize: 13, fontWeight: 600, color: "var(--gold)", minWidth: 38, textAlign: "right" }, children: v1.toFixed(1) }), _jsx("div", { style: { flex: 1, height: 4, background: "var(--border-strong)", borderRadius: 2, overflow: "hidden", display: "flex" }, children: _jsx("div", { style: { marginLeft: `${100 - p1}%`, width: `${p1}%`, height: "100%", background: "var(--gold)", borderRadius: 2 } }) }), _jsx("div", { style: { fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "var(--white-dim)", minWidth: 28, textAlign: "center" }, children: label }), _jsx("div", { style: { flex: 1, height: 4, background: "var(--border-strong)", borderRadius: 2, overflow: "hidden" }, children: _jsx("div", { style: { width: `${p2}%`, height: "100%", background: "var(--accent)", borderRadius: 2 } }) }), _jsx("div", { style: { fontFamily: "var(--font-d)", fontSize: 13, fontWeight: 600, color: "var(--accent)", minWidth: 38 }, children: v2.toFixed(1) })] }));
}
function FullRoster({ name, slots, color, num }) {
    return (_jsxs("div", { style: { border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }, children: [_jsxs("div", { style: {
                    padding: "10px 12px", borderBottom: "1px solid var(--border)",
                    display: "flex", alignItems: "center", gap: 8,
                }, children: [_jsxs("div", { style: { width: 20, height: 20, borderRadius: 5, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-d)", fontWeight: 700, fontSize: 10, color: "#fff" }, children: ["P", num] }), _jsx("div", { style: { fontFamily: "var(--font-d)", fontSize: 13, fontWeight: 600 }, children: name })] }), POSITIONS.map(pos => {
                const slot = slots.find(s => s.position === pos);
                const pc = POSITION_COLORS[pos];
                const tc = slot.stats ? TIER_COLORS[slot.stats.tier] : "var(--white-dim)";
                const headshot = slot.playerName && slot.sourcePosition ? getPlayerHeadshot(slot.playerName, slot.sourcePosition) : null;
                return (_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderBottom: "1px solid var(--border)" }, children: [_jsx("span", { style: { fontSize: 10, fontWeight: 600, color: pc, width: 20, flexShrink: 0 }, children: pos }), slot.playerName ? (_jsxs(_Fragment, { children: [_jsx("div", { style: {
                                        width: 36, height: 36, borderRadius: 10, overflow: "hidden",
                                        border: "1px solid var(--border)", background: "var(--court-mid)", flexShrink: 0,
                                    }, children: _jsx("img", { src: headshot ?? "", alt: `${slot.playerName} headshot`, style: { width: "100%", height: "100%", objectFit: "cover", display: "block" } }) }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("div", { style: { fontFamily: "var(--font-d)", fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: slot.playerName }), _jsxs("div", { style: { fontSize: 10, color: "var(--white-dim)" }, children: [slot.playerTeam, " \u00B7 ", slot.sourcePosition, slot.sourcePosition !== slot.position && slot.sourcePosition ? ` in ${slot.position} (-${slot.penalty})` : "", ` · ${fmt$(slot.cost ?? 0)}`] })] }), _jsx("div", { style: { fontFamily: "var(--font-d)", fontSize: 13, fontWeight: 700, color: tc, flexShrink: 0 }, children: effectiveRating(slot) })] })) : (_jsx("div", { style: { flex: 1, fontSize: 11, color: "var(--white-dim)", opacity: 0.45 }, children: POSITION_LABELS[pos] }))] }, pos));
            })] }));
}
const pg = {
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
        textTransform: "uppercase",
    },
    tRow: {
        display: "grid", gridTemplateColumns: "2fr 0.8fr 1fr 1fr 1.2fr",
        padding: "9px 16px", borderBottom: "1px solid var(--border)", alignItems: "center",
    },
    tHeadSeries: {
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1.2fr",
        padding: "8px 16px", borderBottom: "1px solid var(--border)",
        fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "var(--white-dim)",
        textTransform: "uppercase",
    },
    tRowSeries: {
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1.2fr",
        padding: "9px 16px", borderBottom: "1px solid var(--border)", alignItems: "center",
    },
    ctaRow: { display: "flex", justifyContent: "center", gap: 12, paddingBottom: 48, flexWrap: "wrap" },
    shareBtn: {
        background: "var(--court-surface)", color: "var(--white)",
        border: "1px solid var(--border-strong)", fontFamily: "var(--font-d)",
        fontSize: 14, fontWeight: 600, letterSpacing: "0.02em",
        padding: "11px 20px", borderRadius: 8,
    },
    shareError: {
        fontSize: 12, color: "#F87171", textAlign: "center",
        background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.18)",
        borderRadius: 8, padding: "10px 12px",
    },
    playAgain: {
        background: "var(--gold)", color: "#fff",
        fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 600, letterSpacing: "0.02em",
        padding: "11px 28px", borderRadius: 8,
    },
};
