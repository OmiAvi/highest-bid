#!/usr/bin/env python3
"""
Import College Football (EA Sports) overalls + ESPN headshots for the "CFB" mode.

Pulls every QB / RB / WR / TE from EA's College Football ratings API (the data
behind https://www.ea.com/games/ea-sports-college-football/ratings) and
regenerates:
  web/src/lib/cfbPlayers.ts        + mobile/src/lib/cfbPlayers.ts
  web/src/lib/cfbEspnHeadshots.ts  + mobile/src/lib/cfbEspnHeadshots.ts
  web/public/headshots/cfb/*.png

Usage:
  python scripts/fetch-cfb-ratings.py
"""
from __future__ import annotations

from _football_ratings import build

CONFIG = {
    "league": "cfb",
    # EA Sports College Football ratings pages (data is embedded in the page HTML).
    "page_url": "https://www.ea.com/games/ea-sports-college-football/ratings",
    "pages": 7,
    "headshot_subdir": "cfb",
    "players_out_name": "cfbPlayers.ts",
    "players_export": "CFB_PLAYERS",
    "players_type": "CFBPlayer",
    "headshots_out_name": "cfbEspnHeadshots.ts",
    "headshots_export": "CFB_ESPN_HEADSHOTS",
    "fetch_script": "fetch-cfb-ratings.py",
}

if __name__ == "__main__":
    raise SystemExit(build(CONFIG))
