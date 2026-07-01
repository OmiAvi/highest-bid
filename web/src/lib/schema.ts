import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/**
 * Drizzle schema for the Cloudflare D1 database.
 * Mirrors migrations/001_init.sql + 002_multiplayer.sql — those SQL files remain
 * the source of truth applied to D1; this file provides the typed query surface.
 */

export const games = sqliteTable(
  "games",
  {
    id: text("id").primaryKey(),
    player1Name: text("player1_name").notNull().default("Player 1"),
    player2Name: text("player2_name").notNull().default("Player 2"),
    stateJson: text("state_json").notNull().default("{}"),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
    updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
    joinCode: text("join_code"),
    p1Token: text("p1_token"),
    p2Token: text("p2_token"),
    p1BidCents: integer("p1_bid_cents"),
    p2BidCents: integer("p2_bid_cents"),
  },
  (t) => [uniqueIndex("idx_games_join_code").on(t.joinCode)]
);

export const auctionLog = sqliteTable(
  "auction_log",
  {
    id: text("id").primaryKey(),
    gameId: text("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    playerName: text("player_name").notNull(),
    playerPosition: text("player_position").notNull(),
    playerTeam: text("player_team").notNull(),
    playerRating: integer("player_rating").notNull(),
    winner: integer("winner"),
    winningBid: integer("winning_bid"),
    player1Bid: integer("player1_bid"),
    player2Bid: integer("player2_bid"),
    roundNumber: integer("round_number").notNull(),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  },
  (t) => [index("idx_auction_game").on(t.gameId)]
);

export type GameRow = typeof games.$inferSelect;
