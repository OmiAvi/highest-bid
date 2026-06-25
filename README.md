# 🔨 Highest Bid — NBA Draft Auction Game

A 2-player sealed-bid NBA draft game. Each player gets $20 to build the best starting 5.

## Tech Stack

- **Frontend**: React + TanStack Router (hash routing, SPA)
- **Backend**: Cloudflare Worker (REST API)
- **Database**: Cloudflare D1 (SQLite at the edge)
- **Build**: Vite

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

# Run the frontend dev server
npm run dev
# → http://localhost:5173

# Run the Cloudflare Worker locally (optional — game works without it)
npm run worker:dev
```

The game stores state in `sessionStorage`, so D1 is optional for local play.
The Worker adds cloud persistence so games can be resumed or shared.

---

## Cloudflare Deployment

### 1. Create the D1 database

```bash
npm run db:create
# Copy the database_id from output
```

### 2. Update wrangler.toml

Replace `YOUR_DATABASE_ID_HERE` with the ID from above.

### 3. Run the migration

```bash
npm run db:migrate:local   # test locally first
npm run db:migrate:remote  # push to production D1
```

### 4. Deploy the Worker

```bash
npm run worker:deploy
```

### 5. Deploy the Frontend

```bash
npm run build
# Upload dist/ to Cloudflare Pages, Vercel, Netlify, etc.

# Or deploy to Cloudflare Pages:
npx wrangler pages deploy dist --project-name=highest-bid
```

---

## Project Structure

```
highest-bid/
├── src/
│   ├── lib/
│   │   ├── players.ts      # 50 NBA player pool with stats
│   │   └── game.ts         # Game state machine (pure functions)
│   ├── components/
│   │   ├── PlayerCard.tsx  # Animated player reveal card
│   │   └── RosterPanel.tsx # Live roster sidebar
│   ├── pages/
│   │   ├── LobbyPage.tsx   # Name entry + rules
│   │   ├── GamePage.tsx    # Main auction UI
│   │   └── ResultsPage.tsx # Final roster comparison
│   ├── main.tsx            # Router setup
│   └── index.css           # Global styles / tokens
├── worker/
│   └── index.ts            # Cloudflare Worker API
├── migrations/
│   └── 001_init.sql        # D1 schema
├── wrangler.toml           # Cloudflare config
└── vite.config.ts
```

---

## Worker API

| Method | Path                     | Description            |
|--------|--------------------------|------------------------|
| POST   | `/api/games`             | Create game            |
| GET    | `/api/games/:id`         | Load game state        |
| PUT    | `/api/games/:id`         | Save game state        |
| POST   | `/api/games/:id/log`     | Append auction log entry |
