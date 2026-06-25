import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { POSITIONS, POSITION_COLORS, POSITION_LABELS } from "../lib/players";
import { effectiveRating, fmt$ } from "../lib/game";
import { getPlayerHeadshot } from "../lib/headshots";
export function RosterPanel({ name, slots, budget, num }) {
    const color = num === 1 ? "var(--gold)" : "var(--accent)";
    const filledCount = slots.filter(s => s.playerName).length;
    return (_jsxs("div", { style: {
            border: "1px solid var(--border)",
            borderRadius: 10, overflow: "hidden",
        }, children: [_jsxs("div", { style: {
                    padding: "10px 12px",
                    borderBottom: "1px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [_jsxs("div", { style: {
                                    width: 24, height: 24, borderRadius: 5,
                                    background: color, flexShrink: 0,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontFamily: "var(--font-d)", fontWeight: 700, fontSize: 11, color: "#fff",
                                }, children: ["P", num] }), _jsx("div", { style: { fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 600, color: "var(--white)" }, children: name })] }), _jsxs("div", { style: { fontSize: 11, color: "var(--white-dim)", fontVariantNumeric: "tabular-nums" }, children: [filledCount, "/5 \u00B7 ", fmt$(budget)] })] }), POSITIONS.map((pos) => {
                const slot = slots.find((s) => s.position === pos);
                const pc = POSITION_COLORS[pos];
                const filled = slot.playerName !== null;
                const headshot = filled && slot.sourcePosition ? getPlayerHeadshot(slot.playerName, slot.sourcePosition) : null;
                return (_jsxs("div", { style: {
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "8px 12px",
                        borderBottom: "1px solid var(--border)",
                        opacity: filled ? 1 : 0.4,
                    }, children: [_jsx("span", { style: {
                                fontFamily: "var(--font-d)", fontSize: 10, fontWeight: 600,
                                letterSpacing: "0.05em", color: pc, width: 22, flexShrink: 0,
                            }, children: pos }), filled ? (_jsxs(_Fragment, { children: [_jsx("div", { style: {
                                        width: 34, height: 34, borderRadius: 10, overflow: "hidden",
                                        border: "1px solid var(--border)", background: "var(--court-mid)", flexShrink: 0,
                                    }, children: _jsx("img", { src: headshot ?? "", alt: `${slot.playerName} headshot`, style: { width: "100%", height: "100%", objectFit: "cover", display: "block" } }) }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("div", { style: { fontFamily: "var(--font-d)", fontSize: 13, fontWeight: 600, color: "var(--white)", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: slot.playerName }), _jsxs("div", { style: { fontSize: 11, color: "var(--white-dim)", marginTop: 1 }, children: [slot.playerTeam, " \u00B7 ", slot.sourcePosition, slot.sourcePosition !== slot.position && slot.sourcePosition ? ` in ${slot.position} (-${slot.penalty})` : "", slot.cost != null ? ` · ${fmt$(slot.cost)}` : ""] })] }), _jsx("div", { style: { fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 600, color, flexShrink: 0 }, children: effectiveRating(slot) })] })) : (_jsx("div", { style: { flex: 1, fontSize: 12, color: "var(--white-dim)" }, children: POSITION_LABELS[pos] }))] }, pos));
            })] }));
}
