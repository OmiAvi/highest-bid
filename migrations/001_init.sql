-- Highest Bid Game Schema
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  player1_name TEXT NOT NULL DEFAULT 'Player 1',
  player2_name TEXT NOT NULL DEFAULT 'Player 2',
  state_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS auction_log (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  player_position TEXT NOT NULL,
  player_team TEXT NOT NULL,
  player_rating INTEGER NOT NULL,
  winner INTEGER,
  winning_bid INTEGER,
  player1_bid INTEGER,
  player2_bid INTEGER,
  round_number INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_auction_game ON auction_log(game_id);
