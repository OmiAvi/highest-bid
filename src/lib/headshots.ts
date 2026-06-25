import type { Position } from "./players";

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h << 5) - h + value.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
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
  PG: ["#5E6AD2", "#8AA0FF"],
  SG: ["#8B5CF6", "#B898FF"],
  SF: ["#10B981", "#5BE3B0"],
  PF: ["#D97706", "#F2A44B"],
  C: ["#64748B", "#9AA8BC"],
};

export function getPlayerHeadshot(name: string, position: Position): string {
  const seed = hash(`${name}-${position}`);
  const [primary, secondary] = POSITION_TONES[position];
  const skin = ["#F5C7A9", "#D9A07B", "#B97850", "#8B5A3C"][seed % 4];
  const hair = ["#191919", "#3A2A21", "#5D4635", "#7A5C46"][Math.floor(seed / 7) % 4];
  const jersey = primary;
  const accent = secondary;
  const faceX = 72 + (seed % 10) - 5;
  const hairArc = 48 + (seed % 12);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${primary}" />
          <stop offset="100%" stop-color="${accent}" />
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="28" fill="url(#bg)" />
      <circle cx="80" cy="58" r="${hairArc}" fill="rgba(0,0,0,0.10)" />
      <ellipse cx="80" cy="155" rx="78" ry="50" fill="rgba(7,8,10,0.28)" />
      <path d="M30 160c8-34 28-50 50-50s42 16 50 50Z" fill="${jersey}" />
      <path d="M54 160c4-22 17-34 26-34s22 12 26 34Z" fill="#F0F2F5" opacity="0.18" />
      <ellipse cx="${faceX}" cy="62" rx="28" ry="31" fill="${skin}" />
      <path d="M45 54c4-18 17-28 35-28 15 0 24 7 31 20-9-5-16-7-26-7-13 0-24 4-40 15Z" fill="${hair}" />
      <circle cx="69" cy="62" r="3" fill="#1B1B1B" />
      <circle cx="91" cy="62" r="3" fill="#1B1B1B" />
      <path d="M72 78c5 4 11 4 16 0" stroke="#7A3D2A" stroke-width="3" stroke-linecap="round" fill="none" />
      <rect x="14" y="14" width="40" height="24" rx="12" fill="rgba(7,8,10,0.32)" />
      <text x="34" y="31" fill="#F0F2F5" font-size="12" font-weight="700" text-anchor="middle" font-family="Inter, Arial, sans-serif">${initials(name)}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
