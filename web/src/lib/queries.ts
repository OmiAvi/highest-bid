import { eq } from "drizzle-orm";
import { db } from "./server";
import { type GameRow, games } from "./schema";

export type { GameRow };

/** Insert a freshly created game (Player 1). */
export async function insertGame(values: {
  id: string;
  player1Name: string;
  joinCode: string;
  p1Token: string;
  stateJson: string;
}): Promise<void> {
  await db().insert(games).values({
    id: values.id,
    player1Name: values.player1Name,
    player2Name: "Player 2",
    joinCode: values.joinCode,
    p1Token: values.p1Token,
    p2Token: null,
    stateJson: values.stateJson,
  });
}

/** Look up a game by its id (the primary key). */
export async function getGameById(id: string): Promise<GameRow | undefined> {
  return db().select().from(games).where(eq(games.id, id)).get();
}

/** Look up a game by its join code (Player 2 joining). */
export async function getGameByJoinCode(joinCode: string): Promise<GameRow | undefined> {
  return db().select().from(games).where(eq(games.joinCode, joinCode)).get();
}

/** Attach Player 2 (name + token) and persist the new state. */
export async function joinGame(
  id: string,
  p2Name: string,
  p2Token: string,
  stateJson: string
): Promise<void> {
  await db()
    .update(games)
    .set({ player2Name: p2Name, p2Token, stateJson })
    .where(eq(games.id, id));
}

/** Persist a game's serialized state after a move. */
export async function updateGameState(id: string, stateJson: string): Promise<void> {
  await db().update(games).set({ stateJson }).where(eq(games.id, id));
}

/** Resolve which player a token belongs to, or null if it matches neither. */
export function roleOf(token: string, game: GameRow): 1 | 2 | null {
  if (token === game.p1Token) return 1;
  if (token === game.p2Token) return 2;
  return null;
}
