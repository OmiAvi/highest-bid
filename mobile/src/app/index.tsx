import { useMemo, useRef, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { ArcadeBackground } from "@/components/arcade-background";
import { ArcadeCabinet, cabinetGeometry } from "@/components/arcade-cabinet";
import { Lobby } from "@/components/lobby";
import { Palette } from "@/constants/theme";

const CREAM = "#F4E9D2";

// Show the arcade-cabinet intro only once per app session. Returning to the
// home route after a game drops straight into the lobby.
let introSeen = false;

export default function HomeScreen() {
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const geo = useMemo(() => cabinetGeometry(W, H, insets), [W, H, insets]);

  const [phase, setPhase] = useState<"cabinet" | "lobby">(introSeen ? "lobby" : "cabinet");
  const progress = useSharedValue(introSeen ? 1 : 0);
  const startedRef = useRef(false);

  function handleStart() {
    if (startedRef.current) return;
    startedRef.current = true;
    introSeen = true;
    progress.value = withTiming(1, { duration: 780, easing: Easing.inOut(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(setPhase)("lobby");
    });
  }

  // CRT screen window: grows from the cabinet's screen cutout to the full viewport.
  const screenRadius = (5 / 100) * geo.cabinet.w;
  const windowStyle = useAnimatedStyle(() => ({
    left: interpolate(progress.value, [0, 1], [geo.screen.x, 0]),
    top: interpolate(progress.value, [0, 1], [geo.screen.y, 0]),
    width: interpolate(progress.value, [0, 1], [geo.screen.w, W]),
    height: interpolate(progress.value, [0, 1], [geo.screen.h, H]),
    borderRadius: interpolate(progress.value, [0, 1], [screenRadius, 0]),
  }));

  // The lobby is laid out at full-viewport size and scaled down into the screen.
  const scalerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 1], [geo.screen.w / W, 1]) }],
  }));

  // While framed in the cabinet, nudge the lobby down so its title/wordmark
  // (not the form card) sits in the CRT; eases back to 0 as the zoom completes.
  const titleShift = H * 0.085;
  const offsetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(progress.value, [0, 1], [titleShift, 0]) }],
  }));

  const crtBgStyle = useAnimatedStyle(() => ({ opacity: interpolate(progress.value, [0, 1], [1, 0]) }));
  const sheenStyle = useAnimatedStyle(() => ({ opacity: interpolate(progress.value, [0, 0.7], [1, 0], "clamp") }));
  const creamStyle = useAnimatedStyle(() => ({ opacity: interpolate(progress.value, [0, 1], [1, 0]) }));
  const cabinetStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.62], [1, 0], "clamp"),
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 1.7]) }],
  }));

  const showChrome = phase !== "lobby";

  return (
    <View style={styles.root}>
      {/* Animated neon backdrop — revealed as the cream cover fades out. */}
      <ArcadeBackground />

      {/* Cream backdrop behind the cabinet. */}
      {showChrome && <Animated.View style={[StyleSheet.absoluteFill, styles.cream, creamStyle]} pointerEvents="none" />}

      {/* Cabinet chrome. */}
      {showChrome && (
        <Animated.View
          style={[
            styles.cabinet,
            { left: geo.cabinet.x, top: geo.cabinet.y, width: geo.cabinet.w, height: geo.cabinet.h },
            cabinetStyle,
          ]}
          pointerEvents="box-none"
        >
          <ArcadeCabinet width={geo.cabinet.w} height={geo.cabinet.h} onStart={handleStart} />
        </Animated.View>
      )}

      {/* CRT screen window holding the live lobby. */}
      <Animated.View style={[styles.window, windowStyle]} pointerEvents={phase === "lobby" ? "auto" : "none"}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.crtBg, crtBgStyle]} pointerEvents="none" />
        <View style={styles.center} pointerEvents={phase === "lobby" ? "box-none" : "none"}>
          <Animated.View style={offsetStyle}>
            <Animated.View style={[{ width: W, height: H }, scalerStyle]}>
              <Lobby />
            </Animated.View>
          </Animated.View>
        </View>
        {showChrome && (
          <Animated.View style={[StyleSheet.absoluteFill, sheenStyle]} pointerEvents="none">
            <LinearGradient
              colors={["rgba(255,255,255,0.10)", "rgba(255,255,255,0)", "rgba(0,0,0,0.18)"]}
              locations={[0, 0.45, 1]}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.court },
  cream: { backgroundColor: CREAM },
  cabinet: { position: "absolute" },
  window: { position: "absolute", overflow: "hidden" },
  crtBg: { backgroundColor: Palette.court },
  center: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
});
