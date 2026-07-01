import {
  NBA_PLAYERS,
  POSITIONS,
  FOOTBALL_POSITIONS,
  isFootballPosition,
  type Position,
  type NBAPlayer,
} from "./players";
import { CBB_PLAYERS } from "./cbbPlayers";
import { NFL_PLAYERS } from "./nflPlayers";
import { CFB_PLAYERS } from "./cfbPlayers";

export const STARTING_BUDGET = 20; // dollars
export const DRAFT_PLAYERS_PER_POSITION = 2;
export const TOTAL_DRAFT_PLAYERS = POSITIONS.length * DRAFT_PLAYERS_PER_POSITION;

export function fmt$(amount: number): string {
  return `$${Math.round(amount)}`;
}

export function toC(dollars: string | number): number {
  return Math.max(0, Math.round(Number(dollars)));
}

export interface PlayerStats {
  ppg: number;
  rpg: number;
  apg: number;
  fg_pct: number;
  rating: number;
  tier: NBAPlayer["tier"];
}

export interface RosterSlot {
  position: Position;
  playerName: string | null;
  playerTeam: string | null;
  sourcePosition: Position | null;
  stats: PlayerStats | null;
  cost: number | null;
  penalty: number;
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
  assignedSlot: Position | null;
  penaltyApplied: number;
}

export interface PlacementOption {
  position: Position;
  overall: number;
  penalty: number;
  outOfPosition: boolean;
}

export type GameMode = "nba" | "cbb" | "nfl" | "cfb";

export interface GameState {
  gameId: string;
  gameMode: GameMode;
  p1Name: string;
  p2Name: string;
  p1Budget: number;
  p2Budget: number;
  roster1: RosterSlot[];
  roster2: RosterSlot[];
  history: AuctionEntry[];
  currentPlayer: NBAPlayer | null;
  draftPool: NBAPlayer[];
  draftIndex: number;
  phase: "waiting" | "bidding" | "reveal" | "complete";
  round: number;
  lastResult: {
    winner: 1 | 2 | null;
    bid1: number;
    bid2: number;
    slotFilled: boolean;
    assignedSlot: Position | null;
    outOfPosition: boolean;
    penaltyApplied: number;
    player: NBAPlayer;
  } | null;
  currentBid: number;
  currentLeader: 1 | 2 | null;
  biddingTurn: 1 | 2;
  openingTurn: 1 | 2;
  loserLastBid: number;
  firstPassUsed: boolean;
  passedPool: NBAPlayer[];
  isSecondChance: boolean;
}

export interface TeamTotals {
  ppg: number;
  rpg: number;
  apg: number;
  penalty: number;
}

export interface SeriesGame {
  game: number;
  winner: 1 | 2;
  p1Score: number;
  p2Score: number;
}

export interface SeriesResult {
  winner: 1 | 2 | null;
  p1Wins: number;
  p2Wins: number;
  games: SeriesGame[];
}

interface OwnedRosterPlayer {
  player: NBAPlayer;
  cost: number | null;
}

interface PlayerAssignment {
  owned: OwnedRosterPlayer;
  slotIndex: number;
  slotPosition: Position;
  penalty: number;
  preference: number;
}

// ── Mode / roster shape ───────────────────────────────────────────────────────
// Basketball fields exactly one player per position. Football fields duplicate
// slots (1 QB, 2 RB, 3 WR, 1 TE), so roster slots are addressed by index, not by
// a unique position key.
const FOOTBALL_ROSTER: Position[] = ["QB", "RB", "RB", "WR", "WR", "WR", "TE"];

export function isFootballMode(mode: GameMode): boolean {
  return mode === "nfl" || mode === "cfb";
}

function rosterTemplate(mode: GameMode): Position[] {
  return isFootballMode(mode) ? [...FOOTBALL_ROSTER] : [...POSITIONS];
}

function templateOf(roster: RosterSlot[]): Position[] {
  return roster.map((slot) => slot.position);
}

function isFootballTemplate(template: Position[]): boolean {
  return template.some((pos) => isFootballPosition(pos));
}

function datasetForMode(mode: GameMode): NBAPlayer[] {
  switch (mode) {
    case "cbb":
      return CBB_PLAYERS;
    case "nfl":
      return NFL_PLAYERS;
    case "cfb":
      return CFB_PLAYERS;
    default:
      return NBA_PLAYERS;
  }
}

