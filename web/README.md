# 🔨 Highest Bid — NBA Draft Auction Game

A 2-player sealed-bid NBA draft game. Each player gets $20 to build the best starting 5.

## Tech Stack

- **Framework**: TanStack Start (React) — client routes + server (API) routes in one app
- **Backend**: TanStack Start server routes under `src/routes/api/*` (no separate Worker)
- **Database**: Cloudflare D1 (SQLite at the edge)
- **Build / Deploy**: Vite + `@cloudflare/vite-plugin`, deployed as a single Cloudflare Worker

---

## Game Rules

1. A random NBA starter is revealed each round
2. Both players privately enter a bid from their $20 budget
3. Each player locks their bid — then both are revealed at the same time
4. **Highest bid wins** the player for their PG / SG / SF / PF / C slot
5. Ties = no winner, the player is skipped
6. Win a player for a position you've already filled? That player is lost!
7. Auction continues until both starting 5s are complete
8. Compare rosters by average OVR rating — highest wins

---

## Local Development

```bash
# Install deps
npm install

# Set up the local D1 database (first run only)
npm run db:migrate:local

# Run the app — client + API on a single dev server
npm run dev
# → http://localhost:5173
```

`vite dev` runs both the React client and the `/api/*` server routes in the local
Cloudflare runtime, with the D1 binding wired up automatically — no second process.
Local-only games still work without D1 (state is kept in `localStorage`); the API
adds cloud persistence so games can be resumed or shared.

---

## Cloudflare Deployment

### 1. Create the D1 database

```bash
npm run db:create
# Copy the database_id from output into wrangler.jsonc
```

### 2. Run the migration against production D1

```bash
npm run db:migrate:remote
```

### 3. Build and deploy

```bash
npm run deploy   # vite build && wrangler deploy
```

This builds the client + server and deploys a single Worker (API + static assets)
to `https://highest-bid.<your-subdomain>.workers.dev`.

> The mobile app talks to this API cross-origin via `EXPO_PUBLIC_API_BASE`
> (`https://<host>/api`); CORS is handled in `src/lib/server.ts`.

---

## Project Structure

```
highest-bid/
├── src/
│   ├── lib/
│   │   ├── players.ts      # NBA/CBB player pools with stats
│   │   ├── game.ts         # Game state machine (pure, shared client + server)
│   │   ├── api.ts          # Client-side API/localStorage wrapper
│   │   └── server.ts       # Server-only helpers (D1, CORS, JSON)
│   ├── components/         # PlayerCard, RosterPanel, etc.
│   ├── pages/              # LobbyPage / GamePage / ResultsPage (rendered by routes)
│   ├── routes/
│   │   ├── __root.tsx      # Document shell (head, fonts, analytics)
│   │   ├── index.tsx       # /            → Lobby
│   │   ├── game.$gameId.tsx
│   │   ├── results.$gameId.tsx
│   │   └── api/            # Server (API) routes — the old Worker, file-based
│   │       ├── games.ts            # POST /api/games
│   │       ├── games.join.ts       # POST /api/games/join
│   │       └── games.$gameId.*.ts  # GET poll, raise, pass, advance, assign-slot
│   ├── router.tsx          # Router factory (getRouter)
│   └── index.css           # Global styles / tokens
├── migrations/             # D1 schema
├── wrangler.jsonc          # Cloudflare config (D1 binding)
└── vite.config.ts          # Vite + TanStack Start + Cloudflare plugins
```

---

## API

All endpoints live under `src/routes/api/` as TanStack Start server routes and are
backed by Cloudflare D1. CORS is enabled for the mobile client.

| Method | Path                          | Description                          |
|--------|-------------------------------|--------------------------------------|
| POST   | `/api/games`                  | Create a game (Player 1)             |
| POST   | `/api/games/join`             | Join a game (Player 2)               |
| GET    | `/api/games/:id`              | Poll game state                      |
| POST   | `/api/games/:id/raise`        | Raise the current bid                |
| POST   | `/api/games/:id/pass`         | Pass                                 |
| POST   | `/api/games/:id/assign-slot`  | Winner chooses a lineup slot         |
| POST   | `/api/games/:id/advance`      | Advance to the next round            |
