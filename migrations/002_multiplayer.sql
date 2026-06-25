ALTER TABLE games ADD COLUMN join_code TEXT;
ALTER TABLE games ADD COLUMN p1_token TEXT;
ALTER TABLE games ADD COLUMN p2_token TEXT;
ALTER TABLE games ADD COLUMN p1_bid_cents INTEGER;
ALTER TABLE games ADD COLUMN p2_bid_cents INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS idx_games_join_code ON games(join_code);
