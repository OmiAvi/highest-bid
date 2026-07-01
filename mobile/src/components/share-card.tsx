import { forwardRef } from "react";
import { View, Text, StyleSheet } from "react-native";

import type { GameState, SeriesResult } from "@/lib/game";
import { teamScore, teamTotals, effectiveRating } from "@/lib/game";
import { PlayerAvatar } from "@/components/player-avatar";
import { GavelIcon } from "@/components/gavel-icon";
import { Palette, Fonts, Spacing, Radius } from "@/constants/theme";

interface Props {
  gs: GameState;
  series: SeriesResult;
}

const MODE_TAGLINE: Record<string, string> = {
  nba: "NBA Draft Auction",
  cbb: "College Hoops Auction",
  nfl: "NFL Draft Auction",
  cfb: "College Football Auction",
};

/**
 * A fixed-size, off-screen results card captured by react-native-view-shot to
 * produce the shareable PNG. Mirrors the web `shareImage.ts` content.
 */
export const ShareCard = forwardRef<View, Props>(function ShareCard({ gs, series }, ref) {
  const winner = series.winner === 1 ? gs.p1Name : series.winner === 2 ? gs.p2Name : null;
  const football = gs.gameMode === "nfl" || gs.gameMode === "cfb";
  const s1 = teamScore(gs.roster1);
  const s2 = teamScore(gs.roster2);
  const t1 = teamTotals(gs.roster1);
  const t2 = teamTotals(gs.roster2);

  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <View style={styles.header}>
        <GavelIcon size={40} />
        <Text style={styles.logo}>Highest Bid</Text>
      </View>

      <Text style={styles.banner}>
        {winner ? (
          <>
            <Text style={{ color: winner === gs.p1Name ? Palette.gold : Palette.accent }}>{winner}</Text> wins the series
          </>
        ) : (
          "Series drawn"
        )}
      </Text>

      <View style={styles.scoreRow}>
        <ShareScore name={gs.p1Name} score={s1} totals={t1} color={Palette.gold} num={1} won={winner === gs.p1Name} football={football} />
        <View style={styles.scoreCenter}>
          <Text style={styles.seriesScore}>
            <Text style={{ color: Palette.gold }}>{series.p1Wins}</Text>
            <Text style={{ color: Palette.whiteDim }}> — </Text>
            <Text style={{ color: Palette.accent }}>{series.p2Wins}</Text>
          </Text>
          <Text style={styles.bo7}>BEST OF 7</Text>
        </View>
        <ShareScore name={gs.p2Name} score={s2} totals={t2} color={Palette.accent} num={2} won={winner === gs.p2Name} football={football} />
      </View>

      <View style={styles.lineups}>
        <ShareLineup name={gs.p1Name} gs={gs} num={1} color={Palette.gold} />
        <ShareLineup name={gs.p2Name} gs={gs} num={2} color={Palette.accent} />
      </View>

      <Text style={styles.footer}>Play at Highest Bid · {MODE_TAGLINE[gs.gameMode]}</Text>
    </View>
  );
});

function ShareScore({
  name,
  score,
  totals,
  color,
  num,
  won,
  football,
}: {
  name: string;
  score: number;
  totals: { ppg: number; rpg: number; apg: number };
  color: string;
  num: 1 | 2;
  won: boolean;
  football: boolean;
}) {
  return (
    <View style={[styles.scoreCard, { borderColor: won ? `${color}55` : Palette.border }]}>
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
    </View>
  );
}

function ShareLineup({ name, gs, num, color }: { name: string; gs: GameState; num: 1 | 2; color: string }) {
  const slots = num === 1 ? gs.roster1 : gs.roster2;
  return (
    <View style={styles.lineup}>
      <View style={styles.lineupHeader}>
        <View style={[styles.pBadge, { backgroundColor: color }]}>
          <Text style={styles.pBadgeText}>P{num}</Text>
        </View>
        <Text style={styles.scoreName} numberOfLines={1}>
          {name}
        </Text>
      </View>
      {slots.map((slot, i) => {
        const pos = slot.position;
        return (
          <View key={i} style={styles.lineupRow}>
            <Text style={[styles.lineupPos, { color }]}>{pos}</Text>
            {slot.playerName && slot.sourcePosition ? (
              <>
                <PlayerAvatar name={slot.playerName} position={slot.sourcePosition} size={28} radius={8} />
                <Text style={styles.lineupName} numberOfLines={1}>
                  {slot.playerName}
                </Text>
                <Text style={[styles.lineupRating, { color }]}>{effectiveRating(slot)}</Text>
              </>
            ) : (
              <Text style={styles.lineupEmpty}>—</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: 540, backgroundColor: Palette.court, padding: Spacing.five, gap: Spacing.four },
  header: { flexDirection: "row", alignItems: "center", gap: Spacing.two, justifyContent: "center" },
  logo: { fontFamily: Fonts.display, fontSize: 28, fontWeight: "800", color: Palette.white, letterSpacing: -0.8 },
  banner: { fontFamily: Fonts.display, fontSize: 34, fontWeight: "700", color: Palette.white, textAlign: "center", letterSpacing: -0.8 },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  scoreCenter: { alignItems: "center", paddingHorizontal: Spacing.one },
  seriesScore: { fontFamily: Fonts.display, fontSize: 34, fontWeight: "700" },
  bo7: { fontSize: 10, fontWeight: "600", letterSpacing: 1, color: Palette.whiteDim },
  scoreCard: { flex: 1, borderWidth: 1, borderRadius: Radius.xl, padding: Spacing.three, alignItems: "center", backgroundColor: Palette.courtSurface },
  scoreNameRow: { flexDirection: "row", alignItems: "center", gap: Spacing.one + 2, marginBottom: Spacing.two },
  pBadge: { width: 20, height: 20, borderRadius: 5, alignItems: "center", justifyContent: "center" },
  pBadgeText: { fontFamily: Fonts.display, fontWeight: "700", fontSize: 10, color: "#fff" },
  scoreName: { fontFamily: Fonts.display, fontSize: 14, fontWeight: "600", color: Palette.white, flexShrink: 1 },
  scoreBig: { fontFamily: Fonts.display, fontSize: 44, fontWeight: "700", letterSpacing: -1 },
  scoreCaption: { fontSize: 10, fontWeight: "600", letterSpacing: 1, color: Palette.whiteDim, marginBottom: Spacing.two },
  scoreStats: { flexDirection: "row", gap: Spacing.three },
  scoreStat: { alignItems: "center" },
  scoreStatV: { fontFamily: Fonts.display, fontSize: 15, fontWeight: "600" },
  scoreStatL: { fontSize: 10, color: Palette.whiteDim },
  lineups: { flexDirection: "row", gap: Spacing.three },
  lineup: { flex: 1, borderWidth: 1, borderColor: Palette.border, borderRadius: Radius.lg, overflow: "hidden" },
  lineupHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.two, padding: Spacing.two + 2, borderBottomWidth: 1, borderBottomColor: Palette.border },
  lineupRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two, padding: Spacing.two, borderBottomWidth: 1, borderBottomColor: Palette.border },
  lineupPos: { fontSize: 10, fontWeight: "600", width: 18 },
  lineupName: { flex: 1, fontFamily: Fonts.display, fontSize: 12, fontWeight: "600", color: Palette.white },
  lineupRating: { fontFamily: Fonts.display, fontSize: 12, fontWeight: "700" },
  lineupEmpty: { flex: 1, color: Palette.whiteDim },
  footer: { fontSize: 11, color: Palette.whiteDim, textAlign: "center", letterSpacing: 0.3 },
});
