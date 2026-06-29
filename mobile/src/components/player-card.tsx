import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import type { NBAPlayer } from "@/lib/players";
import { POSITION_COLORS, TIER_COLORS } from "@/lib/players";
import { PlayerAvatar } from "@/components/player-avatar";
import { Palette, Fonts, Spacing, Radius } from "@/constants/theme";

const TIER_LABEL: Record<NBAPlayer["tier"], string> = {
  superstar: "Superstar",
  allstar: "All-Star",
  starter: "Starter",
  role: "Role Player",
};

interface Props {
  player: NBAPlayer;
  /** Changes whenever a new card should re-animate in. */
  animKey?: number | string;
}

export function PlayerCard({ player, animKey }: Props) {
  const pc = POSITION_COLORS[player.position];
  const tc = TIER_COLORS[player.tier];

  return (
    <Animated.View key={animKey} entering={FadeIn.duration(220)} style={styles.card}>
      <View style={[styles.accentBar, { backgroundColor: pc }]} />

      <View style={styles.body}>
        <View style={styles.topRow}>
          <PlayerAvatar name={player.name} position={player.position} size={120} radius={18} />

          <View style={styles.info}>
            <View style={styles.headerRow}>
              <View style={styles.tagRow}>
                <Text
                  style={[styles.posBadge, { color: pc, backgroundColor: `${pc}18`, borderColor: `${pc}30` }]}
                >
                  {player.position}
                </Text>
                <Text style={[styles.tierLabel, { color: tc }]} numberOfLines={1}>
                  {TIER_LABEL[player.tier]}
                </Text>
              </View>
              <Text style={[styles.ovr, { color: tc }]}>
                {player.rating}
                <Text style={styles.ovrSuffix}> OVR</Text>
              </Text>
            </View>

            <Text style={styles.team}>{player.team}</Text>
            <Text style={styles.name} numberOfLines={2}>
              {player.name}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          {[
            { label: "PPG", value: player.ppg.toFixed(1) },
            { label: "RPG", value: player.rpg.toFixed(1) },
            { label: "APG", value: player.apg.toFixed(1) },
            { label: "FG%", value: player.fg_pct.toFixed(1) },
          ].map(({ label, value }) => (
            <View key={label} style={styles.statCell}>
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.courtSurface,
    borderWidth: 1,
    borderColor: Palette.borderStrong,
    borderRadius: Radius.xl,
    overflow: "hidden",
  },
  accentBar: { height: 3 },
  body: { padding: Spacing.four },
  topRow: { flexDirection: "row", gap: Spacing.three, alignItems: "center", marginBottom: Spacing.four },
  info: { flex: 1, minWidth: 0 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  tagRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two, flexShrink: 1 },
  posBadge: {
    fontFamily: Fonts.display,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.6,
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    overflow: "hidden",
  },
  tierLabel: { fontFamily: Fonts.display, fontSize: 11, fontWeight: "500", letterSpacing: 0.4, flexShrink: 1 },
  ovr: { fontFamily: Fonts.display, fontSize: 26, fontWeight: "700" },
  ovrSuffix: { fontSize: 11, fontWeight: "500", color: Palette.whiteDim },
  team: { fontSize: 11, fontWeight: "500", color: Palette.whiteDim, letterSpacing: 0.4, marginBottom: 3 },
  name: {
    fontFamily: Fonts.display,
    fontSize: 28,
    fontWeight: "600",
    lineHeight: 30,
    color: Palette.white,
    letterSpacing: -0.5,
  },
  statsRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.sm + 1,
    overflow: "hidden",
    gap: 1,
  },
  statCell: { flex: 1, backgroundColor: Palette.courtMid, paddingVertical: Spacing.three, alignItems: "center" },
  statValue: { fontFamily: Fonts.display, fontSize: 20, fontWeight: "600", color: Palette.white },
  statLabel: { fontSize: 10, fontWeight: "500", letterSpacing: 0.6, color: Palette.whiteDim, marginTop: 3 },
});
