import { useState } from "react";
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { Image } from "expo-image";

import type { Position } from "@/lib/players";
import { getPlayerHeadshot } from "@/lib/headshots";
import { Palette } from "@/constants/theme";

interface Props {
  name: string;
  position: Position;
  size: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Renders a player headshot: a remotely-served PNG (cached by expo-image) when
 * one is mapped and reachable, otherwise a position-toned initials avatar. The
 * fallback also covers remote load failures (no backend, bad URL, offline), so
 * an avatar always renders.
 */
export function PlayerAvatar({ name, position, size, radius, style }: Props) {
  const info = getPlayerHeadshot(name, position);
  const borderRadius = radius ?? Math.round(size * 0.28);

  // Derived "failed" so it auto-resets when the uri changes (recycled rows),
  // without a reset effect.
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const showImage = info.uri !== null && failedUri !== info.uri;

  return (
    <View style={[styles.frame, { width: size, height: size, borderRadius }, style]}>
      {showImage ? (
        <Image
          source={{ uri: info.uri! }}
          style={{ width: size, height: size }}
          contentFit="cover"
          transition={150}
          cachePolicy="memory-disk"
          recyclingKey={info.uri}
          onError={() => setFailedUri(info.uri)}
        />
      ) : (
        <View style={[styles.fallback, { width: size, height: size, backgroundColor: info.primary }]}>
          <Text style={[styles.initials, { fontSize: Math.round(size * 0.36) }]}>{info.initials}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.courtMid,
  },
  fallback: { alignItems: "center", justifyContent: "center" },
  initials: { color: "#0B0710", fontWeight: "800", letterSpacing: 0.5 },
});
