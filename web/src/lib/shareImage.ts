import type { GameState, RosterSlot, SeriesResult } from "./game";
import { effectiveRating, teamScore, teamTotals } from "./game";

const WIDTH = 1080;
const HEIGHT = 1920;

const PINK = "#FF2D78";
const CYAN = "#00E5FF";
const BG   = "#06050F";
const SURF = "#130F1E";
const MID  = "#0C0818";
const DIM  = "#8892A4";
const WHITE = "#F0F2F5";

function esc(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function trim(v: string, max = 18): string {
  return v.length > max ? `${v.slice(0, max - 1)}…` : v;
}

function rosterRows(slots: RosterSlot[], x: number, y: number, color: string): string {
  const posColors: Record<string, string> = {
    PG: PINK, SG: "#BF5FFF", SF: CYAN, PF: "#FFB800", C: "#64FFDA",
  };
  return slots.map((slot, i) => {
    const py = y + i * 66;
    const pc = posColors[slot.position] ?? DIM;
    const name = slot.playerName ? trim(slot.playerName, 20) : "Empty";
    const ovr = slot.stats ? String(effectiveRating(slot)) : "—";
    const sub = slot.playerName && slot.sourcePosition
      ? `${slot.playerTeam} · $${slot.cost ?? 0}${slot.penalty ? ` −${slot.penalty}` : ""}`
      : slot.position;
    return `
      <rect x="${x}" y="${py}" width="430" height="56" rx="8" fill="${MID}" opacity="0.6"/>
      <text x="${x + 14}" y="${py + 21}" fill="${pc}" font-size="13" font-weight="700" font-family="Arial,sans-serif" letter-spacing="1">${slot.position}</text>
      <text x="${x + 46}" y="${py + 21}" fill="${WHITE}" font-size="17" font-weight="700" font-family="Arial Black,Arial,sans-serif">${esc(name)}</text>
      <text x="${x + 46}" y="${py + 43}" fill="${DIM}" font-size="13" font-family="Arial,sans-serif">${esc(sub)}</text>
      <text x="${x + 416}" y="${py + 25}" fill="${color}" font-size="20" font-weight="800" font-family="Arial Black,Arial,sans-serif" text-anchor="end">${ovr}</text>
    `;
  }).join("");
}

function gameRows(series: SeriesResult, p1Name: string, p2Name: string): string {
  return series.games.map((g, i) => {
    const py = 1350 + i * 64;
    const wc = g.winner === 1 ? PINK : CYAN;
    return `
      <rect x="50" y="${py}" width="980" height="54" rx="8" fill="${i % 2 === 0 ? MID : "transparent"}" opacity="0.5"/>
      <text x="80" y="${py + 34}" fill="${DIM}" font-size="18" font-family="Arial,sans-serif">Game ${g.game}</text>
      <text x="470" y="${py + 34}" fill="${PINK}" font-size="22" font-weight="800" font-family="Arial Black,Arial,sans-serif" text-anchor="end">${g.p1Score}</text>
      <text x="540" y="${py + 34}" fill="${CYAN}" font-size="22" font-weight="800" font-family="Arial Black,Arial,sans-serif">${g.p2Score}</text>
      <text x="1010" y="${py + 34}" fill="${wc}" font-size="17" font-family="Arial,sans-serif" text-anchor="end">${esc(trim(g.winner === 1 ? p1Name : p2Name, 14))}</text>
    `;
  }).join("");
}

export async function createResultsShareImage(state: GameState, series: SeriesResult, siteUrl: string): Promise<File> {
  const winnerName = series.winner === 1 ? state.p1Name : series.winner === 2 ? state.p2Name : null;
  const p1t = teamTotals(state.roster1);
  const p2t = teamTotals(state.roster2);
  const p1s = teamScore(state.roster1);
  const p2s = teamScore(state.roster2);
  const spent1 = 20 - state.p1Budget;
  const spent2 = 20 - state.p2Budget;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0D0A1A"/>
      <stop offset="50%" stop-color="${BG}"/>
      <stop offset="100%" stop-color="#08060F"/>
    </linearGradient>
    <radialGradient id="orbP" cx="15%" cy="12%" r="40%">
      <stop offset="0%" stop-color="${PINK}" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="${PINK}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="orbC" cx="85%" cy="10%" r="40%">
      <stop offset="0%" stop-color="${CYAN}" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="${CYAN}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#orbP)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#orbC)"/>

  <!-- Scanlines -->
  ${Array.from({ length: 60 }, (_, i) => `<rect x="0" y="${i * 32}" width="${WIDTH}" height="1" fill="rgba(0,0,0,0.12)"/>`).join("")}

  <!-- ── HEADER ── -->
  <text x="54" y="90" fill="${WHITE}" font-size="28" font-weight="700" font-family="Arial,sans-serif" letter-spacing="1">HIGHEST BID</text>
  <text x="54" y="124" fill="${DIM}" font-size="20" font-family="Arial,sans-serif">NBA Draft Auction · Game #${esc(state.gameId)}</text>
  <line x1="54" y1="148" x2="${WIDTH - 54}" y2="148" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>

  <!-- ── WINNER BANNER ── -->
  ${winnerName
    ? `<text x="54" y="230" fill="${winnerName === state.p1Name ? PINK : CYAN}" font-size="72" font-weight="800" font-family="Arial Black,Arial,sans-serif" letter-spacing="-2">${esc(trim(winnerName, 16))}</text>
       <text x="54" y="290" fill="${WHITE}" font-size="36" font-weight="700" font-family="Arial Black,Arial,sans-serif">WINS THE SERIES</text>`
    : `<text x="54" y="260" fill="${DIM}" font-size="52" font-weight="700" font-family="Arial Black,Arial,sans-serif">SERIES DRAWN</text>`
  }

  <!-- ── SCORE CARDS ── -->
  <!-- P1 card -->
  <rect x="50" y="330" width="440" height="220" rx="16" fill="${SURF}" stroke="${PINK}40" stroke-width="1"/>
  <rect x="50" y="330" width="440" height="3" rx="2" fill="${PINK}"/>
  <text x="72" y="372" fill="${DIM}" font-size="14" font-weight="600" font-family="Arial,sans-serif" letter-spacing="2">PLAYER 1</text>
  <text x="72" y="408" fill="${WHITE}" font-size="28" font-weight="700" font-family="Arial Black,Arial,sans-serif">${esc(trim(state.p1Name, 14))}</text>
  <text x="72" y="472" fill="${PINK}" font-size="80" font-weight="800" font-family="Arial Black,Arial,sans-serif" letter-spacing="-3">${p1s}</text>
  <text x="72" y="498" fill="${DIM}" font-size="14" font-weight="600" font-family="Arial,sans-serif" letter-spacing="2">EFFECTIVE OVR</text>
  <text x="72" y="530" fill="${DIM}" font-size="16" font-family="Arial,sans-serif">${p1t.ppg.toFixed(1)} PPG · ${p1t.rpg.toFixed(1)} RPG · ${p1t.apg.toFixed(1)} APG</text>
  <text x="72" y="554" fill="${DIM}" font-size="14" font-family="Arial,sans-serif">Spent $${spent1} · Penalty ${p1t.penalty}</text>

  <!-- Series score center -->
  <text x="540" y="450" fill="${PINK}" font-size="96" font-weight="800" font-family="Arial Black,Arial,sans-serif" text-anchor="middle">${series.p1Wins}</text>
  <rect x="510" y="462" width="60" height="4" rx="2" fill="${DIM}" opacity="0.4"/>
  <text x="540" y="530" fill="${CYAN}" font-size="96" font-weight="800" font-family="Arial Black,Arial,sans-serif" text-anchor="middle">${series.p2Wins}</text>
  <text x="540" y="570" fill="${DIM}" font-size="13" font-weight="600" font-family="Arial,sans-serif" text-anchor="middle" letter-spacing="2">BEST OF 7</text>

  <!-- P2 card -->
  <rect x="590" y="330" width="440" height="220" rx="16" fill="${SURF}" stroke="${CYAN}40" stroke-width="1"/>
  <rect x="590" y="330" width="440" height="3" rx="2" fill="${CYAN}"/>
  <text x="612" y="372" fill="${DIM}" font-size="14" font-weight="600" font-family="Arial,sans-serif" letter-spacing="2">PLAYER 2</text>
  <text x="612" y="408" fill="${WHITE}" font-size="28" font-weight="700" font-family="Arial Black,Arial,sans-serif">${esc(trim(state.p2Name, 14))}</text>
  <text x="612" y="472" fill="${CYAN}" font-size="80" font-weight="800" font-family="Arial Black,Arial,sans-serif" letter-spacing="-3">${p2s}</text>
  <text x="612" y="498" fill="${DIM}" font-size="14" font-weight="600" font-family="Arial,sans-serif" letter-spacing="2">EFFECTIVE OVR</text>
  <text x="612" y="530" fill="${DIM}" font-size="16" font-family="Arial,sans-serif">${p2t.ppg.toFixed(1)} PPG · ${p2t.rpg.toFixed(1)} RPG · ${p2t.apg.toFixed(1)} APG</text>
  <text x="612" y="554" fill="${DIM}" font-size="14" font-family="Arial,sans-serif">Spent $${spent2} · Penalty ${p2t.penalty}</text>

  <!-- ── LINEUPS ── -->
  <text x="54" y="618" fill="${DIM}" font-size="14" font-weight="600" font-family="Arial,sans-serif" letter-spacing="3">LINEUPS</text>
  <line x1="54" y1="630" x2="${WIDTH - 54}" y2="630" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>

  <!-- P1 roster header -->
  <text x="50" y="672" fill="${PINK}" font-size="20" font-weight="700" font-family="Arial Black,Arial,sans-serif">${esc(trim(state.p1Name, 16))}</text>
  ${rosterRows(state.roster1, 50, 682, PINK)}

  <!-- P2 roster header -->
  <text x="590" y="672" fill="${CYAN}" font-size="20" font-weight="700" font-family="Arial Black,Arial,sans-serif">${esc(trim(state.p2Name, 16))}</text>
  ${rosterRows(state.roster2, 590, 682, CYAN)}

  <!-- ── SERIES SCORES ── -->
  <text x="54" y="1310" fill="${DIM}" font-size="14" font-weight="600" font-family="Arial,sans-serif" letter-spacing="3">SERIES SIMULATION</text>
  <line x1="54" y1="1322" x2="${WIDTH - 54}" y2="1322" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>

  <!-- Series header -->
  <text x="80" y="1356" fill="${DIM}" font-size="14" font-weight="600" font-family="Arial,sans-serif" letter-spacing="2">GAME</text>
  <text x="470" y="1356" fill="${PINK}" font-size="14" font-weight="600" font-family="Arial,sans-serif" text-anchor="end">${esc(trim(state.p1Name, 10))}</text>
  <text x="540" y="1356" fill="${CYAN}" font-size="14" font-weight="600" font-family="Arial,sans-serif">${esc(trim(state.p2Name, 10))}</text>
  <text x="1010" y="1356" fill="${DIM}" font-size="14" font-weight="600" font-family="Arial,sans-serif" text-anchor="end">WINNER</text>
  ${gameRows(series, state.p1Name, state.p2Name)}

  <!-- ── FOOTER ── -->
  <line x1="54" y1="1860" x2="${WIDTH - 54}" y2="1860" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
  <text x="540" y="1898" fill="${DIM}" font-size="20" font-family="Arial,sans-serif" text-anchor="middle">${esc(siteUrl)}</text>
</svg>`;

  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const img = new Image();
    img.decoding = "async";
    const loaded = new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load share image"));
    });
    img.src = url;
    await loaded;

    const canvas = document.createElement("canvas");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.drawImage(img, 0, 0);

    const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!pngBlob) throw new Error("Failed to export share image");

    return new File([pngBlob], `highest-bid-${state.gameId}.png`, { type: "image/png" });
  } finally {
    URL.revokeObjectURL(url);
  }
}
