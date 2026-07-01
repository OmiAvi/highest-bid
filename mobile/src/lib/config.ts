/**
 * Runtime configuration. The API + asset origin is supplied via the
 * `EXPO_PUBLIC_API_BASE` environment variable (see `.env`), so the same binary
 * works in dev and prod without code changes.
 *
 * - `API_BASE`   — base for REST calls, e.g. `https://host/api`
 * - `ASSET_BASE` — origin that serves `/headshots/...` (API_BASE minus the `/api` suffix)
 *
 * When `EXPO_PUBLIC_API_BASE` is unset, online play is unavailable but the
 * fully offline "Same computer" mode still works end to end.
 */
export const API_BASE = (process.env.EXPO_PUBLIC_API_BASE ?? "").replace(/\/$/, "");

export const ASSET_BASE = API_BASE.replace(/\/api$/, "");

export const HAS_BACKEND = API_BASE.length > 0;

if (__DEV__) {
  // One-time startup diagnostic: confirms EXPO_PUBLIC_API_BASE was baked into the
  // bundle and what host images/API will use. If API_BASE is "(unset)" after an
  // `expo start -c`, the .env file isn't being picked up.
  console.log(
    `[config] API_BASE=${API_BASE || "(unset)"} ASSET_BASE=${ASSET_BASE || "(unset)"} HAS_BACKEND=${HAS_BACKEND}`
  );
}
