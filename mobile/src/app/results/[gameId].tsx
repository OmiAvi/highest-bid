import { useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";

import { loadSession, pollGame } from "@/lib/api";
import type { GameState, RosterSlot, TeamTotals } from "@/lib/game";
import {
  teamScore,
  teamTotals,
  fmt$,
  STARTING_BUDGET,
  effectiveRating,
  simulateBestOfSeven,
} from "@/lib/game";
import { POSITION_COLORS, POSITION_LABELS, TIER_COLORS } from "@/lib/players";
import { PlayerAvatar } from "@/components/player-avatar";
import { GavelIcon } from "@/components/gavel-icon";
import { ShareCard } from "@/components/share-card";
import { Palette, Fonts, Spacing, Radius, playerColor } from "@/constants/theme";

export default function ResultsScreen() {
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const shareRef = useRef<View>(null);
  const [sharePending, setSharePending] = useState(false);
  const [shareError, setShareError] = useState("");

  const { data: gs } = useQuery<GameState | null>({
    queryKey: ["results", gameId],
    queryFn: async () => {
      const session = await loadSession(gameId);
      const res = await pollGame(gameId, session?.token ?? "");
      return res.state;
    },
    staleTime: Infinity,
  });

  if (!gs) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Palette.gold} />
      </View>
    );
  }

  const football = gs.gameMode === "nfl" || gs.gameMode === "cfb";
  const s1 = teamScore(gs.roster1);
  const s2 = teamScore(gs.roster2);
  const t1 = teamTotals(gs.roster1);
  const t2 = teamTotals(gs.roster2);
  const spent1 = STARTING_BUDGET - gs.p1Budget;
  const spent2 = STARTING_BUDGET - gs.p2Budget;
  const series = simulateBestOfSeven(gs);
  const winner = series.winner === 1 ? gs.p1Name : series.winner === 2 ? gs.p2Name : null;

  async function handleShare() {
    setSharePending(true);
    setShareError("");
    try {
      const uri = await captureRef(shareRef, { format: "png", quality: 1, result: "tmpfile" });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: "Highest Bid Results", UTI: "public.png" });
      } else {
        setShareError("Sharing is not available on this device");
      }
    } catch (e) {
      setShareError(e instanceof Error ? e.message : "Could not create share image");
    } finally {
      setSharePending(false);
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.four, paddingBottom: insets.bottom + Spacing.six },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <GavelIcon size={22} />
            <Text style={styles.logo}>Highest Bid</Text>
            <Text style={styles.gameId}>Game #{gameId}</Text>
          </View>
          <Text style={styles.banner}>
            {winner ? (
              <>
                <Text style={{ color: winner === gs.p1Name ? Palette.gold : Palette.accent }}>{winner}</Text> wins the
                series
              </>
            ) : (
              <Text style={{ color: Palette.whiteDim }}>Series drawn</Text>
            )}
          </Text>
        </View>

        {/* Score row */}
        <View style={styles.scoreRow}>
          <ScoreCard name={gs.p1Name} score={s1} totals={t1} spent={spent1} won={winner === gs.p1Name} color={Palette.gold} num={1} football={football} />
          <View style={styles.scoreCenter}>
            <Text style={styles.seriesLine}>
              <Text style={{ color: Palette.gold }}>{series.p1Wins}</Text>
              <Text style={{ color: Palette.whiteDim }}> — </Text>
              <Text style={{ color: Palette.accent }}>{series.p2Wins}</Text>
            </Text>
            <Text style={styles.bo7}>BEST OF 7</Text>
          </View>
          <ScoreCard name={gs.p2Name} score={s2} totals={t2} spent={spent2} won={winner === gs.p2Name} color={Palette.accent} num={2} football={football} />
        </View>

        {/* Series simulation */}
        <Section label="Series simulation">
          <View style={styles.tableCard}>
            <View style={styles.tHeadSeries}>
              <Text style={[styles.th, styles.colGame]}>Game</Text>
              <Text style={[styles.th, styles.colNum, { color: Palette.gold }]} numberOfLines={1}>
                {gs.p1Name}
              </Text>
              <Text style={[styles.th, styles.colNum, { color: Palette.accent }]} numberOfLines={1}>
                {gs.p2Name}
              </Text>
              <Text style={[styles.th, styles.colWin]}>Winner</Text>
            </View>
            {series.games.map((g) => (
              <View key={g.game} style={styles.tRowSeries}>
                <Text style={[styles.td, styles.colGame]}>Game {g.game}</Text>
                <Text style={[styles.tdNum, styles.colNum, { color: Palette.gold }]}>{g.p1Score}</Text>
                <Text style={[styles.tdNum, styles.colNum, { color: Palette.accent }]}>{g.p2Score}</Text>
                <Text style={[styles.td, styles.colWin, { color: playerColor(g.winner) }]} numberOfLines={1}>
                  {g.winner === 1 ? gs.p1Name : gs.p2Name}
                </Text>
              </View>
            ))}
          </View>
        </Section>

        {/* Stat comparison (hoops only — football is scored on overall alone) */}
        {!football && (
          <Section label="Stat comparison">
            <View style={styles.card}>
              {[
                { label: "PPG", v1: t1.ppg, v2: t2.ppg, max: 36 },
                { label: "RPG", v1: t1.rpg, v2: t2.rpg, max: 14 },
                { label: "APG", v1: t1.apg, v2: t2.apg, max: 11 },
              ].map((b) => (
                <StatBar key={b.label} {...b} />
              ))}
            </View>
          </Section>
        )}

        {/* Lineups */}
        <Section label="Final lineups">
          <View style={styles.lineupGrid}>
            <FullRoster name={gs.p1Name} slots={gs.roster1} color={Palette.gold} num={1} />
            <FullRoster name={gs.p2Name} slots={gs.roster2} color={Palette.accent} num={2} />
          </View>
        </Section>

        {/* Auction recap */}
        {gs.history.length > 0 && (
          <Section label="Auction recap">
            <View style={styles.tableCard}>
              <View style={styles.tHead}>
                <Text style={[styles.th, styles.colPlayer]}>Player</Text>
                <Text style={[styles.th, styles.colPos]}>Pos</Text>
                <Text style={[styles.th, styles.colBid, { color: Palette.gold }]}>P1</Text>
                <Text style={[styles.th, styles.colBid, { color: Palette.accent }]}>P2</Text>
                <Text style={[styles.th, styles.colWinner]}>Win</Text>
              </View>
              {gs.history.map((h) => (
                <View key={h.id} style={styles.tRow}>
                  <Text style={[styles.tdName, styles.colPlayer]} numberOfLines={1}>
                    {h.playerName}
                  </Text>
                  <View style={styles.colPos}>
                    <Text
                      style={[
                        styles.posTag,
                        {
                          color: POSITION_COLORS[h.position as keyof typeof POSITION_COLORS] ?? Palette.whiteDim,
                          borderColor: `${POSITION_COLORS[h.position as keyof typeof POSITION_COLORS] ?? "#888"}30`,
                          backgroundColor: `${POSITION_COLORS[h.position as keyof typeof POSITION_COLORS] ?? "#888"}18`,
                        },
                      ]}
                    >
                      {h.position}
                    </Text>
                  </View>
                  <Text style={[styles.tdNum, styles.colBid, { color: Palette.gold }]}>{h.bid1 > 0 ? fmt$(h.bid1) : "—"}</Text>
                  <Text style={[styles.tdNum, styles.colBid, { color: Palette.accent }]}>{h.bid2 > 0 ? fmt$(h.bid2) : "—"}</Text>
                  <Text
                    style={[
                      styles.td,
                      styles.colWinner,
                      { color: h.winner ? playerColor(h.winner) : Palette.whiteDim },
                    ]}
                    numberOfLines={1}
                  >
                    {h.winner === 1 ? gs.p1Name : h.winner === 2 ? gs.p2Name : "—"}
                  </Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {!!shareError && <Text style={styles.shareError}>{shareError}</Text>}

        <View style={styles.ctaRow}>
          <Pressable disabled={sharePending} onPress={handleShare} style={[styles.shareBtn, { opacity: sharePending ? 0.6 : 1 }]}>
            <Text style={styles.shareBtnText}>{sharePending ? "Creating image…" : "Share results image"}</Text>
          </Pressable>
          <Pressable onPress={() => router.replace("/")} style={styles.playAgain}>
            <Text style={styles.playAgainText}>Play again</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Off-screen share card */}
      <View style={styles.offscreen} pointerEvents="none">
        <ShareCard ref={shareRef} gs={gs} series={series} />
      </View>
    </View>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label.toUpperCase()}</Text>
      {children}
    </View>
  );
}

function ScoreCard({
  name,
  score,
  totals,
  spent,
  won,
  color,
  num,
  football,
}: {
  name: string;
  score: number;
  totals: TeamTotals;
  spent: number;
  won: boolean;
  color: string;
  num: 1 | 2;
  football: boolean;
}) {
  return (
    <View style={[styles.scoreCard, { borderColor: won ? `${color}40` : Palette.border, backgroundColor: won ? `${color}0A` : Palette.courtSurface }]}>
      {won && <View style={[styles.wonBar, { backgroundColor: color }]} />}
      <View style={styles.scoreNameRow}>
        <View style={[styles.pBadge, { backgroundColor: color }]}>
          <Text style={styles.pBadgeText}>P{num}</Text>
        </View>
        <Text style={styles.scoreName} numberOfLines={1}>
          {name}
        </Text>
      </View>
      <Text style={[styles.scoreBig, { color }]}>{score}</Text>
      <Text style={styles.scoreCaption}>{football ? "TEAM OVR" : "EFFECTIVE OVR"}</Text>
      {!football && (
        <View style={styles.scoreStats}>
          {([["PPG", totals.ppg], ["RPG", totals.rpg], ["APG", totals.apg]] as [string, number][]).map(([l, v]) => (
            <View key={l} style={styles.scoreStat}>
              <Text style={[styles.scoreStatV, { color }]}>{v.toFixed(1)}</Text>
              <Text style={styles.scoreStatL}>{l}</Text>
            </View>
          ))}
        </View>
      )}
      <Text style={styles.scoreSpent}>
        Spent {fmt$(spent)}
        {football ? "" : ` · Penalty ${totals.penalty}`}
      </Text>
    </View>
  );
}

function StatBar({ label, v1, v2, max }: { label: string; v1: number; v2: number; max: number }) {
  const p1 = Math.min((v1 / max) * 100, 100);
  const p2 = Math.min((v2 / max) * 100, 100);
  return (
    <View style={styles.statBar}>
      <Text style={[styles.statVal, { color: Palette.gold, textAlign: "right" }]}>{v1.toFixed(1)}</Text>
      <View style={styles.statTrack}>
        <View style={[styles.statFill, { width: `${p1}%`, backgroundColor: Palette.gold, alignSelf: "flex-end" }]} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statTrack}>
        <View style={[styles.statFill, { width: `${p2}%`, backgroundColor: Palette.accent }]} />
      </View>
      <Text style={[styles.statVal, { color: Palette.accent }]}>{v2.toFixed(1)}</Text>
    </View>
  );
}

