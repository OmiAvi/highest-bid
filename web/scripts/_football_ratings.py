#!/usr/bin/env python3
"""
Shared implementation for the football (NFL / CFB) ratings importers.

Given a league config it:
  1. Reads every QB / RB / WR / TE from EA's public ratings pages
     (Madden NFL or EA Sports College Football). The pages server-render the full
     ratings as an embedded `"ratingDetails":{"items":[...]}` JSON blob, so we
     parse that directly — no API key / gated headers needed. `overallRating` is
     used as the player's rating.
  2. Resolves an ESPN headshot for each player via ESPN's search API and
     downloads the PNG into web/public/headshots/<subdir>/.
  3. Writes the generated data + headshot map TS files into BOTH the web and
     mobile `src/lib` trees so the two apps stay in sync.

Nothing is written unless a healthy number of players is parsed, so a failed run
never clobbers the hand-seeded starter datasets.
"""
from __future__ import annotations

import json
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

WEB_ROOT = Path(__file__).resolve().parents[1]              # .../web
REPO_ROOT = WEB_ROOT.parent                                 # .../highest-bid
LIB_DIRS = [WEB_ROOT / "src" / "lib", REPO_ROOT / "mobile" / "src" / "lib"]
PUBLIC_HEADSHOTS = WEB_ROOT / "public" / "headshots"        # only the worker serves assets

PAGE_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept": "text/html",
}
ESPN_SEARCH_URL = "https://site.web.api.espn.com/apis/search/v2?limit=8&query={query}"

# EA position shortLabels -> our 4 offensive skill slots (RB is "HB" in EA data).
POSITION_MAP = {"QB": "QB", "HB": "RB", "FB": "RB", "WR": "WR", "TE": "TE"}

# EA gives full NFL team names; map to the abbreviations the app already uses.
NFL_TEAMS = {
    "Arizona Cardinals": "ARI", "Atlanta Falcons": "ATL", "Baltimore Ravens": "BAL",
    "Buffalo Bills": "BUF", "Carolina Panthers": "CAR", "Chicago Bears": "CHI",
    "Cincinnati Bengals": "CIN", "Cleveland Browns": "CLE", "Dallas Cowboys": "DAL",
    "Denver Broncos": "DEN", "Detroit Lions": "DET", "Green Bay Packers": "GB",
    "Houston Texans": "HOU", "Indianapolis Colts": "IND", "Jacksonville Jaguars": "JAX",
    "Kansas City Chiefs": "KC", "Las Vegas Raiders": "LV", "Los Angeles Chargers": "LAC",
    "Los Angeles Rams": "LAR", "Miami Dolphins": "MIA", "Minnesota Vikings": "MIN",
    "New England Patriots": "NE", "New Orleans Saints": "NO", "New York Giants": "NYG",
    "New York Jets": "NYJ", "NY Giants": "NYG", "NY Jets": "NYJ",
    "Philadelphia Eagles": "PHI", "Pittsburgh Steelers": "PIT",
    "San Francisco 49ers": "SF", "Seattle Seahawks": "SEA", "Tampa Bay Buccaneers": "TB",
    "Tennessee Titans": "TEN", "Washington Commanders": "WAS",
}


# ── http helpers ──────────────────────────────────────────────────────────────

def fetch_text(url: str, headers: dict, retries: int = 3) -> str:
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read().decode("utf-8", "replace")
        except Exception:
            if attempt == retries - 1:
                raise
            time.sleep(0.8 * (attempt + 1))
    return ""


def fetch_json(url: str, retries: int = 3) -> dict:
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=25) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception:
            if attempt == retries - 1:
                return {}
            time.sleep(0.5 * (attempt + 1))
    return {}


def fetch_bytes(url: str, retries: int = 3) -> bytes | None:
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=25) as r:
                return r.read()
        except Exception:
            if attempt == retries - 1:
                return None
            time.sleep(0.4 * (attempt + 1))
    return None


# ── text helpers ──────────────────────────────────────────────────────────────