function emptyRosterFromTemplate(template: Position[]): RosterSlot[] {
  return template.map((pos) => ({
    position: pos,
    playerName: null,
    playerTeam: null,
    sourcePosition: null,
    stats: null,
    cost: null,
    penalty: 0,
  }));
}

function emptyRoster(mode: GameMode): RosterSlot[] {
  return emptyRosterFromTemplate(rosterTemplate(mode));
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

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function playerStats(player: NBAPlayer): PlayerStats {
  return {
    ppg: player.ppg,
    rpg: player.rpg,
    apg: player.apg,
    fg_pct: player.fg_pct,
    rating: player.rating,
    tier: player.tier,
  };
}

// 2025 NCAA Tournament teams
const MARCH_MADNESS_2025 = new Set([
  "AUB", "DUKE", "HOU", "FLA",
  "MSU", "ALA", "TENN", "SJU",
  "WIS", "ISU", "UK", "TA&M",
  "PUR", "MD", "MICH", "ARIZ",
  "ORE", "CLEM", "MEM",
  "MISS", "MIZ", "BYU", "OU",
  "MARQ", "KU", "UCLA", "VAN",
  "MSST", "CONN", "LOU", "GONZ",
  "CREI", "UGA", "TEX", "SMC",
  "UNM", "ARK", "COLO", "BAY",
  "DRKE", "VCU", "GCU", "WAKE",
  "LIB", "MCN", "UCSD",
  "LIP", "YALE", "AKR",
  "MTST", "RMU",
]);

function buildCBBDraftPool(): NBAPlayer[] {
  const HIGH = 80;
  const MM_FLOOR = 76;
  const takenNames = new Set<string>();
  const pool: NBAPlayer[] = [];

  // target 6-8 March Madness players out of 10
  // with k positions contributing 2 MM and (5-k) contributing 1 MM + 1 non-MM:
  //   total MM = 2k + (5-k) = k+5  →  k = mmTarget-5
  const mmTarget = 6 + Math.floor(Math.random() * 3); // 6, 7, or 8
  const doubleMM = mmTarget - 5; // 1, 2, or 3
  const shuffledPos = shuffle([...POSITIONS] as string[]);
  const doubleMMSet = new Set(shuffledPos.slice(0, doubleMM));

  for (const position of POSITIONS) {
    const available = CBB_PLAYERS.filter((p) => p.position === position && !takenNames.has(p.name));
    const mmHigh = shuffle(available.filter((p) => MARCH_MADNESS_2025.has(p.team) && p.rating >= HIGH));
    const mmLow  = shuffle(available.filter((p) => MARCH_MADNESS_2025.has(p.team) && p.rating >= MM_FLOOR && p.rating < HIGH));
    const nonMM  = shuffle(available.filter((p) => !MARCH_MADNESS_2025.has(p.team) && p.rating >= HIGH));
    const mmAll  = [...mmHigh, ...mmLow];

    const picked: NBAPlayer[] = [];

    if (doubleMMSet.has(position)) {
      // try for 2 MM players, fill remainder with non-MM
      for (const p of mmAll) { if (picked.length >= 2) break; picked.push(p); }
      for (const p of nonMM)  { if (picked.length >= 2) break; picked.push(p); }
    } else {
      // 1 MM + 1 non-MM
      if (mmAll.length > 0) picked.push(mmAll[0]);
      const second = nonMM.find((p) => !picked.includes(p)) ?? mmAll.find((p) => !picked.includes(p));
      if (second) picked.push(second);
    }

    for (const p of picked) { takenNames.add(p.name); pool.push(p); }
  }

  return shuffle(pool);
}

// Football pool holds exactly enough of each position to fill both rosters
// (2 QB, 4 RB, 6 WR, 2 TE = twice the single-team roster), matching the
// basketball pool's "DRAFT_PLAYERS_PER_POSITION per slot" shape.
const FOOTBALL_POOL_NEED: Record<Position, number> = {
  QB: 2,
  RB: 4,
  WR: 6,
  TE: 2,
  // basketball positions never appear in a football pool
  PG: 0, SG: 0, SF: 0, PF: 0, C: 0,
};

function buildFootballDraftPool(dataset: NBAPlayer[]): NBAPlayer[] {
  const takenNames = new Set<string>();
  const pool: NBAPlayer[] = [];

  for (const position of FOOTBALL_POSITIONS) {
    const need = FOOTBALL_POOL_NEED[position] ?? 2;
    const options = shuffle(
      dataset.filter((player) => player.position === position && !takenNames.has(player.name))
    ).slice(0, need);

    for (const player of options) {
      takenNames.add(player.name);
      pool.push(player);
    }
  }

  return shuffle(pool);
}

function buildDraftPool(mode: GameMode = "nba"): NBAPlayer[] {
  if (mode === "cbb") return buildCBBDraftPool();
  if (isFootballMode(mode)) return buildFootballDraftPool(datasetForMode(mode));

  const takenNames = new Set<string>();
  const pool: NBAPlayer[] = [];

  for (const position of POSITIONS) {
    const options = shuffle(
      NBA_PLAYERS.filter((player) => player.position === position && !takenNames.has(player.name))
    ).slice(0, DRAFT_PLAYERS_PER_POSITION);

    for (const player of options) {
      takenNames.add(player.name);
      pool.push(player);
    }
  }

  return shuffle(pool);
}

function hasOpenSlots(roster: RosterSlot[]): boolean {
  return roster.some((slot) => slot.playerName === null);
}

export function getOpenSlotCount(roster: RosterSlot[]): number {
  return roster.filter((slot) => slot.playerName === null).length;
}

function allSlotsFilled(state: Pick<GameState, "roster1" | "roster2">): boolean {
  return !hasOpenSlots(state.roster1) && !hasOpenSlots(state.roster2);
}

function eligiblePositions(player: NBAPlayer): Position[] {
  return player.eligiblePositions?.length ? player.eligiblePositions : [player.position];
}

function canPlayPosition(player: NBAPlayer, slotPosition: Position): boolean {
  return eligiblePositions(player).includes(slotPosition);
}

function createBaseGame(id: string, p1: string, p2: string, phase: GameState["phase"], mode: GameMode = "nba"): GameState {
  const seededPool = buildDraftPool(mode);
  const [firstPlayer, ...draftPool] = seededPool;

  return {
    gameId: id,
    gameMode: mode,
    p1Name: p1 || "Player 1",
    p2Name: p2 || "Player 2",
    p1Budget: STARTING_BUDGET,
    p2Budget: STARTING_BUDGET,
    roster1: emptyRoster(mode),
    roster2: emptyRoster(mode),
    history: [],
    currentPlayer: firstPlayer,
    draftPool,
    draftIndex: firstPlayer ? 1 : 0,
    phase,
    round: 1,
    lastResult: null,
    passedPool: [],
    isSecondChance: false,
    ...biddingDefaults(),
  };
}

export function createWaitingGame(id: string, p1: string, mode: GameMode = "nba"): GameState {
  return createBaseGame(id, p1, "Player 2", "waiting", mode);
}

export function createGame(id: string, p1: string, p2: string, mode: GameMode = "nba"): GameState {
  return createBaseGame(id, p1, p2, "bidding", mode);
}

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

function positionDistance(a: Position, b: Position): number {
  return Math.abs(POSITIONS.indexOf(a as (typeof POSITIONS)[number]) - POSITIONS.indexOf(b as (typeof POSITIONS)[number]));
}

function outOfPositionPenalty(playerPosition: Position, slotPosition: Position): number {
  if (playerPosition === slotPosition) return 0;
  return 2 + positionDistance(playerPosition, slotPosition) * 2;
}

function slotPreferenceScore(player: NBAPlayer, slotPosition: Position): number {
  const distance = positionDistance(player.position, slotPosition);
  if (slotPosition === player.position) return distance;
  if (canPlayPosition(player, slotPosition)) return 10 + distance;
  return 100 + distance;
}

function placementPenalty(player: NBAPlayer, slotPosition: Position): number {
  return canPlayPosition(player, slotPosition) ? 0 : outOfPositionPenalty(player.position, slotPosition);
}

function getPlayerByName(name: string): NBAPlayer | null {
  return (
    NBA_PLAYERS.find((player) => player.name === name) ??
    CBB_PLAYERS.find((player) => player.name === name) ??
    NFL_PLAYERS.find((player) => player.name === name) ??
    CFB_PLAYERS.find((player) => player.name === name) ??
    null
  );
}

function rosterPlayers(roster: RosterSlot[]): OwnedRosterPlayer[] {
  return roster.flatMap((slot) => {
    if (!slot.playerName || !slot.stats || !slot.sourcePosition) return [];

    // Only trust the global name lookup when its position agrees with the slot's
    // source position — names can collide across datasets (e.g. a CFB receiver
    // sharing a name with a college-basketball guard), and a wrong-position
    // match would corrupt placement (especially football's strict slots).
    const knownPlayer = getPlayerByName(slot.playerName);
    const player: NBAPlayer =
      knownPlayer && knownPlayer.position === slot.sourcePosition
        ? knownPlayer
        : {
            name: slot.playerName,
            team: slot.playerTeam ?? "Unknown",
            position: slot.sourcePosition,
            ppg: slot.stats.ppg,
            rpg: slot.stats.rpg,
            apg: slot.stats.apg,
            fg_pct: slot.stats.fg_pct,
            rating: slot.stats.rating,
            tier: slot.stats.tier,
          };

    return [{ player, cost: slot.cost }];
  });
}

function buildRosterFromAssignments(template: Position[], assignments: PlayerAssignment[]): RosterSlot[] {
  const roster = emptyRosterFromTemplate(template);

  for (const assignment of assignments) {
    const idx = assignment.slotIndex;
    if (idx < 0 || idx >= roster.length) continue;
    roster[idx] = {
      position: template[idx],
      playerName: assignment.owned.player.name,
      playerTeam: assignment.owned.player.team,
      sourcePosition: assignment.owned.player.position,
      stats: playerStats(assignment.owned.player),
      cost: assignment.owned.cost,
      penalty: assignment.penalty,
    };
  }

  return roster;
}

interface SlotRef {
  index: number;
  position: Position;
}

function chooseBestAssignments(
  template: Position[],
  players: OwnedRosterPlayer[],
  forcedPlayerName?: string,
  forcedPosition?: Position,
): PlayerAssignment[] | null {
  const strict = isFootballTemplate(template);
  const allSlots: SlotRef[] = template.map((position, index) => ({ index, position }));
  let best: { penalty: number; preference: number; assignments: PlayerAssignment[] } | null = null;

  function search(
    remainingPlayers: OwnedRosterPlayer[],
    openSlots: SlotRef[],
    currentAssignments: PlayerAssignment[],
    penaltySum: number,
    preferenceSum: number,
  ) {
    if (!remainingPlayers.length) {
      if (
        !best ||
        penaltySum < best.penalty ||
        (penaltySum === best.penalty && preferenceSum < best.preference)
      ) {
        best = {
          penalty: penaltySum,
          preference: preferenceSum,
          assignments: currentAssignments.map((assignment) => ({ ...assignment })),
        };
      }
      return;
    }

    const [owned, ...rest] = remainingPlayers;
    const candidateSlots =
      forcedPlayerName && forcedPosition && owned.player.name === forcedPlayerName
        ? openSlots.filter((slot) => slot.position === forcedPosition)
        : openSlots;

    for (const slot of candidateSlots) {
      const fits = canPlayPosition(owned.player, slot.position);
      // Football is strict: a player can only fill a slot of its own position.
      if (strict && !fits) continue;

      const penalty = placementPenalty(owned.player, slot.position);
      const preference = strict ? 0 : slotPreferenceScore(owned.player, slot.position);
      const nextPenalty = penaltySum + penalty;
      const nextPreference = preferenceSum + preference;

      if (
        best &&
        (nextPenalty > best.penalty ||
          (nextPenalty === best.penalty && nextPreference >= best.preference))
      ) {
        continue;
      }

      search(
        rest,
        openSlots.filter((openSlot) => openSlot.index !== slot.index),
        [...currentAssignments, { owned, slotIndex: slot.index, slotPosition: slot.position, penalty, preference }],
        nextPenalty,
        nextPreference,
      );
    }
  }

  search(players, allSlots, [], 0, 0);
  const resolvedBest = best as { assignments: PlayerAssignment[] } | null;
  return resolvedBest?.assignments ?? null;
}

export function getMaxBidForPlayer(state: GameState, playerNum: 1 | 2): number {
  const roster = playerNum === 1 ? state.roster1 : state.roster2;
  const budget = playerNum === 1 ? state.p1Budget : state.p2Budget;
  const openSlots = getOpenSlotCount(roster);
  if (openSlots <= 0) return 0;

  // Football has fixed per-position slots (no out-of-position play), so you can
  // only bid on the current player if you still have an open slot for it.
  if (isFootballMode(state.gameMode) && state.currentPlayer) {
    const pos = state.currentPlayer.position;
    const openForPos = roster.filter((slot) => slot.position === pos && slot.playerName === null).length;
    if (openForPos <= 0) return 0;
  }

  return Math.max(0, budget - Math.max(0, openSlots - 1));
}

function assignPlayerToRosterWithChoice(
  target: RosterSlot[],
  player: NBAPlayer,
  winningBid: number | null,
  chosenPosition?: Position,
) {
  const template = templateOf(target);
  const players = [...rosterPlayers(target), { player, cost: winningBid }];
  const assignments = chooseBestAssignments(template, players, player.name, chosenPosition);

  if (!assignments) {
    return { roster: target, slotFilled: false, assignedSlot: null as Position | null, penaltyApplied: 0, outOfPosition: false };
  }

  const assigned = assignments.find((assignment) => assignment.owned.player.name === player.name) ?? null;
  if (!assigned) {
    return { roster: target, slotFilled: false, assignedSlot: null as Position | null, penaltyApplied: 0, outOfPosition: false };
  }

  const updated = buildRosterFromAssignments(template, assignments);

  return {
    roster: updated,
    slotFilled: true,
    assignedSlot: assigned.slotPosition,
    penaltyApplied: assigned.penalty,
    outOfPosition: assigned.slotPosition !== player.position,
  };
}

export function getPlacementOptions(roster: RosterSlot[], player: NBAPlayer, winningBid: number | null): PlacementOption[] {
  const template = templateOf(roster);
  const strict = isFootballTemplate(template);
  const positions: readonly Position[] = strict ? FOOTBALL_POSITIONS : POSITIONS;

  const options = positions.map((position) => {
    const assignment = assignPlayerToRosterWithChoice(roster, player, winningBid, position);
    const assignedSlot = assignment.assignedSlot;
    const overall = assignment.slotFilled
      ? Math.max(40, player.rating - assignment.penaltyApplied)
      : 0;

    return {
      position,
      overall: assignedSlot === position ? overall : 0,
      penalty: assignedSlot === position ? assignment.penaltyApplied : 0,
      outOfPosition: assignedSlot === position ? assignment.outOfPosition : false,
    };
  });

  // Football has no out-of-position play, so only the player's own position is a
  // valid destination — surface just that one so the winner confirms placement.
  return strict ? options.filter((option) => option.position === player.position) : options;
}

export function applyPassResult(state: GameState): GameState {
  if (state.currentLeader === null && !state.firstPassUsed) {
    const other: 1 | 2 = state.biddingTurn === 1 ? 2 : 1;
    return { ...state, biddingTurn: other, firstPassUsed: true };
  }

  const player = state.currentPlayer!;
  const winner = state.currentLeader;
  const winningBid = winner ? state.currentBid : null;

  let roster1 = state.roster1.map((slot) => ({ ...slot }));
  let roster2 = state.roster2.map((slot) => ({ ...slot }));
  let slotFilled = false;
  let assignedSlot: Position | null = null;
  let penaltyApplied = 0;
  let outOfPosition = false;

  const bid1 = winner === 1 ? state.currentBid : winner === 2 ? state.loserLastBid : 0;
  const bid2 = winner === 2 ? state.currentBid : winner === 1 ? state.loserLastBid : 0;

  const entry: AuctionEntry = {
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

export function applyAssignmentChoice(state: GameState, playerNum: 1 | 2, chosenPosition: Position): GameState {
  const result = state.lastResult;
  if (state.phase !== "reveal" || !result || !result.winner || result.winner !== playerNum || result.assignedSlot) {
    return state;
  }

  const winningBid = result.winner === 1 ? result.bid1 : result.bid2;
  const targetRoster = result.winner === 1 ? state.roster1 : state.roster2;
  const assignment = assignPlayerToRosterWithChoice(targetRoster, result.player, winningBid, chosenPosition);

  if (!assignment.slotFilled || !assignment.assignedSlot) {
    return state;
  }

  const updatedHistory = state.history.map((entry, index) => {
    if (index !== state.history.length - 1) return entry;
    return {
      ...entry,
      assignedSlot: assignment.assignedSlot,
      penaltyApplied: assignment.penaltyApplied,
    };
  });

  return {
    ...state,
    roster1: result.winner === 1 ? assignment.roster : state.roster1,
    roster2: result.winner === 2 ? assignment.roster : state.roster2,
    history: updatedHistory,
    lastResult: {
      ...result,
      slotFilled: assignment.slotFilled,
      assignedSlot: assignment.assignedSlot,
      penaltyApplied: assignment.penaltyApplied,
      outOfPosition: assignment.outOfPosition,
    },
  };
}

export function advanceRound(state: GameState): GameState {
  if (state.lastResult?.winner && !state.lastResult.assignedSlot) {
    return state;
  }

  if (allSlotsFilled(state)) {
    return { ...state, currentPlayer: null, phase: "complete", lastResult: null };
  }

  const nextOpening: 1 | 2 = state.openingTurn === 1 ? 2 : 1;
  const passedByBoth = state.lastResult?.winner === null;
  const recycledQueue = passedByBoth && state.lastResult
    ? [...state.draftPool, state.lastResult.player]
    : [...state.draftPool];
  const [currentPlayer, ...nextDraftPool] = recycledQueue;

  if (!currentPlayer) {
    return { ...state, currentPlayer: null, phase: "complete", lastResult: null };
  }

  return {
    ...state,
    currentPlayer,
    draftPool: nextDraftPool,
    passedPool: [],
    isSecondChance: false,
    draftIndex: state.draftIndex + 1,
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

export function effectiveRating(slot: RosterSlot): number {
  if (!slot.stats) return 0;
  return Math.max(40, slot.stats.rating - slot.penalty);
}

export function teamScore(slots: RosterSlot[]): number {
  const filled = slots.filter((slot) => slot.stats);
  if (!filled.length) return 0;
  return Math.round(filled.reduce((sum, slot) => sum + effectiveRating(slot), 0) / filled.length);
}

export function teamTotals(slots: RosterSlot[]): TeamTotals {
  const filled = slots.filter((slot) => slot.stats);
  if (!filled.length) return { ppg: 0, rpg: 0, apg: 0, penalty: 0 };
  const count = filled.length;
  return {
    ppg: filled.reduce((sum, slot) => sum + (slot.stats?.ppg ?? 0), 0) / count,
    rpg: filled.reduce((sum, slot) => sum + (slot.stats?.rpg ?? 0), 0) / count,
    apg: filled.reduce((sum, slot) => sum + (slot.stats?.apg ?? 0), 0) / count,
    penalty: filled.reduce((sum, slot) => sum + slot.penalty, 0),
  };
}

function teamStrength(slots: RosterSlot[]): number {
  const rating = teamScore(slots);
  // Football is scored on overall alone (no hoops box-score stats).
  if (isFootballTemplate(templateOf(slots))) {
    return rating;
  }
  const totals = teamTotals(slots);
  return 58 + rating * 0.25 + totals.ppg * 0.7 + totals.rpg * 0.4 + totals.apg * 0.8 - totals.penalty * 0.25;
}

function stringSeed(value: string): number {
  let seed = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    seed ^= value.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  return seed >>> 0;
}

function seededRandom(seed: number) {
  let state = seed || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function simulateBestOfSeven(state: GameState): SeriesResult {
  const rand = seededRandom(stringSeed(`${state.gameId}:${state.history.map((entry) => entry.id).join("|")}`));
  const p1Strength = teamStrength(state.roster1);
  const p2Strength = teamStrength(state.roster2);
  const games: SeriesGame[] = [];
  let p1Wins = 0;
  let p2Wins = 0;

  for (let game = 1; game <= 7 && p1Wins < 4 && p2Wins < 4; game += 1) {
    const p1Home = game === 1 || game === 2 || game === 5 || game === 7;
    const homeBonus = p1Home ? 1.8 : -1.8;
    const p1Performance = p1Strength + homeBonus + (rand() - 0.5) * 8;
    const p2Performance = p2Strength - homeBonus + (rand() - 0.5) * 8;

    let p1Score = Math.round(p1Performance + rand() * 8);
    let p2Score = Math.round(p2Performance + rand() * 8);

    if (p1Score === p2Score) {
      if (p1Performance >= p2Performance) p1Score += 1;
      else p2Score += 1;
    }

    const winner: 1 | 2 = p1Score > p2Score ? 1 : 2;
    if (winner === 1) p1Wins += 1;
    else p2Wins += 1;

    games.push({ game, winner, p1Score, p2Score });
  }

  return {
    winner: p1Wins === p2Wins ? null : p1Wins > p2Wins ? 1 : 2,
    p1Wins,
    p2Wins,
    games,
  };
}

export function genId(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}