function FullRoster({ name, slots, color, num }: { name: string; slots: RosterSlot[]; color: string; num: 1 | 2 }) {
  return (
    <View style={styles.fullRoster}>
      <View style={styles.fullRosterHeader}>
        <View style={[styles.pBadge, { backgroundColor: color }]}>
          <Text style={styles.pBadgeText}>P{num}</Text>
        </View>
        <Text style={styles.scoreName} numberOfLines={1}>
          {name}
        </Text>
      </View>
      {slots.map((slot, i) => {
        const pos = slot.position;
        const tc = slot.stats ? TIER_COLORS[slot.stats.tier] : Palette.whiteDim;
        return (
          <View key={i} style={styles.fullRosterRow}>
            <Text style={[styles.frPos, { color: POSITION_COLORS[pos] }]}>{pos}</Text>
            {slot.playerName && slot.sourcePosition ? (
              <>
                <PlayerAvatar name={slot.playerName} position={slot.sourcePosition} size={32} radius={9} />
                <View style={styles.frInfo}>
                  <Text style={styles.frName} numberOfLines={1}>
                    {slot.playerName}
                  </Text>
                  <Text style={styles.frSub} numberOfLines={1}>
                    {slot.playerTeam} · {slot.sourcePosition}
                    {slot.sourcePosition !== slot.position ? ` in ${slot.position} (-${slot.penalty})` : ""}
                    {` · ${fmt$(slot.cost ?? 0)}`}
                  </Text>
                </View>
                <Text style={[styles.frRating, { color: tc }]}>{effectiveRating(slot)}</Text>
              </>
            ) : (
              <Text style={styles.frEmpty}>{POSITION_LABELS[pos]}</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Palette.court },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Palette.court },
  content: { paddingHorizontal: Spacing.four, gap: Spacing.five, maxWidth: 780, width: "100%", alignSelf: "center" },

  header: { paddingBottom: Spacing.three, borderBottomWidth: 1, borderBottomColor: Palette.border, gap: Spacing.three },
  headerTop: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  logo: { fontFamily: Fonts.display, fontSize: 14, fontWeight: "700", color: Palette.white },
  gameId: { fontSize: 11, color: Palette.whiteDim, marginLeft: Spacing.one },
  banner: { fontFamily: Fonts.display, fontSize: 34, fontWeight: "700", color: Palette.white, letterSpacing: -0.8, lineHeight: 38 },

  scoreRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  scoreCenter: { alignItems: "center", paddingHorizontal: Spacing.one },
  seriesLine: { fontFamily: Fonts.display, fontSize: 32, fontWeight: "700" },
  bo7: { fontSize: 10, fontWeight: "600", letterSpacing: 1, color: Palette.whiteDim },
  scoreCard: { flex: 1, borderWidth: 1, borderRadius: Radius.xl, paddingVertical: Spacing.three, paddingHorizontal: Spacing.two, alignItems: "center", overflow: "hidden" },
  wonBar: { position: "absolute", top: 0, left: 0, right: 0, height: 2 },
  scoreNameRow: { flexDirection: "row", alignItems: "center", gap: Spacing.one + 2, marginBottom: Spacing.two },
  pBadge: { width: 20, height: 20, borderRadius: 5, alignItems: "center", justifyContent: "center" },
  pBadgeText: { fontFamily: Fonts.display, fontWeight: "700", fontSize: 10, color: "#fff" },
  scoreName: { fontFamily: Fonts.display, fontSize: 14, fontWeight: "600", color: Palette.white, flexShrink: 1 },
  scoreBig: { fontFamily: Fonts.display, fontSize: 40, fontWeight: "700", letterSpacing: -1 },
  scoreCaption: { fontSize: 10, fontWeight: "600", letterSpacing: 1, color: Palette.whiteDim, marginBottom: Spacing.three },
  scoreStats: { flexDirection: "row", gap: Spacing.three },
  scoreStat: { alignItems: "center" },
  scoreStatV: { fontFamily: Fonts.display, fontSize: 15, fontWeight: "600" },
  scoreStatL: { fontSize: 10, color: Palette.whiteDim },
  scoreSpent: { fontSize: 11, color: Palette.whiteDim, marginTop: Spacing.three, textAlign: "center" },

  section: { gap: Spacing.two + 2 },
  sectionLabel: { fontSize: 10, fontWeight: "600", letterSpacing: 1, color: Palette.whiteDim },

  card: { backgroundColor: Palette.courtSurface, borderWidth: 1, borderColor: Palette.border, borderRadius: Radius.xl, padding: Spacing.four, gap: Spacing.three },
  tableCard: { backgroundColor: Palette.courtSurface, borderWidth: 1, borderColor: Palette.border, borderRadius: Radius.xl, overflow: "hidden" },

  tHead: { flexDirection: "row", paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderBottomWidth: 1, borderBottomColor: Palette.border },
  tHeadSeries: { flexDirection: "row", paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderBottomWidth: 1, borderBottomColor: Palette.border },
  tRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.three, paddingVertical: Spacing.two + 1, borderBottomWidth: 1, borderBottomColor: Palette.border },
  tRowSeries: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.three, paddingVertical: Spacing.two + 1, borderBottomWidth: 1, borderBottomColor: Palette.border },
  th: { fontSize: 10, fontWeight: "600", letterSpacing: 0.6, color: Palette.whiteDim, textTransform: "uppercase" },
  td: { fontSize: 12, color: Palette.white },
  tdName: { fontFamily: Fonts.display, fontSize: 13, fontWeight: "600", color: Palette.white },
  tdNum: { fontFamily: Fonts.display, fontSize: 13, fontWeight: "600" },
  colGame: { flex: 1.2 },
  colNum: { flex: 1, textAlign: "right" },
  colWin: { flex: 1.3, textAlign: "right" },
  colPlayer: { flex: 2 },
  colPos: { flex: 0.8, alignItems: "center" },
  colBid: { flex: 1, textAlign: "right" },
  colWinner: { flex: 1.3, textAlign: "right" },
  posTag: { fontSize: 10, fontWeight: "600", borderWidth: 1, borderRadius: 4, paddingHorizontal: Spacing.one + 2, paddingVertical: 1, overflow: "hidden" },

  // Stat bars
  statBar: { flexDirection: "row", alignItems: "center", gap: Spacing.two + 2 },
  statVal: { fontFamily: Fonts.display, fontSize: 13, fontWeight: "600", minWidth: 38 },
  statTrack: { flex: 1, height: 4, backgroundColor: Palette.borderStrong, borderRadius: 2, overflow: "hidden" },
  statFill: { height: "100%", borderRadius: 2 },
  statLabel: { fontSize: 10, fontWeight: "600", letterSpacing: 1, color: Palette.whiteDim, minWidth: 28, textAlign: "center" },

  // Lineups
  lineupGrid: { flexDirection: "row", gap: Spacing.three },
  fullRoster: { flex: 1, borderWidth: 1, borderColor: Palette.border, borderRadius: Radius.lg, overflow: "hidden" },
  fullRosterHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.two, padding: Spacing.two + 2, borderBottomWidth: 1, borderBottomColor: Palette.border },
  fullRosterRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two, padding: Spacing.two, borderBottomWidth: 1, borderBottomColor: Palette.border },
  frPos: { fontSize: 10, fontWeight: "600", width: 18 },
  frInfo: { flex: 1, minWidth: 0 },
  frName: { fontFamily: Fonts.display, fontSize: 12, fontWeight: "600", color: Palette.white },
  frSub: { fontSize: 10, color: Palette.whiteDim },
  frRating: { fontFamily: Fonts.display, fontSize: 13, fontWeight: "700", minWidth: 26, textAlign: "right" },
  frEmpty: { flex: 1, fontSize: 11, color: Palette.whiteDim, opacity: 0.5 },

  shareError: {
    fontSize: 12,
    color: Palette.danger,
    textAlign: "center",
    backgroundColor: "rgba(248,113,113,0.08)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.18)",
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    overflow: "hidden",
  },
  ctaRow: { flexDirection: "row", justifyContent: "center", gap: Spacing.three, flexWrap: "wrap" },
  shareBtn: {
    backgroundColor: Palette.courtSurface,
    borderWidth: 1,
    borderColor: Palette.borderStrong,
    borderRadius: Radius.md,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  shareBtnText: { color: Palette.white, fontFamily: Fonts.display, fontSize: 14, fontWeight: "600" },
  playAgain: { backgroundColor: Palette.gold, borderRadius: Radius.md, paddingVertical: Spacing.three, paddingHorizontal: Spacing.five },
  playAgainText: { color: "#fff", fontFamily: Fonts.display, fontSize: 14, fontWeight: "600" },

  offscreen: { position: "absolute", left: -10000, top: 0 },
});
