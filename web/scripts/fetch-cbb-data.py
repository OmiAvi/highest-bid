#!/usr/bin/env python3
"""
Fetch all D1 men's CBB starters for the 2025-26 season from ESPN.

Outputs:
  src/lib/cbbPlayers.ts           — CBBPlayer[] (same shape as NBAPlayer)
  src/lib/cbbEspnHeadshots.ts     — name → local path mapping
  public/headshots/cbb/*.png      — headshot images

A player is considered a "starter" if:
  gamesStarted >= 10  AND  gamesPlayed >= 15
"""

from __future__ import annotations

import json
import re
import time
import unicodedata
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HEADSHOT_DIR = ROOT / "public" / "headshots" / "cbb"
PLAYERS_OUT = ROOT / "src" / "lib" / "cbbPlayers.ts"
HEADSHOTS_OUT = ROOT / "src" / "lib" / "cbbEspnHeadshots.ts"

SEASON = 2026
TEAMS_URL = (
    "https://site.api.espn.com/apis/site/v2/sports/basketball/"
    "mens-college-basketball/teams?limit=1000"
)
ROSTER_URL = (
    "https://site.api.espn.com/apis/site/v2/sports/basketball/"
    "mens-college-basketball/teams/{team_id}/roster"
)
STATS_URL = (
    "https://sports.core.api.espn.com/v2/sports/basketball/leagues/"
    "mens-college-basketball/seasons/{season}/types/2/athletes/{athlete_id}/statistics"
)

MIN_STARTS = 10
MIN_GAMES = 15


# ── helpers ──────────────────────────────────────────────────────────────────

def slugify(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def fetch_json(url: str, retries: int = 3) -> dict:
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=20) as r:
                return json.loads(r.read())
        except Exception as exc:
            if attempt == retries - 1:
                raise
            time.sleep(0.6 * (attempt + 1))
    return {}


def fetch_bytes(url: str, retries: int = 3) -> bytes | None:
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=20) as r:
                return r.read()
        except Exception:
            if attempt == retries - 1:
                return None
            time.sleep(0.4 * (attempt + 1))
    return None


def get_stat(categories: list, stat_name: str) -> float:
    for cat in categories:
        for st in cat.get("stats", []):
            if st.get("name") == stat_name:
                try:
                    return float(st["value"])
                except (TypeError, ValueError):
                    return 0.0
    return 0.0


# ── position mapping ─────────────────────────────────────────────────────────
# ESPN CBB uses G / G/F / F / F/C / C  — map to PG/SG/SF/PF/C

def map_position(espn_abbr: str, apg: float, rpg: float, height_inches: float) -> str:
    p = (espn_abbr or "F").upper().replace("/", "")
    if p in ("G", "GG"):
        return "PG" if apg >= 3.5 else "SG"
    if p in ("GF", "FG"):
        return "SG" if apg >= 2.5 else "SF"
    if p in ("F", "FF"):
        return "PF" if rpg >= 6.5 or height_inches >= 80 else "SF"
    if p in ("FC", "CF"):
        return "PF"
    if p in ("C", "CC"):
        return "C"
    # fallback
    return "SF"


# ── rating / tier ─────────────────────────────────────────────────────────────

def compute_rating(ppg: float, rpg: float, apg: float, fg_pct: float,
                   gs: int, gp: int) -> int:
    start_bonus = (gs / gp * 5) if gp > 0 else 0
    raw = 50 + ppg * 1.2 + rpg * 0.6 + apg * 0.8 + (fg_pct - 40) * 0.25 + start_bonus
    return int(min(85, max(50, round(raw))))


def compute_tier(rating: int) -> str:
    if rating >= 80:
        return "superstar"
    if rating >= 72:
        return "allstar"
    if rating >= 62:
        return "starter"
    return "role"


# ── fetch helpers ─────────────────────────────────────────────────────────────

def fetch_roster(team_id: str, abbr: str) -> list[dict]:
    try:
        data = fetch_json(ROSTER_URL.format(team_id=team_id))
        athletes = data.get("athletes", [])
        for a in athletes:
            a["_team_abbr"] = abbr
        return athletes
    except Exception:
        return []


def fetch_player_stats(athlete_id: str) -> dict | None:
    try:
        url = STATS_URL.format(season=SEASON, athlete_id=athlete_id)
        data = fetch_json(url)
        cats = data.get("splits", {}).get("categories", [])
        return {
            "ppg":    get_stat(cats, "avgPoints"),
            "rpg":    get_stat(cats, "avgRebounds"),
            "apg":    get_stat(cats, "avgAssists"),
            "fg_pct": get_stat(cats, "fieldGoalPct"),
            "gp":     int(get_stat(cats, "gamesPlayed")),
            "gs":     int(get_stat(cats, "gamesStarted")),
            "mpg":    get_stat(cats, "avgMinutes"),
        }
    except Exception:
        return None


# ── main ──────────────────────────────────────────────────────────────────────

