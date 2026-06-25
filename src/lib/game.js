import { NBA_PLAYERS, POSITIONS } from "./players";
export const STARTING_BUDGET = 2000; // cents ($20.00)
export const DRAFT_PLAYERS_PER_POSITION = 2;
export const TOTAL_DRAFT_PLAYERS = POSITIONS.length * DRAFT_PLAYERS_PER_POSITION;
export function fmt$(cents) {
    return `$${(cents / 100).toFixed(2)}`;
}
export function toC(dollars) {
    return Math.round(Number(dollars) * 100);
}
function emptyRoster() {
    return POSITIONS.map((pos) => ({
        position: pos,
        playerName: null,
        playerTeam: null,
        sourcePosition: null,
        stats: null,
        cost: null,
        penalty: 0,
    }));
}
function biddingDefaults() {
    return {
        currentBid: 0,
        currentLeader: null,
        biddingTurn: 1,
        openingTurn: 1,
        loserLastBid: 0,
        firstPassUsed: false,
    };
}
function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}
function playerStats(player) {
    return {
        ppg: player.ppg,
        rpg: player.rpg,
        apg: player.apg,
        fg_pct: player.fg_pct,
        rating: player.rating,
        tier: player.tier,
    };
}
function buildDraftPool() {
    const takenNames = new Set();
    const pool = [];
    for (const position of POSITIONS) {
        const options = shuffle(NBA_PLAYERS.filter((player) => player.position === position && !takenNames.has(player.name))).slice(0, DRAFT_PLAYERS_PER_POSITION);
        for (const player of options) {
            takenNames.add(player.name);
            pool.push(player);
        }
    }
    return shuffle(pool);
}
function createBaseGame(id, p1, p2, phase) {
    const draftPool = buildDraftPool();
    const firstPlayer = draftPool[0] ?? null;
    return {
        gameId: id,
        p1Name: p1 || "Player 1",
        p2Name: p2 || "Player 2",
        p1Budget: STARTING_BUDGET,
        p2Budget: STARTING_BUDGET,
        roster1: emptyRoster(),
        roster2: emptyRoster(),
        history: [],
        currentPlayer: firstPlayer,
        draftPool,
        draftIndex: 0,
        phase,
        round: 1,
        lastResult: null,
        ...biddingDefaults(),
    };
}
export function createWaitingGame(id, p1) {
    return createBaseGame(id, p1, "Player 2", "waiting");
}
export function createGame(id, p1, p2) {
    return createBaseGame(id, p1, p2, "bidding");
}
export function applyRaise(state, player, bidCents) {
    const other = player === 1 ? 2 : 1;
    return {
        ...state,
        currentBid: bidCents,
        currentLeader: player,
        biddingTurn: other,
        loserLastBid: state.currentBid,
        firstPassUsed: false,
    };
}
function positionDistance(a, b) {
    return Math.abs(POSITIONS.indexOf(a) - POSITIONS.indexOf(b));
}
function outOfPositionPenalty(playerPosition, slotPosition) {
    if (playerPosition === slotPosition)
        return 0;
    return 4 + positionDistance(playerPosition, slotPosition) * 3;
}
function assignPlayerToRoster(target, player, winningBid) {
    const exactSlot = target.find((slot) => slot.position === player.position && slot.playerName === null);
    const fallbackSlot = target
        .filter((slot) => slot.playerName === null)
        .sort((a, b) => positionDistance(player.position, a.position) - positionDistance(player.position, b.position))[0];
    const chosenSlot = exactSlot ?? fallbackSlot ?? null;
    if (!chosenSlot) {
        return { roster: target, slotFilled: false, assignedSlot: null, penaltyApplied: 0, outOfPosition: false };
    }
    const penalty = outOfPositionPenalty(player.position, chosenSlot.position);
    const updated = target.map((slot) => {
        if (slot.position !== chosenSlot.position)
            return slot;
        return {
            ...slot,
            playerName: player.name,
            playerTeam: player.team,
            sourcePosition: player.position,
            stats: playerStats(player),
            cost: winningBid,
            penalty,
        };
    });
    return {
        roster: updated,
        slotFilled: true,
        assignedSlot: chosenSlot.position,
        penaltyApplied: penalty,
        outOfPosition: chosenSlot.position !== player.position,
    };
}
export function applyPassResult(state) {
    if (state.currentLeader === null && !state.firstPassUsed) {
        const other = state.biddingTurn === 1 ? 2 : 1;
        return { ...state, biddingTurn: other, firstPassUsed: true };
    }
    const player = state.currentPlayer;
    const winner = state.currentLeader;
    const winningBid = winner ? state.currentBid : null;
    let roster1 = state.roster1.map((slot) => ({ ...slot }));
    let roster2 = state.roster2.map((slot) => ({ ...slot }));
    let slotFilled = false;
    let assignedSlot = null;
    let penaltyApplied = 0;
    let outOfPosition = false;
    if (winner === 1) {
        const assignment = assignPlayerToRoster(roster1, player, winningBid);
        roster1 = assignment.roster;
        slotFilled = assignment.slotFilled;
        assignedSlot = assignment.assignedSlot;
        penaltyApplied = assignment.penaltyApplied;
        outOfPosition = assignment.outOfPosition;
    }
    else if (winner === 2) {
        const assignment = assignPlayerToRoster(roster2, player, winningBid);
        roster2 = assignment.roster;
        slotFilled = assignment.slotFilled;
        assignedSlot = assignment.assignedSlot;
        penaltyApplied = assignment.penaltyApplied;
        outOfPosition = assignment.outOfPosition;
    }
    const bid1 = winner === 1 ? state.currentBid : winner === 2 ? state.loserLastBid : 0;
    const bid2 = winner === 2 ? state.currentBid : winner === 1 ? state.loserLastBid : 0;
    const entry = {
        id: `r${state.round}`,
        playerName: player.name,
        position: player.position,
        team: player.team,
        stats: playerStats(player),
        winner,
        winningBid,
        bid1,
        bid2,
        round: state.round,
        assignedSlot,
        penaltyApplied,
    };
    return {
        ...state,
        p1Budget: state.p1Budget - (winner === 1 ? state.currentBid : 0),
        p2Budget: state.p2Budget - (winner === 2 ? state.currentBid : 0),
        roster1,
        roster2,
        history: [...state.history, entry],
        currentPlayer: null,
        phase: "reveal",
        lastResult: {
            winner,
            bid1,
            bid2,
            slotFilled,
            assignedSlot,
            outOfPosition,
            penaltyApplied,
            player,
        },
        currentBid: 0,
        currentLeader: null,
        loserLastBid: 0,
        firstPassUsed: false,
    };
}
export function advanceRound(state) {
    const nextIndex = state.draftIndex + 1;
    const nextOpening = state.openingTurn === 1 ? 2 : 1;
    if (nextIndex >= state.draftPool.length) {
        return {
            ...state,
            currentPlayer: null,
            phase: "complete",
            lastResult: null,
        };
    }
    return {
        ...state,
        currentPlayer: state.draftPool[nextIndex],
        draftIndex: nextIndex,
        phase: "bidding",
        round: state.round + 1,
        lastResult: null,
        currentBid: 0,
        currentLeader: null,
        biddingTurn: nextOpening,
        openingTurn: nextOpening,
        loserLastBid: 0,
        firstPassUsed: false,
    };
}
export function effectiveRating(slot) {
    if (!slot.stats)
        return 0;
    return Math.max(40, slot.stats.rating - slot.penalty);
}
export function teamScore(slots) {
    const filled = slots.filter((slot) => slot.stats);
    if (!filled.length)
        return 0;
    return Math.round(filled.reduce((sum, slot) => sum + effectiveRating(slot), 0) / filled.length);
}
export function teamTotals(slots) {
    const filled = slots.filter((slot) => slot.stats);
    if (!filled.length)
        return { ppg: 0, rpg: 0, apg: 0, penalty: 0 };
    const count = filled.length;
    return {
        ppg: filled.reduce((sum, slot) => sum + (slot.stats?.ppg ?? 0), 0) / count,
        rpg: filled.reduce((sum, slot) => sum + (slot.stats?.rpg ?? 0), 0) / count,
        apg: filled.reduce((sum, slot) => sum + (slot.stats?.apg ?? 0), 0) / count,
        penalty: filled.reduce((sum, slot) => sum + slot.penalty, 0),
    };
}
function teamStrength(slots) {
    const totals = teamTotals(slots);
    const rating = teamScore(slots);
    return rating + totals.ppg * 0.32 + totals.rpg * 0.18 + totals.apg * 0.24 - totals.penalty * 0.45;
}
function stringSeed(value) {
    let seed = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
        seed ^= value.charCodeAt(i);
        seed = Math.imul(seed, 16777619);
    }
    return seed >>> 0;
}
function seededRandom(seed) {
    let state = seed || 1;
    return () => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 4294967296;
    };
}
export function simulateBestOfSeven(state) {
    const rand = seededRandom(stringSeed(`${state.gameId}:${state.history.map((entry) => entry.id).join("|")}`));
    const p1Strength = teamStrength(state.roster1);
    const p2Strength = teamStrength(state.roster2);
    const games = [];
    let p1Wins = 0;
    let p2Wins = 0;
    for (let game = 1; game <= 7 && p1Wins < 4 && p2Wins < 4; game += 1) {
        const p1Home = game === 1 || game === 2 || game === 5 || game === 7;
        const homeBonus = p1Home ? 1.8 : -1.8;
        const p1Performance = p1Strength + homeBonus + (rand() - 0.5) * 8;
        const p2Performance = p2Strength - homeBonus + (rand() - 0.5) * 8;
        let p1Score = Math.round(84 + p1Performance + rand() * 14);
        let p2Score = Math.round(84 + p2Performance + rand() * 14);
        if (p1Score === p2Score) {
            if (p1Performance >= p2Performance)
                p1Score += 1;
            else
                p2Score += 1;
        }
        const winner = p1Score > p2Score ? 1 : 2;
        if (winner === 1)
            p1Wins += 1;
        else
            p2Wins += 1;
        games.push({ game, winner, p1Score, p2Score });
    }
    return {
        winner: p1Wins === p2Wins ? null : p1Wins > p2Wins ? 1 : 2,
        p1Wins,
        p2Wins,
        games,
    };
}
export function genId() {
    return Math.random().toString(36).slice(2, 10).toUpperCase();
}
