import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  advanceRound,
  assignSlot,
  loadSession,
  passBid,
  pollGame,
  raiseBid,
  type GameSession,
  type PollResponse,
} from "@/lib/api";
import type { Position } from "@/lib/players";

const POLL_MS = 1500;

/**
 * Loads the player's session and polls authoritative game state via react-query.
 * Polling stops automatically once the game is `complete`. Mutations refresh the
 * game query on success so turns/bids/slots sync without a manual loop.
 */
export function useGame(gameId: string) {
  const qc = useQueryClient();

  const sessionQuery = useQuery<GameSession | null>({
    queryKey: ["session", gameId],
    queryFn: () => loadSession(gameId),
    staleTime: Infinity,
  });
  const session = sessionQuery.data ?? null;
  const token = session?.token ?? "";

  const gameQuery = useQuery<PollResponse>({
    queryKey: ["game", gameId],
    queryFn: () => pollGame(gameId, token),
    enabled: !!session,
    refetchInterval: (query) =>
      query.state.data?.state.phase === "complete" ? false : POLL_MS,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["game", gameId] });

  const raise = useMutation({
    mutationFn: (bidCents: number) => raiseBid(gameId, token, bidCents),
    onSuccess: refresh,
  });
  const pass = useMutation({
    mutationFn: () => passBid(gameId, token),
    onSuccess: refresh,
  });
  const assign = useMutation({
    mutationFn: (position: Position) => assignSlot(gameId, token, position),
    onSuccess: refresh,
  });
  const advance = useMutation({
    mutationFn: () => advanceRound(gameId, token),
    onSuccess: refresh,
  });

  return {
    session,
    sessionLoading: sessionQuery.isLoading,
    poll: gameQuery.data ?? null,
    isLoading: gameQuery.isLoading,
    raise,
    pass,
    assign,
    advance,
  };
}