def main() -> int:
    HEADSHOT_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Teams
    print("Fetching teams…")
    teams_data = fetch_json(TEAMS_URL)
    teams = (
        teams_data.get("sports", [{}])[0]
        .get("leagues", [{}])[0]
        .get("teams", [])
    )
    team_info = {t["team"]["id"]: t["team"]["abbreviation"] for t in teams}
    print(f"  {len(team_info)} D1 teams")

    # 2. Rosters
    print("Fetching rosters (parallel)…")
    all_athletes: list[dict] = []
    seen_ids: set[str] = set()

    with ThreadPoolExecutor(max_workers=20) as ex:
        futures = {
            ex.submit(fetch_roster, tid, abbr): tid
            for tid, abbr in team_info.items()
        }
        done = 0
        for fut in as_completed(futures):
            done += 1
            athletes = fut.result()
            for a in athletes:
                aid = a.get("id", "")
                if aid and aid not in seen_ids:
                    seen_ids.add(aid)
                    all_athletes.append(a)
            if done % 60 == 0:
                print(f"  {done}/{len(team_info)} rosters fetched, "
                      f"{len(all_athletes)} unique athletes so far")

    print(f"  {len(all_athletes)} unique athletes across all rosters")

    # 3. Stats — fetch for every athlete, filter to starters
    print("Fetching individual stats (parallel, ~3–5 min)…")

    def fetch_with_meta(a: dict) -> tuple[dict, dict | None]:
        time.sleep(0.02)   # gentle throttle before spawning
        return a, fetch_player_stats(a["id"])

    starters: list[dict] = []
    done_stats = 0

    with ThreadPoolExecutor(max_workers=40) as ex:
        futures2 = {ex.submit(fetch_with_meta, a): a for a in all_athletes}
        for fut in as_completed(futures2):
            done_stats += 1
            a, stats = fut.result()
            if done_stats % 500 == 0:
                print(f"  {done_stats}/{len(all_athletes)} stats fetched, "
                      f"{len(starters)} starters so far")

            if not stats:
                continue
            if stats["gs"] < MIN_STARTS or stats["gp"] < MIN_GAMES:
                continue

            espn_pos = a.get("position", {}).get("abbreviation", "F")
            height_in = float(a.get("height", 76) or 76)
            pos = map_position(espn_pos, stats["apg"], stats["rpg"], height_in)
            rating = compute_rating(
                stats["ppg"], stats["rpg"], stats["apg"],
                stats["fg_pct"], stats["gs"], stats["gp"],
            )
            tier = compute_tier(rating)

            starters.append({
                "id":           a["id"],
                "name":         a["displayName"],
                "team":         a["_team_abbr"],
                "position":     pos,
                "ppg":          round(stats["ppg"], 1),
                "rpg":          round(stats["rpg"], 1),
                "apg":          round(stats["apg"], 1),
                "fg_pct":       round(stats["fg_pct"], 1),
                "rating":       rating,
                "tier":         tier,
                "headshot_url": a.get("headshot", {}).get("href", ""),
            })

    print(f"  {len(starters)} starters identified")

    # 4. Headshots
    print("Downloading headshots (parallel)…")

    def download_headshot(p: dict) -> tuple[str, str | None]:
        slug = slugify(p["name"])
        out_path = HEADSHOT_DIR / f"{slug}.png"
        if out_path.exists():
            return p["name"], f"/headshots/cbb/{slug}.png"
        if not p["headshot_url"]:
            return p["name"], None
        img = fetch_bytes(p["headshot_url"])
        if img and len(img) > 500:
            out_path.write_bytes(img)
            return p["name"], f"/headshots/cbb/{slug}.png"
        return p["name"], None

    headshot_map: dict[str, str] = {}
    done_hs = 0

    with ThreadPoolExecutor(max_workers=30) as ex:
        hs_futures = [ex.submit(download_headshot, p) for p in starters]
        for fut in as_completed(hs_futures):
            done_hs += 1
            name, path = fut.result()
            if path:
                headshot_map[name] = path
            if done_hs % 200 == 0:
                print(f"  {done_hs}/{len(starters)} headshots done")

    print(f"  {len(headshot_map)}/{len(starters)} headshots downloaded")

    # 5. Write cbbPlayers.ts
    print("Writing src/lib/cbbPlayers.ts…")
    sorted_starters = sorted(starters, key=lambda p: (-p["rating"], p["name"]))

    # Deduplicate by name (keep highest-rated entry)
    seen_names: set[str] = set()
    deduped: list[dict] = []
    for p in sorted_starters:
        if p["name"] not in seen_names:
            seen_names.add(p["name"])
            deduped.append(p)

    lines = [
        "// @ts-nocheck — auto-generated large dataset, skip type checking",
        "// Auto-generated by scripts/fetch-cbb-data.py — do not edit manually.",
        'import type { NBAPlayer } from "./players";',
        "",
        "export type CBBPlayer = NBAPlayer;",
        "",
        "export const CBB_PLAYERS: CBBPlayer[] = [",
    ]
    for p in deduped:
        lines.append(
            f'  {{ name: {json.dumps(p["name"])}, team: {json.dumps(p["team"])}, '
            f'position: "{p["position"]}", ppg: {p["ppg"]}, rpg: {p["rpg"]}, '
            f'apg: {p["apg"]}, fg_pct: {p["fg_pct"]}, rating: {p["rating"]}, '
            f'tier: "{p["tier"]}" }},'
        )
    lines.append("];")
    lines.append("")
    PLAYERS_OUT.write_text("\n".join(lines))

    # 6. Write cbbEspnHeadshots.ts
    print("Writing src/lib/cbbEspnHeadshots.ts…")
    hs_lines = [
        "// Auto-generated by scripts/fetch-cbb-data.py — do not edit manually.",
        "export const CBB_ESPN_HEADSHOTS: Record<string, string> = {",
    ]
    for name, path in sorted(headshot_map.items()):
        hs_lines.append(f"  {json.dumps(name)}: {json.dumps(path)},")
    hs_lines.append("};")
    hs_lines.append("")
    HEADSHOTS_OUT.write_text("\n".join(hs_lines))

    print(f"\n✓ Done!")
    print(f"  {len(deduped)} players → cbbPlayers.ts")
    print(f"  {len(headshot_map)} headshots → cbbEspnHeadshots.ts + public/headshots/cbb/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
