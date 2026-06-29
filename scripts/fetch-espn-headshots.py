#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import unicodedata
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PLAYERS_TS = ROOT / "src" / "lib" / "players.ts"
PUBLIC_DIR = ROOT / "public" / "headshots" / "espn"
OUTPUT_TS = ROOT / "src" / "lib" / "espnHeadshots.ts"

LIST_URL = "https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/athletes?limit=1000"
HEADSHOT_URL = "https://a.espncdn.com/i/headshots/nba/players/full/{athlete_id}.png"

# Known display-name mismatches between our roster file and ESPN records.
ALIASES = {
    "aj dybantsa": ["a j dybantsa", "a.j. dybantsa"],
    "jimmy butler": ["jimmy butler iii"],
    "stephen curry": ["steph curry"],
}


def normalize(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    value = value.lower().replace("&", " and ")
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def slugify(value: str) -> str:
    return normalize(value).replace(" ", "-")


def load_player_names() -> list[str]:
    content = PLAYERS_TS.read_text()
    names = re.findall(r'name:\s*"([^"]+)"', content)
    unique: list[str] = []
    seen: set[str] = set()
    for name in names:
      if name not in seen:
        unique.append(name)
        seen.add(name)
    return unique


def fetch_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))


def fetch_bytes(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as resp:
        return resp.read()


def build_athlete_index() -> dict[str, dict]:
    listing = fetch_json(LIST_URL)
    index: dict[str, dict] = {}
    for item in listing.get("items", []):
        ref = item.get("$ref", "").replace("http://", "https://")
        if not ref:
            continue
        athlete = fetch_json(ref)
        names = {
            athlete.get("fullName", ""),
            athlete.get("displayName", ""),
            athlete.get("shortName", ""),
        }
        for name in names:
            if not name:
                continue
            index[normalize(name)] = athlete
    return index


def write_mapping(mapping: dict[str, str]) -> None:
    lines = [
        "export const ESPN_HEADSHOTS: Record<string, string> = {",
    ]
    for name, path in sorted(mapping.items()):
        lines.append(f'  {json.dumps(name)}: {json.dumps(path)},')
    lines.append("};")
    lines.append("")
    OUTPUT_TS.write_text("\n".join(lines))


def main() -> int:
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    player_names = load_player_names()
    athlete_index = build_athlete_index()
    mapping: dict[str, str] = {}
    missing: list[str] = []

    for player_name in player_names:
        keys = [normalize(player_name), *ALIASES.get(normalize(player_name), [])]
        athlete = None
        for key in keys:
            athlete = athlete_index.get(key)
            if athlete:
                break

        if not athlete:
            missing.append(player_name)
            continue

        athlete_id = athlete["id"]
        image_url = HEADSHOT_URL.format(athlete_id=athlete_id)
        slug = slugify(player_name)
        out_path = PUBLIC_DIR / f"{slug}.png"
        out_path.write_bytes(fetch_bytes(image_url))
        mapping[player_name] = f"/headshots/espn/{slug}.png"

    write_mapping(mapping)

    print(f"Fetched {len(mapping)} headshots.")
    if missing:
        print("Missing:")
        for name in missing:
            print(f"  - {name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
