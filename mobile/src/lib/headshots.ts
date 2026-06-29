import type { Position } from "./players";
import { ESPN_HEADSHOTS } from "./espnHeadshots";
import { CBB_ESPN_HEADSHOTS } from "./cbbEspnHeadshots";
import { ASSET_BASE } from "./config";

/**
 * Resolves a player's headshot.
 *
 * Real headshots are ~2,000 PNGs served remotely by the Cloudflare Worker's
 * static assets (too large to bundle). `uri` is non-null only when a mapped
 * image exists AND a backend base URL is configured; otherwise the caller
 * renders the position-toned initials fallback. The `primary`/`secondary`
 * tones and `initials` are always provided so the fallback (and the remote
 * load-error fallback) can render.
 */
export interface HeadshotInfo {
  uri: string | null;
  primary: string;
  secondary: string;
  initials: string;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const POSITION_TONES: Record<Position, [string, string]> = {
  PG: ["#FF2D78", "#FF7AB5"],
  SG: ["#BF5FFF", "#D899FF"],
  SF: ["#00E5FF", "#7FF4FF"],
  PF: ["#FFB800", "#FFD566"],
  C: ["#64FFDA", "#A8FFF0"],
};

export function getPlayerHeadshot(name: string, position: Position): HeadshotInfo {
  const path = ESPN_HEADSHOTS[name] ?? CBB_ESPN_HEADSHOTS[name];
  const [primary, secondary] = POSITION_TONES[position];
  return {
    uri: path && ASSET_BASE ? `${ASSET_BASE}${path}` : null,
    primary,
    secondary,
    initials: initials(name),
  };
}