def normalize(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    value = value.lower().replace("&", " and ")
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def slugify(value: str) -> str:
    return normalize(value).replace(" ", "-")


def tier_for(overall: int) -> str:
    if overall >= 90:
        return "superstar"
    if overall >= 85:
        return "allstar"
    if overall >= 80:
        return "starter"
    return "role"


# ── EA ratings (parsed from the SSR-embedded JSON on the ratings pages) ────────

def extract_items(html_text: str) -> list[dict]:
    """Pull the `"ratingDetails":{"items":[...]}` array out of the page HTML."""
    key = '"ratingDetails":{"items":'
    k = html_text.find(key)
    if k < 0:
        return []
    i = html_text.find("[", k)
    if i < 0:
        return []
    start = i
    depth = 0
    in_str = False
    esc = False
    while i < len(html_text):
        c = html_text[i]
        if in_str:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == '"':
                in_str = False
        else:
            if c == '"':
                in_str = True
            elif c == "[":
                depth += 1
            elif c == "]":
                depth -= 1
                if depth == 0:
                    i += 1
                    break
        i += 1
    try:
        return json.loads(html_text[start:i])
    except Exception:
        return []


def parse_item(item: dict, league: str) -> dict | None:
    pos_abbr = ((item.get("position") or {}).get("shortLabel") or "").upper()
    mapped = POSITION_MAP.get(pos_abbr)
    if not mapped:
        return None

    name = f"{item.get('firstName', '')} {item.get('lastName', '')}".strip()
    name = re.sub(r"\s+", " ", name)
    overall = int(item.get("overallRating") or 0)
    if not name or overall <= 0:
        return None

    team_label = (item.get("team") or {}).get("label") or "FA"
    if league == "nfl":
        team = NFL_TEAMS.get(team_label, team_label[:5])
    else:
        team = team_label  # CFB: keep the full school name (the UI truncates on display)

    return {"name": name, "team": team, "position": mapped, "rating": overall}


def fetch_ea_players(page_url: str, pages: int, league: str) -> list[dict]:
    players: dict[str, dict] = {}
    for n in range(1, pages + 1):
        url = page_url if n == 1 else f"{page_url}?page={n}"
        try:
            html_text = fetch_text(url, PAGE_HEADERS)
        except Exception as exc:
            print(f"  page {n}: fetch failed ({exc})")
            continue
        items = extract_items(html_text)
        kept = 0
        for item in items:
            parsed = parse_item(item, league)
            if not parsed:
                continue
            prev = players.get(parsed["name"])
            if not prev or parsed["rating"] > prev["rating"]:
                players[parsed["name"]] = parsed
            kept += 1
        print(f"  page {n}: {len(items)} rated, {kept} QB/RB/WR/TE")
        time.sleep(0.3)
    return list(players.values())


# ── ESPN headshots (search API — one request per player) ──────────────────────

def espn_headshot_url(name: str) -> str | None:
    data = fetch_json(ESPN_SEARCH_URL.format(query=urllib.parse.quote(name)))
    for group in data.get("results", []):
        for content in group.get("contents", []):
            if (content.get("type") or "").lower() != "player":
                continue
            if "football" not in (content.get("sport") or "").lower():
                continue
            img = content.get("image")
            if isinstance(img, dict):
                img = img.get("default") or img.get("href")
            if isinstance(img, str) and img.startswith("http"):
                return img.split("?")[0]
    return None


# ── TS emitters ───────────────────────────────────────────────────────────────

def write_players_ts(players: list[dict], cfg: dict) -> None:
    players_sorted = sorted(players, key=lambda p: (-p["rating"], p["name"]))
    lines = [
        f"// Auto-generated by scripts/{cfg['fetch_script']} — do not edit manually.",
        "// rating = EA overall; hoops stat fields stay 0 (football is scored on overall alone).",
        'import type { NBAPlayer } from "./players";',
        "",
        f"export type {cfg['players_type']} = NBAPlayer;",
        "",
        "const z = { ppg: 0, rpg: 0, apg: 0, fg_pct: 0 } as const;",
        "",
        f"export const {cfg['players_export']}: {cfg['players_type']}[] = [",
    ]
    for p in players_sorted:
        lines.append(
            f'  {{ name: {json.dumps(p["name"])}, team: {json.dumps(p["team"])}, '
            f'position: "{p["position"]}", ...z, rating: {p["rating"]}, '
            f'tier: "{tier_for(p["rating"])}" }},'
        )
    lines.append("];")
    lines.append("")
    for lib in LIB_DIRS:
        (lib / cfg["players_out_name"]).write_text("\n".join(lines))


def write_headshots_ts(mapping: dict[str, str], cfg: dict) -> None:
    lines = [
        f"// Auto-generated by scripts/{cfg['fetch_script']} — do not edit manually.",
        f"export const {cfg['headshots_export']}: Record<string, string> = {{",
    ]
    for name, path in sorted(mapping.items()):
        lines.append(f"  {json.dumps(name)}: {json.dumps(path)},")
    lines.append("};")
    lines.append("")
    for lib in LIB_DIRS:
        (lib / cfg["headshots_out_name"]).write_text("\n".join(lines))


# ── driver ────────────────────────────────────────────────────────────────────

def build(cfg: dict) -> int:
    subdir = cfg["headshot_subdir"]
    out_dir = PUBLIC_HEADSHOTS / subdir
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"[{cfg['league']}] reading EA ratings pages...")
    players = fetch_ea_players(cfg["page_url"], cfg["pages"], cfg["league"])
    print(f"[{cfg['league']}] {len(players)} unique QB/RB/WR/TE parsed from EA")

    if len(players) < 20:
        print(
            f"[{cfg['league']}] ERROR: too few players ({len(players)}). The ratings page layout "
            "likely changed — leaving the seed datasets untouched.\n"
            "  Fix: confirm the page still embeds \"ratingDetails\":{\"items\":[...]} (view-source) "
            "and update extract_items() / page_url in scripts/_football_ratings.py."
        )
        return 1

    print(f"[{cfg['league']}] resolving ESPN headshots...")
    mapping: dict[str, str] = {}

    def resolve(p: dict) -> tuple[str, str | None]:
        src = espn_headshot_url(p["name"])
        if not src:
            return p["name"], None
        img = fetch_bytes(src)
        if not img or len(img) < 800:
            return p["name"], None
        slug = slugify(p["name"])
        (out_dir / f"{slug}.png").write_bytes(img)
        return p["name"], f"/headshots/{subdir}/{slug}.png"

    with ThreadPoolExecutor(max_workers=16) as ex:
        futures = [ex.submit(resolve, p) for p in players]
        done = 0
        for fut in as_completed(futures):
            done += 1
            name, path = fut.result()
            if path:
                mapping[name] = path
            if done % 40 == 0:
                print(f"  {done}/{len(players)} headshots processed, {len(mapping)} matched")

    print(f"[{cfg['league']}] {len(mapping)}/{len(players)} headshots downloaded")

    write_players_ts(players, cfg)
    write_headshots_ts(mapping, cfg)

    print(
        f"[{cfg['league']}] DONE - wrote {cfg['players_out_name']} ({len(players)} players) and "
        f"{cfg['headshots_out_name']} ({len(mapping)} headshots) to web + mobile."
    )
    return 0


if __name__ == "__main__":
    print("Run scripts/fetch-madden-ratings.py or scripts/fetch-cfb-ratings.py instead.")
    sys.exit(1)
