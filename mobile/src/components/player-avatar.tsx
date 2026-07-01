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

  // Per-uri load state, reset during render when the uri changes (recycled rows)
  // so a row never inherits a previous player's retry/failure — no reset effect.
  const [load, setLoad] = useState({ uri: info.uri, attempt: 0, failed: false });
  if (load.uri !== info.uri) setLoad({ uri: info.uri, attempt: 0, failed: false });

  // Dev networking (e.g. OkHttp connection reuse over `adb reverse`) can drop a
  // headshot mid-load; retry a couple times on a fresh request before falling
  // back to initials.
  const MAX_RETRIES = 2;
  const showImage = info.uri !== null && !load.failed;

  return (
    <View style={[styles.frame, { width: size, height: size, borderRadius }, style]}>
      {showImage ? (
        <Image
          key={`${info.uri}-${load.attempt}`}
          source={{ uri: info.uri! }}
          style={{ width: size, height: size }}
          contentFit="cover"
          transition={150}
          cachePolicy="memory-disk"
          recyclingKey={`${info.uri}-${load.attempt}`}
          onError={(e) => {
            if (__DEV__) console.log(`[PlayerAvatar] image failed (attempt ${load.attempt + 1}): ${info.uri} — ${e?.error ?? "unknown"}`);
            setLoad((s) =>
              s.attempt < MAX_RETRIES ? { ...s, attempt: s.attempt + 1 } : { ...s, failed: true }
            );
          }}
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
