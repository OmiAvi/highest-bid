import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { POSITION_COLORS, TIER_COLORS } from "../lib/players";
import { getPlayerHeadshot } from "../lib/headshots";
const TIER_LABEL = {
    superstar: "Superstar",
    allstar: "All-Star",
    starter: "Starter",
    role: "Role Player",
};
export function PlayerCard({ player, animKey }) {
    const pc = POSITION_COLORS[player.position];
    const tc = TIER_COLORS[player.tier];
    const headshot = getPlayerHeadshot(player.name, player.position);
    return (_jsxs("div", { style: {
            background: "var(--court-surface)",
            border: "1px solid var(--border-strong)",
            borderRadius: 12,
            overflow: "hidden",
            animation: "popIn 0.2s ease-out",
        }, children: [_jsx("div", { style: { height: 2, background: pc } }), _jsxs("div", { style: { padding: "18px 20px" }, children: [_jsxs("div", { style: { display: "grid", gridTemplateColumns: "120px 1fr", gap: 16, alignItems: "center", marginBottom: 16 }, children: [_jsx("div", { style: {
                                    width: 120, height: 120, borderRadius: 18, overflow: "hidden",
                                    border: "1px solid var(--border)", background: "var(--court-mid)", flexShrink: 0,
                                }, children: _jsx("img", { src: headshot, alt: `${player.name} headshot`, style: { width: "100%", height: "100%", objectFit: "cover", display: "block" } }) }), _jsxs("div", { children: [_jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [_jsx("span", { style: {
                                                            fontFamily: "var(--font-d)", fontSize: 11, fontWeight: 600,
                                                            letterSpacing: "0.06em", color: pc,
                                                            background: `${pc}18`, border: `1px solid ${pc}30`,
                                                            borderRadius: 5, padding: "2px 8px",
                                                        }, children: player.position }), _jsx("span", { style: {
                                                            fontFamily: "var(--font-d)", fontSize: 11, fontWeight: 500,
                                                            color: tc, letterSpacing: "0.04em",
                                                        }, children: TIER_LABEL[player.tier] })] }), _jsxs("div", { style: {
                                                    fontFamily: "var(--font-d)", fontSize: 24, fontWeight: 700,
                                                    color: tc, letterSpacing: "-0.01em",
                                                }, children: [player.rating, _jsx("span", { style: { fontSize: 11, fontWeight: 500, color: "var(--white-dim)", marginLeft: 3 }, children: "OVR" })] })] }), _jsxs("div", { style: { marginBottom: 18 }, children: [_jsx("div", { style: { fontSize: 11, fontWeight: 500, color: "var(--white-dim)", letterSpacing: "0.04em", marginBottom: 3 }, children: player.team }), _jsx("div", { style: {
                                                    fontFamily: "var(--font-d)", fontSize: 30, fontWeight: 600,
                                                    lineHeight: 1.1, color: "var(--white)", letterSpacing: "-0.02em",
                                                }, children: player.name })] })] })] }), _jsx("div", { style: {
                            display: "grid", gridTemplateColumns: "repeat(4,1fr)",
                            gap: 1, borderRadius: 7, overflow: "hidden",
                            border: "1px solid var(--border)",
                        }, children: [
                            { label: "PPG", value: player.ppg.toFixed(1) },
                            { label: "RPG", value: player.rpg.toFixed(1) },
                            { label: "APG", value: player.apg.toFixed(1) },
                            { label: "FG%", value: `${player.fg_pct.toFixed(1)}` },
                        ].map(({ label, value }) => (_jsxs("div", { style: {
                                background: "var(--court-mid)", padding: "10px 6px", textAlign: "center",
                            }, children: [_jsx("div", { style: { fontFamily: "var(--font-d)", fontSize: 18, fontWeight: 600, color: "var(--white)", lineHeight: 1 }, children: value }), _jsx("div", { style: { fontSize: 10, fontWeight: 500, letterSpacing: "0.08em", color: "var(--white-dim)", marginTop: 3 }, children: label })] }, label))) })] })] }, animKey));
}
