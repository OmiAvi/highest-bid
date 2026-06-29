export const POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;
export type Position = (typeof POSITIONS)[number];

export interface NBAPlayer {
  name: string;
  team: string;
  position: Position;
  eligiblePositions?: Position[];
  ppg: number;
  rpg: number;
  apg: number;
  fg_pct: number;
  rating: number;
  tier: "superstar" | "allstar" | "starter" | "role";
}

export const NBA_PLAYERS: NBAPlayer[] = [
  // ── Point Guards ──────────────────────────────────────────────────────────
  { name: "Stephen Curry",           team: "GSW", position: "PG", ppg: 26.4, rpg: 4.5, apg: 5.1,  fg_pct: 45.0, rating: 96, tier: "superstar" },
  { name: "Luka Dončić",             team: "DAL", position: "PG", ppg: 33.9, rpg: 9.2, apg: 9.8,  fg_pct: 47.7, rating: 97, tier: "superstar" },
  { name: "Shai Gilgeous-Alexander", team: "OKC", position: "PG", ppg: 30.1, rpg: 5.5, apg: 6.2,  fg_pct: 53.5, rating: 95, tier: "superstar" },
  { name: "Ja Morant",               team: "MEM", position: "PG", ppg: 25.1, rpg: 5.6, apg: 8.1,  fg_pct: 46.6, rating: 91, tier: "superstar" },
  { name: "Jalen Brunson",           team: "NYK", position: "PG", ppg: 28.7, rpg: 3.6, apg: 6.7,  fg_pct: 47.9, rating: 90, tier: "allstar" },
  { name: "LaMelo Ball",             team: "CHA", position: "PG", ppg: 23.9, rpg: 5.8, apg: 8.0,  fg_pct: 43.5, rating: 90, tier: "allstar" },
  { name: "Tyrese Maxey",            team: "PHI", position: "PG", ppg: 25.9, rpg: 3.7, apg: 6.2,  fg_pct: 47.3, rating: 90, tier: "allstar" },
  { name: "Tyrese Haliburton",       team: "IND", position: "PG", ppg: 20.1, rpg: 3.9, apg: 10.9, fg_pct: 47.0, rating: 88, tier: "allstar" },
  { name: "Damian Lillard",          team: "MIL", position: "PG", ppg: 24.3, rpg: 4.4, apg: 7.0,  fg_pct: 43.0, rating: 89, tier: "allstar" },
  { name: "Trae Young",              team: "ATL", position: "PG", ppg: 25.7, rpg: 2.8, apg: 10.8, fg_pct: 43.1, rating: 87, tier: "allstar" },
  { name: "Cade Cunningham",         team: "DET", position: "PG", ppg: 24.4, rpg: 4.4, apg: 9.1,  fg_pct: 44.6, rating: 89, tier: "allstar" },
  { name: "De'Aaron Fox",            team: "SAC", position: "PG", ppg: 25.2, rpg: 3.8, apg: 5.9,  fg_pct: 48.4, rating: 86, tier: "allstar" },
  { name: "James Harden",            team: "LAC", position: "PG", ppg: 20.4, rpg: 5.7, apg: 8.4,  fg_pct: 41.0, rating: 85, tier: "allstar" },
  { name: "Immanuel Quickley",       team: "TOR", position: "PG", ppg: 18.6, rpg: 3.7, apg: 6.8,  fg_pct: 44.8, rating: 82, tier: "starter" },
  { name: "Fred VanVleet",           team: "HOU", position: "PG", ppg: 17.4, rpg: 3.7, apg: 6.1,  fg_pct: 40.1, rating: 79, tier: "starter" },
  { name: "Darryn Peterson",         team: "Rookie", position: "PG", ppg: 18.9, rpg: 4.6, apg: 6.7, fg_pct: 45.4, rating: 84, tier: "starter" },
  { name: "Kingston Flemings",       team: "Rookie", position: "PG", ppg: 15.8, rpg: 4.2, apg: 5.8, fg_pct: 44.6, rating: 80, tier: "starter" },

  // ── Shooting Guards ───────────────────────────────────────────────────────
  { name: "Devin Booker",            team: "PHX", position: "SG", ppg: 27.1, rpg: 4.5, apg: 6.9,  fg_pct: 49.6, rating: 92, tier: "superstar" },
  { name: "Anthony Edwards",         team: "MIN", position: "SG", ppg: 25.9, rpg: 5.4, apg: 5.1,  fg_pct: 46.1, rating: 90, tier: "allstar" },
  { name: "Donovan Mitchell",        team: "CLE", position: "SG", ppg: 26.6, rpg: 5.1, apg: 6.1,  fg_pct: 46.4, rating: 89, tier: "allstar" },
  { name: "Jaylen Brown",            team: "BOS", position: "SG", ppg: 23.0, rpg: 5.5, apg: 3.6,  fg_pct: 49.4, rating: 87, tier: "allstar" },
  { name: "Jalen Williams",          team: "OKC", position: "SG", eligiblePositions: ["SG", "SF"], ppg: 23.3, rpg: 4.5, apg: 5.5, fg_pct: 49.5, rating: 87, tier: "allstar" },
  { name: "DeMar DeRozan",           team: "CHI", position: "SG", ppg: 24.5, rpg: 4.2, apg: 5.1,  fg_pct: 51.4, rating: 86, tier: "allstar" },
  { name: "Anfernee Simons",         team: "POR", position: "SG", ppg: 23.6, rpg: 3.2, apg: 4.5,  fg_pct: 44.9, rating: 84, tier: "starter" },
  { name: "Desmond Bane",            team: "MEM", position: "SG", ppg: 21.5, rpg: 4.3, apg: 4.4,  fg_pct: 44.1, rating: 83, tier: "starter" },
  { name: "Zach LaVine",             team: "CHI", position: "SG", ppg: 19.5, rpg: 4.5, apg: 3.9,  fg_pct: 47.2, rating: 84, tier: "starter" },
  { name: "Bradley Beal",            team: "PHX", position: "SG", ppg: 18.2, rpg: 3.6, apg: 4.5,  fg_pct: 47.3, rating: 82, tier: "starter" },
  { name: "Tyler Herro",             team: "MIA", position: "SG", ppg: 20.8, rpg: 4.3, apg: 4.5,  fg_pct: 43.9, rating: 81, tier: "starter" },
  { name: "CJ McCollum",             team: "NOP", position: "SG", ppg: 18.7, rpg: 4.1, apg: 4.4,  fg_pct: 45.5, rating: 80, tier: "starter" },
  { name: "Klay Thompson",           team: "DAL", position: "SG", ppg: 17.1, rpg: 3.3, apg: 2.3,  fg_pct: 43.2, rating: 79, tier: "starter" },
  { name: "Jordan Poole",            team: "WAS", position: "SG", ppg: 17.3, rpg: 3.1, apg: 4.8,  fg_pct: 41.2, rating: 78, tier: "starter" },
  { name: "Ebuka Okorie",            team: "Rookie", position: "SG", ppg: 16.7, rpg: 3.8, apg: 4.1, fg_pct: 44.9, rating: 80, tier: "starter" },
  { name: "Meleek Thomas",           team: "Rookie", position: "SG", ppg: 15.1, rpg: 3.6, apg: 3.9, fg_pct: 43.8, rating: 78, tier: "starter" },

  // ── Small Forwards ────────────────────────────────────────────────────────
  { name: "LeBron James",            team: "LAL", position: "SF", eligiblePositions: ["PG","SG","SF","PF","C"], ppg: 25.7, rpg: 7.3, apg: 8.3, fg_pct: 54.0, rating: 98, tier: "superstar" },
  { name: "Kevin Durant",            team: "PHX", position: "SF", eligiblePositions: ["SF","PF"], ppg: 27.1, rpg: 6.6, apg: 5.0, fg_pct: 52.6, rating: 96, tier: "superstar" },
  { name: "Jayson Tatum",            team: "BOS", position: "SF", ppg: 26.9, rpg: 8.1, apg: 4.9,  fg_pct: 46.6, rating: 93, tier: "superstar" },
  { name: "Kawhi Leonard",           team: "LAC", position: "SF", ppg: 23.7, rpg: 6.1, apg: 3.6,  fg_pct: 52.6, rating: 91, tier: "superstar" },
  { name: "Jimmy Butler",            team: "MIA", position: "SF", ppg: 20.8, rpg: 5.3, apg: 5.0,  fg_pct: 49.9, rating: 88, tier: "allstar" },
  { name: "Franz Wagner",            team: "ORL", position: "SF", ppg: 22.6, rpg: 5.8, apg: 3.6,  fg_pct: 49.0, rating: 86, tier: "allstar" },
  { name: "Paolo Banchero",          team: "ORL", position: "SF", eligiblePositions: ["SF","PF"], ppg: 22.6, rpg: 6.9, apg: 5.4, fg_pct: 45.8, rating: 87, tier: "allstar" },
  { name: "Paul George",             team: "PHI", position: "SF", eligiblePositions: ["SG","SF","PF"], ppg: 22.6, rpg: 5.2, apg: 3.5, fg_pct: 44.6, rating: 86, tier: "allstar" },
  { name: "Scottie Barnes",          team: "TOR", position: "SF", eligiblePositions: ["PG","SF","PF"], ppg: 19.9, rpg: 8.2, apg: 6.1, fg_pct: 50.5, rating: 84, tier: "starter" },
  { name: "Brandon Ingram",          team: "NOP", position: "SF", ppg: 20.8, rpg: 5.1, apg: 5.7,  fg_pct: 46.3, rating: 84, tier: "starter" },
  { name: "Mikal Bridges",           team: "NYK", position: "SF", ppg: 19.6, rpg: 4.5, apg: 3.7,  fg_pct: 45.0, rating: 82, tier: "starter" },
  { name: "RJ Barrett",              team: "TOR", position: "SF", ppg: 21.8, rpg: 5.3, apg: 3.4,  fg_pct: 46.4, rating: 82, tier: "starter" },
  { name: "Andrew Wiggins",          team: "GSW", position: "SF", ppg: 17.1, rpg: 4.8, apg: 2.4,  fg_pct: 48.3, rating: 79, tier: "starter" },
  { name: "OG Anunoby",              team: "NYK", position: "SF", ppg: 14.7, rpg: 4.4, apg: 1.5,  fg_pct: 47.9, rating: 80, tier: "starter" },
  { name: "AJ Dybantsa",             team: "Rookie", position: "SF", ppg: 19.8, rpg: 6.4, apg: 3.8, fg_pct: 46.2, rating: 85, tier: "allstar" },
  { name: "Allen Graves",            team: "Rookie", position: "SF", ppg: 14.6, rpg: 5.9, apg: 2.9, fg_pct: 45.1, rating: 78, tier: "starter" },

  // ── Power Forwards ────────────────────────────────────────────────────────
  { name: "Giannis Antetokounmpo",   team: "MIL", position: "PF", eligiblePositions: ["SF","PF","C"], ppg: 30.4, rpg: 11.5, apg: 6.5, fg_pct: 61.1, rating: 98, tier: "superstar" },
  { name: "Victor Wembanyama",       team: "SAS", position: "PF", eligiblePositions: ["PF","C"], ppg: 21.4, rpg: 10.6, apg: 3.9, fg_pct: 49.6, rating: 93, tier: "superstar" },
  { name: "Zion Williamson",         team: "NOP", position: "PF", ppg: 22.9, rpg: 5.8, apg: 4.6,  fg_pct: 57.8, rating: 89, tier: "allstar" },
  { name: "Pascal Siakam",           team: "IND", position: "PF", ppg: 21.3, rpg: 7.8, apg: 3.7,  fg_pct: 54.4, rating: 86, tier: "allstar" },
  { name: "Alperen Sengun",          team: "HOU", position: "PF", eligiblePositions: ["PF","C"], ppg: 21.1, rpg: 9.2, apg: 5.9, fg_pct: 55.4, rating: 85, tier: "allstar" },
  { name: "Julius Randle",           team: "MIN", position: "PF", ppg: 24.0, rpg: 9.0, apg: 5.0,  fg_pct: 46.2, rating: 85, tier: "allstar" },
  { name: "Jaren Jackson Jr.",       team: "MEM", position: "PF", eligiblePositions: ["PF","C"], ppg: 22.2, rpg: 6.5, apg: 2.0, fg_pct: 46.7, rating: 85, tier: "allstar" },
  { name: "Lauri Markkanen",         team: "UTA", position: "PF", ppg: 21.7, rpg: 8.0, apg: 2.0,  fg_pct: 47.7, rating: 83, tier: "starter" },
  { name: "Aaron Gordon",            team: "DEN", position: "PF", ppg: 13.9, rpg: 6.5, apg: 3.6,  fg_pct: 56.0, rating: 79, tier: "starter" },
  { name: "Jonathan Kuminga",        team: "GSW", position: "PF", ppg: 16.1, rpg: 4.8, apg: 2.3,  fg_pct: 53.9, rating: 79, tier: "starter" },
  { name: "Keegan Murray",           team: "SAC", position: "PF", ppg: 15.9, rpg: 5.2, apg: 1.6,  fg_pct: 47.2, rating: 77, tier: "starter" },
  { name: "Jabari Smith Jr.",        team: "HOU", position: "PF", ppg: 16.4, rpg: 8.0, apg: 2.0,  fg_pct: 43.9, rating: 77, tier: "starter" },
  { name: "Josh Hart",               team: "NYK", position: "PF", ppg: 11.7, rpg: 10.5, apg: 5.1, fg_pct: 48.5, rating: 77, tier: "role" },
  { name: "Tobias Harris",           team: "DET", position: "PF", ppg: 15.6, rpg: 6.5, apg: 2.8,  fg_pct: 48.4, rating: 77, tier: "role" },
  { name: "Cameron Boozer",          team: "Rookie", position: "PF", ppg: 20.6, rpg: 8.9, apg: 4.0, fg_pct: 51.3, rating: 86, tier: "allstar" },
  { name: "Caleb Wilson",            team: "Rookie", position: "PF", ppg: 16.2, rpg: 7.8, apg: 2.8, fg_pct: 49.4, rating: 80, tier: "starter" },

  // ── Centers ───────────────────────────────────────────────────────────────
  { name: "Nikola Jokić",            team: "DEN", position: "C", eligiblePositions: ["PF","C"], ppg: 26.4, rpg: 12.4, apg: 9.0, fg_pct: 58.3, rating: 99, tier: "superstar" },
  { name: "Joel Embiid",             team: "PHI", position: "C", ppg: 34.7, rpg: 11.0, apg: 5.6,  fg_pct: 52.8, rating: 97, tier: "superstar" },
  { name: "Anthony Davis",           team: "LAL", position: "C", eligiblePositions: ["PF","C"], ppg: 24.7, rpg: 12.6, apg: 3.5, fg_pct: 55.4, rating: 94, tier: "superstar" },
  { name: "Bam Adebayo",             team: "MIA", position: "C", eligiblePositions: ["PF","C"], ppg: 19.3, rpg: 10.4, apg: 3.3, fg_pct: 53.3, rating: 87, tier: "allstar" },
  { name: "Karl-Anthony Towns",      team: "NYK", position: "C", ppg: 21.4, rpg: 8.3, apg: 3.0,  fg_pct: 47.3, rating: 87, tier: "allstar" },
  { name: "Domantas Sabonis",        team: "SAC", position: "C", eligiblePositions: ["PF","C"], ppg: 19.9, rpg: 13.6, apg: 8.2, fg_pct: 60.3, rating: 87, tier: "allstar" },
  { name: "Chet Holmgren",           team: "OKC", position: "C", eligiblePositions: ["PF","C"], ppg: 16.5, rpg: 7.9, apg: 2.7, fg_pct: 50.1, rating: 83, tier: "allstar" },
  { name: "Evan Mobley",             team: "CLE", position: "C", ppg: 15.7, rpg: 9.4, apg: 2.9,  fg_pct: 55.5, rating: 84, tier: "starter" },
  { name: "Deandre Ayton",           team: "POR", position: "C", ppg: 18.0, rpg: 10.0, apg: 1.6,  fg_pct: 60.3, rating: 82, tier: "starter" },
  { name: "Rudy Gobert",             team: "MIN", position: "C", ppg: 14.0, rpg: 12.9, apg: 1.3,  fg_pct: 66.0, rating: 82, tier: "starter" },
  { name: "Myles Turner",            team: "IND", position: "C", ppg: 13.9, rpg: 6.6, apg: 1.7,  fg_pct: 53.0, rating: 79, tier: "starter" },
  { name: "Brook Lopez",             team: "MIL", position: "C", ppg: 14.7, rpg: 5.4, apg: 1.8,  fg_pct: 50.1, rating: 77, tier: "starter" },
  { name: "Jonas Valanciunas",       team: "NOP", position: "C", ppg: 14.2, rpg: 11.0, apg: 2.0,  fg_pct: 57.1, rating: 78, tier: "starter" },
  { name: "Clint Capela",            team: "ATL", position: "C", ppg: 11.2, rpg: 10.8, apg: 1.1,  fg_pct: 62.0, rating: 76, tier: "role" },
  { name: "Aday Mara",               team: "Rookie", position: "C", ppg: 15.4, rpg: 9.3, apg: 2.7, fg_pct: 56.1, rating: 81, tier: "starter" },
  { name: "Hannes Steinbach",        team: "Rookie", position: "C", ppg: 13.8, rpg: 9.8, apg: 2.1, fg_pct: 54.8, rating: 79, tier: "starter" },
];

export const POSITION_LABELS: Record<Position, string> = {
  PG: "Point Guard",
  SG: "Shooting Guard",
  SF: "Small Forward",
  PF: "Power Forward",
  C:  "Center",
};

export const POSITION_COLORS: Record<Position, string> = {
  PG: "#FF2D78",
  SG: "#BF5FFF",
  SF: "#00E5FF",
  PF: "#FFB800",
  C:  "#64FFDA",
};

export const TIER_COLORS: Record<NBAPlayer["tier"], string> = {
  superstar: "#F59E0B",
  allstar:   "#60A5FA",
  starter:   "#A78BFA",
  role:      "#64748B",
};

export function pickRandomPlayer(exclude: string[] = []): NBAPlayer {
  const pool = NBA_PLAYERS.filter((p) => !exclude.includes(p.name));
  if (!pool.length) return NBA_PLAYERS[Math.floor(Math.random() * NBA_PLAYERS.length)];
  return pool[Math.floor(Math.random() * pool.length)];
}
