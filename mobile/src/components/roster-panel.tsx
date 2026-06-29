import { View, Text, StyleSheet } from "react-native";

import { POSITIONS, POSITION_COLORS, POSITION_LABELS } from "@/lib/players";
import type { RosterSlot } from "@/lib/game";
import { effectiveRating, fmt$ } from "@/lib/game";
import { PlayerAvatar } from "@/components/player-avatar";
import { Palette, Fonts, Spacing, Radius, playerColor } from "@/constants/theme";

interface Props {
  name: string;
  slots: RosterSlot[];
  budget: number;
  num: 1 | 2;
}

export function RosterPanel({ name, slots, budget, num }: Props) {
  const color = playerColor(num);
  const filledCount = slots.filter((s) => s.playerName).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.badge, { backgroundColor: color }]}>
            <Text style={styles.badgeText}>P{num}</Text>
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
        </View>
        <Text style={styles.meta}>
          {filledCount}/5 · {fmt$(budget)}
        </Text>
      </View>

      {POSITIONS.map((pos) => {
        const slot = slots.find((s) => s.position === pos)!;
        const pc = POSITION_COLORS[pos];
        const filled = slot.playerName !== null;

        return (
          <View key={pos} style={[styles.row, { opacity: filled ? 1 : 0.4 }]}>
            <Text style={[styles.pos, { color: pc }]}>{pos}</Text>

            {filled && slot.sourcePosition ? (
              <>
                <PlayerAvatar name={slot.playerName!} position={slot.sourcePosition} size={34} radius={10} />
                <View style={styles.slotInfo}>
                  <Text style={styles.playerName} numberOfLines={1}>
                    {slot.playerName}
                  </Text>
                  <Text style={styles.subline} numberOfLines={1}>
                    {slot.playerTeam} · {slot.sourcePosition}
                    {slot.sourcePosition !== slot.position ? ` in ${slot.position} (-${slot.penalty})` : ""}
                    {slot.cost != null ? ` · ${fmt$(slot.cost)}` : ""}
                  </Text>
                </View>
                <Text style={[styles.rating, { color }]}>{effectiveRating(slot)}</Text>
              </>
            ) : (
              <Text style={styles.empty}>{POSITION_LABELS[pos]}</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 1, borderColor: Palette.border, borderRadius: Radius.lg, overflow: "hidden" },
  header: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.two, flexShrink: 1 },
  badge: { width: 24, height: 24, borderRadius: Radius.sm - 1, alignItems: "center", justifyContent: "center" },
  badgeText: { fontFamily: Fonts.display, fontWeight: "700", fontSize: 11, color: "#fff" },
  name: { fontFamily: Fonts.display, fontSize: 14, fontWeight: "600", color: Palette.white, flexShrink: 1 },
  meta: { fontSize: 11, color: Palette.whiteDim, fontVariant: ["tabular-nums"] },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  pos: { fontFamily: Fonts.display, fontSize: 10, fontWeight: "600", letterSpacing: 0.5, width: 22 },
  slotInfo: { flex: 1, minWidth: 0 },
  playerName: { fontFamily: Fonts.display, fontSize: 13, fontWeight: "600", color: Palette.white },
  subline: { fontSize: 11, color: Palette.whiteDim, marginTop: 1 },
  rating: { fontFamily: Fonts.display, fontSize: 14, fontWeight: "600", minWidth: 30, textAlign: "right" },
  empty: { flex: 1, fontSize: 12, color: Palette.whiteDim },
});
