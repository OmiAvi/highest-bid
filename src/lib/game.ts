import { POSITIONS, type Position, type NBAPlayer, pickRandomPlayer } from "./players";

export const STARTING_BUDGET = 2000; // cents ($20.00)

export function fmt$(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function toC(dollars: string | number): number {
  return Math.round(Number(dollars) * 100);
}

export interface PlayerStats {
  ppg: number;
  rpg: number;
  apg: number;
  fg_pct: number;
  rating: number;
  tier: string;
}

export interface RosterSlot {
  position: Position;
  playerName: string | null;
  playerTeam: string | null;
  stats: PlayerStats | null;
  cost: number | null;
}

export interface AuctionEntry {
  id: string;
  playerName: string;
  position: string;
  team: string;
  stats: PlayerStats;
  winner: 1 | 2 | null;
  winningBid: number | null;
  // bid1/bid2: winning bid for the winner, last bid for the runner-up (0 if they never bid)
  bid1: number;
  bid2: number;
  round: number;
}

export interface GameState {
  gameId: string;
  p1Name: string;
  p2Name: string;
  p1Budget: number;
  p2Budget: number;
  roster1: RosterSlot[];
  roster2: RosterSlot[];
  history: AuctionEntry[];
  usedNames: string[];
  currentPlayer: NBAPlayer | null;
  phase: "waiting" | "bidding" | "reveal" | "complete";
  round: number;
  lastResult: {
    winner: 1 | 2 | null;
    bid1: number;
    bid2: number;
    slotFilled: boolean;
    player: NBAPlayer;
  } | null;
  // Turn-based auction fields
  currentBid: number;           // current highest bid in cents
  currentLeader: 1 | 2 | null; // who placed the current bid
  biddingTurn: 1 | 2;          // whose turn it is to raise or pass
  openingTurn: 1 | 2;          // who goes first this round (alternates)
  loserLastBid: number;         // last bid made by whoever is currently NOT the leader
  firstPassUsed: boolean;       // true when one player passed before any bid (giving other a chance)
}

function emptyRoster(): RosterSlot[] {
  return POSITIONS.map((pos) => ({
    position: pos,
    playerName: null,
    playerTeam: null,
    stats: null,
    cost: null,
  }));
}

function biddingDefaults(): Pick<GameState, "currentBid" | "currentLeader" | "biddingTurn" | "openingTurn" | "loserLastBid" | "firstPassUsed"> {
  return {
    currentBid: 0,
    currentLeader: null,
    biddingTurn: 1,
    openingTurn: 1,
    loserLastBid: 0,
    firstPassUsed: false,
  };
}

export function createWaitingGame(id: string, p1: string): GameState {
  const firstPlayer = pickRandomPlayer([]);
  return {
    gameId: id,
    p1Name: p1 || "Player 1",
    p2Name: "Player 2",
    p1Budget: STARTING_BUDGET,
    p2Budget: STARTING_BUDGET,
    roster1: emptyRoster(),
    roster2: emptyRoster(),
    history: [],
    usedNames: [firstPlayer.name],
    currentPlayer: firstPlayer,
    phase: "waiting",
    round: 1,
    lastResult: null,
    ...biddingDefaults(),
  };
}

// Retained for local/test use
export function createGame(id: string, p1: string, p2: string): GameState {
  const firstPlayer = pickRandomPlayer([]);
  return {
    gameId: id,
    p1Name: p1 || "Player 1",
    p2Name: p2 || "Player 2",
    p1Budget: STARTING_BUDGET,
    p2Budget: STARTING_BUDGET,
    roster1: emptyRoster(),
    roster2: emptyRoster(),
    history: [],
    usedNames: [firstPlayer.name],
    currentPlayer: firstPlayer,
    phase: "bidding",
    round: 1,
    lastResult: null,
    ...biddingDefaults(),
  };
}

// Raise the current bid — switches turn to the other player.
export function applyRaise(state: GameState, player: 1 | 2, bidCents: number): GameState {
  const other: 1 | 2 = player === 1 ? 2 : 1;
  return {
    ...state,
    currentBid: bidCents,
    currentLeader: player,
    biddingTurn: other,
    loserLastBid: state.currentBid,
    firstPassUsed: false,
  };
}

// Active player passes. If no one has bid yet and this is the first pass,
// the other player gets one more chance. Otherwise the round ends.
export function applyPassResult(state: GameState): GameState {
  // Give the other player a final chance if nobody has bid yet
  if (state.currentLeader === null && !state.firstPassUsed) {
    const other: 1 | 2 = state.biddingTurn === 1 ? 2 : 1;
    return { ...state, biddingTurn: other, firstPassUsed: true };
  }

  const player = state.currentPlayer!;
  const winner = state.currentLeader;
  const winningBid = winner ? state.currentBid : null;

  const roster1 = state.roster1.map((s) => ({ ...s }));
  const roster2 = state.roster2.map((s) => ({ ...s }));
  let slotFilled = false;

  if (winner) {
    const target = winner === 1 ? roster1 : roster2;
    const idx = target.findIndex((s) => s.position === player.position && s.playerName === null);
    if (idx !== -1) {
      target[idx] = {
        ...target[idx],
        playerName: player.name,
        playerTeam: player.team,
        stats: {
          ppg: player.ppg, rpg: player.rpg, apg: player.apg,
          fg_pct: player.fg_pct, rating: player.rating, tier: player.tier,
        },
        cost: winningBid,
      };
      slotFilled = true;
    }
  }

  // bid1 = P1's effective final bid; bid2 = P2's effective final bid
  const bid1 = winner === 1 ? state.currentBid : winner === 2 ? state.loserLastBid : 0;
  const bid2 = winner === 2 ? state.currentBid : winner === 1 ? state.loserLastBid : 0;

  const entry: AuctionEntry = {
    id: `r${state.round}`,
    playerName: player.name,
    position: player.position,
    team: player.team,
    stats: {
      ppg: player.ppg, rpg: player.rpg, apg: player.apg,
      fg_pct: player.fg_pct, rating: player.rating, tier: player.tier,
    },
    winner,
    winningBid,
    bid1,
    bid2,
    round: state.round,
  };

  const newP1Budget = state.p1Budget - (winner === 1 ? state.currentBid : 0);
  const newP2Budget = state.p2Budget - (winner === 2 ? state.currentBid : 0);

  const r1Full = roster1.every((s) => s.playerName !== null);
  const r2Full = roster2.every((s) => s.playerName !== null);

  return {
    ...state,
    p1Budget: newP1Budget,
    p2Budget: newP2Budget,
    roster1,
    roster2,
    history: [...state.history, entry],
    currentPlayer: null,
    phase: r1Full && r2Full ? "complete" : "reveal",
    lastResult: { winner, bid1, bid2, slotFilled, player },
    currentBid: 0,
    currentLeader: null,
    loserLastBid: 0,
    firstPassUsed: false,
  };
}

export function advanceRound(state: GameState): GameState {
  const next = pickRandomPlayer(state.usedNames);
  const nextOpening: 1 | 2 = state.openingTurn === 1 ? 2 : 1;
  return {
    ...state,
    currentPlayer: next,
    usedNames: [...state.usedNames, next.name],
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

export function teamScore(slots: RosterSlot[]): number {
  const filled = slots.filter((s) => s.stats);
  if (!filled.length) return 0;
  return Math.round(
    filled.reduce((sum, s) => sum + (s.stats?.rating ?? 0), 0) / filled.length
  );
}

export function teamTotals(slots: RosterSlot[]) {
  const filled = slots.filter((s) => s.stats);
  if (!filled.length) return { ppg: 0, rpg: 0, apg: 0 };
  const n = filled.length;
  return {
    ppg: filled.reduce((s, r) => s + (r.stats?.ppg ?? 0), 0) / n,
    rpg: filled.reduce((s, r) => s + (r.stats?.rpg ?? 0), 0) / n,
    apg: filled.reduce((s, r) => s + (r.stats?.apg ?? 0), 0) / n,
  };
}

export function genId(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}
