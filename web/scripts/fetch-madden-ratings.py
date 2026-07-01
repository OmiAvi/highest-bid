#!/usr/bin/env python3
"""
Import NFL (Madden) overalls + ESPN headshots for the "NFL" game mode.

Pulls every QB / RB / WR / TE from EA's Madden ratings API (the data behind
https://www.ea.com/en/games/madden-nfl/ratings) and regenerates:
  web/src/lib/nflPlayers.ts        + mobile/src/lib/nflPlayers.ts
  web/src/lib/nflEspnHeadshots.ts  + mobile/src/lib/nflEspnHeadshots.ts
  web/public/headshots/nfl/*.png

Usage:
  python scripts/fetch-madden-ratings.py
"""
from __future__ import annotations

from _football_ratings import build

CONFIG = {
    "league": "nfl",
    # EA Madden ratings pages (data is embedded in the page HTML). 8 pages ≈ top 800
    # players by overall, which covers every relevant QB/RB/WR/TE.
    "page_url": "https://www.ea.com/en/games/madden-nfl/ratings",
    "pages": 8,
    "headshot_subdir": "nfl",
    "players_out_name": "nflPlayers.ts",
    "players_export": "NFL_PLAYERS",
    "players_type": "NFLPlayer",
    "headshots_out_name": "nflEspnHeadshots.ts",
    "headshots_export": "NFL_ESPN_HEADSHOTS",
    "fetch_script": "fetch-madden-ratings.py",
}

if __name__ == "__main__":
    raise SystemExit(build(CONFIG))
