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
  phase: "lobby" | "bidding" | "reveal" | "complete";
  round: number;
  lastResult: {
    winner: 1 | 2 | null;
    bid1: number;
    bid2: number;
    slotFilled: boolean;
    player: NBAPlayer;
  } | null;
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
  };
}

export function applyBids(
  state: GameState,
  bid1Cents: number,
  bid2Cents: number
): GameState {
  const player = state.currentPlayer!;
  const winner: 1 | 2 | null =
    bid1Cents > bid2Cents ? 1 : bid2Cents > bid1Cents ? 2 : null;
  const winningBid = winner === 1 ? bid1Cents : winner === 2 ? bid2Cents : null;

  // Update rosters
  const roster1 = state.roster1.map((s) => ({ ...s }));
  const roster2 = state.roster2.map((s) => ({ ...s }));
  let slotFilled = false;

  if (winner) {
    const targetRoster = winner === 1 ? roster1 : roster2;
    const idx = targetRoster.findIndex(
      (s) => s.position === player.position && s.playerName === null
    );
    if (idx !== -1) {
      targetRoster[idx] = {
        ...targetRoster[idx],
        playerName: player.name,
        playerTeam: player.team,
        stats: {
          ppg: player.ppg,
          rpg: player.rpg,
          apg: player.apg,
          fg_pct: player.fg_pct,
          rating: player.rating,
          tier: player.tier,
        },
        cost: winningBid,
      };
      slotFilled = true;
    }
  }

  const entry: AuctionEntry = {
    id: `r${state.round}`,
    playerName: player.name,
    position: player.position,
    team: player.team,
    stats: {
      ppg: player.ppg,
      rpg: player.rpg,
      apg: player.apg,
      fg_pct: player.fg_pct,
      rating: player.rating,
      tier: player.tier,
    },
    winner,
    winningBid,
    bid1: bid1Cents,
    bid2: bid2Cents,
    round: state.round,
  };

  const newP1Budget = state.p1Budget - bid1Cents;
  const newP2Budget = state.p2Budget - bid2Cents;

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
    lastResult: { winner, bid1: bid1Cents, bid2: bid2Cents, slotFilled, player },
  };
}

export function advanceRound(state: GameState): GameState {
  const next = pickRandomPlayer(state.usedNames);
  return {
    ...state,
    currentPlayer: next,
    usedNames: [...state.usedNames, next.name],
    phase: "bidding",
    round: state.round + 1,
    lastResult: null,
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
