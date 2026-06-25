import type { GameState, RosterSlot, SeriesResult } from "./game";
import { effectiveRating, teamScore, teamTotals } from "./game";

const WIDTH = 1200;
const HEIGHT = 1500;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function trimLabel(value: string, max = 20): string {
  return value.length > max ? `${value.slice(0, max - 1)}...` : value;
}

function slotLine(slot: RosterSlot): string {
  if (!slot.playerName || !slot.stats || !slot.sourcePosition) {
    return `${slot.position}: Empty`;
  }

  const penalty = slot.penalty > 0 ? ` (-${slot.penalty})` : "";
  return `${slot.position}: ${slot.playerName} ${effectiveRating(slot)} | ${slot.sourcePosition}${penalty}`;
}

function rosterMarkup(slots: RosterSlot[], x: number, y: number, color: string) {
  return slots.map((slot, index) => `
    <text x="${x}" y="${y + index * 40}" fill="#F0F2F5" font-size="24" font-weight="600">
      ${escapeXml(slotLine(slot))}
    </text>
    <text x="${x + 420}" y="${y + index * 40}" fill="${color}" font-size="24" font-weight="700" text-anchor="end">
      ${slot.stats ? effectiveRating(slot) : "-"}
    </text>
  `).join("");
}

function seriesMarkup(series: SeriesResult, p1Name: string, p2Name: string) {
  return series.games.map((game, index) => `
    <text x="80" y="${946 + index * 38}" fill="#8892A4" font-size="22">Game ${game.game}</text>
    <text x="635" y="${946 + index * 38}" fill="#5E6AD2" font-size="22" font-weight="700" text-anchor="end">${game.p1Score}</text>
    <text x="805" y="${946 + index * 38}" fill="#10B981" font-size="22" font-weight="700" text-anchor="end">${game.p2Score}</text>
    <text x="1120" y="${946 + index * 38}" fill="${game.winner === 1 ? "#5E6AD2" : "#10B981"}" font-size="22" text-anchor="end">${escapeXml(trimLabel(game.winner === 1 ? p1Name : p2Name, 18))}</text>
  `).join("");
}

export async function createResultsShareImage(state: GameState, series: SeriesResult, siteUrl: string): Promise<File> {
  const winnerName = series.winner === 1 ? state.p1Name : series.winner === 2 ? state.p2Name : "Series tied";
  const p1Totals = teamTotals(state.roster1);
  const p2Totals = teamTotals(state.roster2);
  const p1Score = teamScore(state.roster1);
  const p2Score = teamScore(state.roster2);

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#07080A" />
        <stop offset="100%" stop-color="#111723" />
      </linearGradient>
      <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#16181E" />
        <stop offset="100%" stop-color="#1B2230" />
      </linearGradient>
    </defs>

    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)" />
    <circle cx="220" cy="180" r="220" fill="rgba(94,106,210,0.12)" />
    <circle cx="980" cy="260" r="240" fill="rgba(16,185,129,0.10)" />

    <rect x="50" y="50" width="1100" height="1320" rx="36" fill="url(#panel)" stroke="rgba(255,255,255,0.08)" />
    <text x="80" y="118" fill="#F0F2F5" font-size="32" font-weight="700">Highest Bid</text>
    <text x="80" y="160" fill="#8892A4" font-size="22">NBA auction results</text>
    <text x="1120" y="118" fill="#8892A4" font-size="22" text-anchor="end">Game #${escapeXml(state.gameId)}</text>

    <text x="80" y="248" fill="#F0F2F5" font-size="58" font-weight="800">${escapeXml(trimLabel(winnerName, 24))}</text>
    <text x="80" y="298" fill="#8892A4" font-size="28">${series.winner ? "wins the best-of-7 series" : "battle ends in a draw"}</text>

    <rect x="80" y="346" width="470" height="170" rx="24" fill="rgba(94,106,210,0.08)" stroke="rgba(94,106,210,0.26)" />
    <rect x="650" y="346" width="470" height="170" rx="24" fill="rgba(16,185,129,0.08)" stroke="rgba(16,185,129,0.26)" />

    <text x="110" y="398" fill="#8892A4" font-size="20">PLAYER 1</text>
    <text x="110" y="438" fill="#F0F2F5" font-size="34" font-weight="700">${escapeXml(trimLabel(state.p1Name))}</text>
    <text x="110" y="488" fill="#5E6AD2" font-size="68" font-weight="800">${series.p1Wins}</text>
    <text x="242" y="488" fill="#8892A4" font-size="24">wins</text>
    <text x="500" y="408" fill="#5E6AD2" font-size="58" font-weight="800" text-anchor="end">${p1Score}</text>
    <text x="500" y="438" fill="#8892A4" font-size="20" text-anchor="end">effective OVR</text>
    <text x="500" y="488" fill="#8892A4" font-size="18" text-anchor="end">PPG ${p1Totals.ppg.toFixed(1)} | RPG ${p1Totals.rpg.toFixed(1)} | APG ${p1Totals.apg.toFixed(1)}</text>
    <text x="500" y="516" fill="#8892A4" font-size="18" text-anchor="end">Penalty ${p1Totals.penalty}</text>

    <text x="680" y="398" fill="#8892A4" font-size="20">PLAYER 2</text>
    <text x="680" y="438" fill="#F0F2F5" font-size="34" font-weight="700">${escapeXml(trimLabel(state.p2Name))}</text>
    <text x="680" y="488" fill="#10B981" font-size="68" font-weight="800">${series.p2Wins}</text>
    <text x="812" y="488" fill="#8892A4" font-size="24">wins</text>
    <text x="1070" y="408" fill="#10B981" font-size="58" font-weight="800" text-anchor="end">${p2Score}</text>
    <text x="1070" y="438" fill="#8892A4" font-size="20" text-anchor="end">effective OVR</text>
    <text x="1070" y="488" fill="#8892A4" font-size="18" text-anchor="end">PPG ${p2Totals.ppg.toFixed(1)} | RPG ${p2Totals.rpg.toFixed(1)} | APG ${p2Totals.apg.toFixed(1)}</text>
    <text x="1070" y="516" fill="#8892A4" font-size="18" text-anchor="end">Penalty ${p2Totals.penalty}</text>

    <text x="80" y="590" fill="#8892A4" font-size="20">LINEUPS</text>
    <text x="80" y="634" fill="#5E6AD2" font-size="26" font-weight="700">${escapeXml(trimLabel(state.p1Name, 18))}</text>
    <text x="640" y="634" fill="#10B981" font-size="26" font-weight="700">${escapeXml(trimLabel(state.p2Name, 18))}</text>
    ${rosterMarkup(state.roster1, 80, 684, "#5E6AD2")}
    ${rosterMarkup(state.roster2, 640, 684, "#10B981")}

    <text x="80" y="880" fill="#8892A4" font-size="20">SERIES SCORES</text>
    <text x="635" y="910" fill="#5E6AD2" font-size="20" text-anchor="end">${escapeXml(trimLabel(state.p1Name, 16))}</text>
    <text x="805" y="910" fill="#10B981" font-size="20" text-anchor="end">${escapeXml(trimLabel(state.p2Name, 16))}</text>
    ${seriesMarkup(series, state.p1Name, state.p2Name)}

    <rect x="80" y="1210" width="1040" height="100" rx="20" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" />
    <text x="110" y="1260" fill="#F0F2F5" font-size="24" font-weight="700">Play your own draft at</text>
    <text x="110" y="1296" fill="#8892A4" font-size="24">${escapeXml(siteUrl)}</text>
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
