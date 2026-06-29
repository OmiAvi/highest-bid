import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { createGame, createLocalGame, joinGame, saveSession } from "../lib/api";
import { ArcadeBackground } from "../components/ArcadeBackground";
import { OnboardingSlides } from "../components/OnboardingSlides";
import { GavelIcon } from "../components/GavelIcon";
export function LobbyPage() {
    const nav = useNavigate();
    const [tab, setTab] = useState("create");
    const [name, setName] = useState("");
    const [joinCode, setJoinCode] = useState("");
    const [localP1Name, setLocalP1Name] = useState("");
    const [localP2Name, setLocalP2Name] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showSlides, setShowSlides] = useState(() => !localStorage.getItem("hb_seen_onboarding"));
    const [gameMode, setGameMode] = useState("nba");
    async function handleCreate(e) {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const { gameId, joinCode: code, token } = await createGame(name.trim() || "Player 1", gameMode);
            saveSession(gameId, { role: "p1", token, playerName: name.trim() || "Player 1" });
            nav({ to: "/game/$gameId", params: { gameId } });
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "Failed to create game");
        }
        finally {
            setLoading(false);
        }
    }
    async function handleJoin(e) {
        e.preventDefault();
        if (!joinCode.trim()) {
            setError("Enter a join code");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const { gameId, token } = await joinGame(joinCode.trim(), name.trim() || "Player 2");
            saveSession(gameId, { role: "p2", token, playerName: name.trim() || "Player 2" });
            nav({ to: "/game/$gameId", params: { gameId } });
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "Failed to join");
        }
        finally {
            setLoading(false);
        }
    }
    async function handleLocal(e) {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const p1 = localP1Name.trim() || "Player 1";
            const p2 = localP2Name.trim() || "Player 2";
            const { gameId, token } = createLocalGame(p1, p2, gameMode);
            saveSession(gameId, { mode: "local", role: "local", token, playerName: p1, player2Name: p2 });
            nav({ to: "/game/$gameId", params: { gameId } });
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "Failed to start local game");
        }
        finally {
            setLoading(false);
        }
    }
    const isCreate = tab === "create";
    const isJoin = tab === "join";
    return (_jsxs("div", { style: s.page, children: [_jsx(ArcadeBackground, {}), _jsxs("div", { style: s.wrap, children: [_jsxs("div", { style: s.header, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }, children: [_jsx(GavelIcon, { size: 28, glow: true }), _jsx("div", { style: s.logoText, children: "Highest Bid" })] }), _jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }, children: [_jsx("div", { style: s.tagline, children: "NBA Draft Auction" }), _jsx("button", { onClick: () => setShowSlides(true), style: { fontSize: 11, color: "var(--white-dim)", background: "none", border: "1px solid var(--border)", borderRadius: 20, padding: "3px 10px", letterSpacing: "0.04em", opacity: 0.7 }, children: "How to play" })] })] }), showSlides ? (_jsx(OnboardingSlides, { onDone: () => { localStorage.setItem("hb_seen_onboarding", "1"); setShowSlides(false); } })) : (_jsxs("div", { style: s.card, children: [_jsx("div", { style: { display: "flex", gap: 8, marginBottom: 16 }, children: ["nba", "cbb"].map(m => (_jsx("button", { onClick: () => setGameMode(m), style: {
                                        flex: 1, padding: "8px 12px", borderRadius: 8, border: "none",
                                        fontFamily: "var(--font-d)", fontSize: 13, fontWeight: 700,
                                        letterSpacing: "0.04em", cursor: "pointer",
                                        background: gameMode === m
                                            ? m === "nba" ? "var(--gold)" : "var(--accent)"
                                            : "var(--court-mid)",
                                        color: gameMode === m ? "#fff" : "var(--white-dim)",
                                        boxShadow: gameMode === m
                                            ? `0 0 16px ${m === "nba" ? "rgba(255,45,120,0.35)" : "rgba(0,229,255,0.3)"}`
                                            : "none",
                                        transition: "all 180ms ease",
                                    }, children: m === "nba" ? "🏀 NBA" : "🎓 College" }, m))) }), _jsxs("div", { style: s.tabs, children: [_jsx("button", { style: { ...s.tab, ...(isCreate ? s.tabActive : {}) }, onClick: () => { setTab("create"); setError(""); }, children: "Online host" }), _jsx("button", { style: { ...s.tab, ...(isJoin ? s.tabActive : {}) }, onClick: () => { setTab("join"); setError(""); }, children: "Join code" }), _jsx("button", { style: { ...s.tab, ...(!isCreate && !isJoin ? s.tabActive : {}) }, onClick: () => { setTab("local"); setError(""); }, children: "Same computer" })] }), isCreate ? (_jsxs("form", { onSubmit: handleCreate, style: s.form, children: [_jsx("label", { style: s.label, children: "Your name" }), _jsx("input", { style: s.input, placeholder: "Player 1", value: name, onChange: e => setName(e.target.value), maxLength: 20, autoFocus: true }), error && _jsx("div", { style: s.errMsg, children: error }), _jsx("button", { type: "submit", style: s.btnPrimary, disabled: loading, children: loading ? "Creating…" : "Create game" })] })) : isJoin ? (_jsxs("form", { onSubmit: handleJoin, style: s.form, children: [_jsx("label", { style: s.label, children: "Join code" }), _jsx("input", { style: { ...s.input, ...s.codeInput }, placeholder: "ABCXYZ", value: joinCode, onChange: e => setJoinCode(e.target.value.toUpperCase().slice(0, 6)), maxLength: 6, autoCapitalize: "characters", spellCheck: false, autoFocus: true }), _jsx("label", { style: s.label, children: "Your name" }), _jsx("input", { style: s.input, placeholder: "Player 2", value: name, onChange: e => setName(e.target.value), maxLength: 20 }), error && _jsx("div", { style: s.errMsg, children: error }), _jsx("button", { type: "submit", style: { ...s.btnPrimary, background: "var(--accent)" }, disabled: loading, children: loading ? "Joining…" : "Join game" })] })) : (_jsxs("form", { onSubmit: handleLocal, style: s.form, children: [_jsx("label", { style: s.label, children: "Player 1 name" }), _jsx("input", { style: s.input, placeholder: "Player 1", value: localP1Name, onChange: e => setLocalP1Name(e.target.value), maxLength: 20, autoFocus: true }), _jsx("label", { style: s.label, children: "Player 2 name" }), _jsx("input", { style: s.input, placeholder: "Player 2", value: localP2Name, onChange: e => setLocalP2Name(e.target.value), maxLength: 20 }), _jsx("div", { style: s.helperText, children: "Players share one screen and pass the device between turns." }), error && _jsx("div", { style: s.errMsg, children: error }), _jsx("button", { type: "submit", style: { ...s.btnPrimary, background: "linear-gradient(135deg, var(--gold), var(--accent))" }, disabled: loading, children: loading ? "Starting…" : "Start same-computer game" })] }))] }))] })] }));
}
const s = {
    page: {
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px 16px", position: "relative",
    },
    wrap: {
        width: "100%", maxWidth: 480, display: "flex", flexDirection: "column",
        gap: 16, position: "relative", zIndex: 1, animation: "fadeUp 0.3s ease-out",
    },
    header: { marginBottom: 4, textAlign: "center" },
    logoText: {
        fontFamily: "var(--font-d)", fontSize: 48, fontWeight: 800,
        color: "var(--white)", letterSpacing: "-0.03em", lineHeight: 1.05,
        marginBottom: 8,
    },
    tagline: {
        fontSize: 20, color: "var(--white-dim)", fontWeight: 500, letterSpacing: "0.01em",
    },
    card: {
        background: "var(--court-surface)", border: "1px solid var(--border)",
        borderRadius: 12, padding: "20px",
    },
    tabs: {
        display: "flex", gap: 2, marginBottom: 20,
        background: "var(--court-mid)", borderRadius: 8, padding: 3,
    },
    tab: {
        flex: 1, padding: "7px 8px", borderRadius: 6,
        fontFamily: "var(--font-d)", fontSize: 12, fontWeight: 600,
        color: "var(--white-dim)", background: "transparent", border: "none",
        transition: "all 150ms ease-out",
    },
    tabActive: {
        background: "var(--court-surface)", color: "var(--white)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
    },
    form: { display: "flex", flexDirection: "column", gap: 8 },
    label: { fontSize: 12, fontWeight: 500, color: "var(--white-dim)", marginBottom: 2 },
    input: {
        background: "var(--court-mid)", border: "1px solid var(--border-strong)",
        borderRadius: 7, padding: "9px 12px",
        color: "var(--white)", fontSize: 14, fontWeight: 500,
        transition: "border-color 150ms ease-out",
    },
    codeInput: {
        fontFamily: "var(--font-d)", fontSize: 22, fontWeight: 700,
        letterSpacing: "0.16em", color: "var(--accent)",
    },
    errMsg: {
        fontSize: 12, color: "#F87171",
        background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
        borderRadius: 6, padding: "8px 12px",
    },
    helperText: { fontSize: 12, color: "var(--white-dim)", lineHeight: 1.5, marginTop: 2 },
    btnPrimary: {
        marginTop: 4, padding: "10px 16px",
        background: "var(--gold)", color: "#fff",
        fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 600,
        letterSpacing: "0.02em", borderRadius: 7, border: "none",
        transition: "opacity 150ms ease-out",
    },
};
