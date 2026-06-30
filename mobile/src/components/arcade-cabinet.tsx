import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { EdgeInsets } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { Fonts } from "@/constants/theme";

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CabinetGeometry {
  /** Absolute box (px) the cabinet artwork fills, centered in the viewport. */
  cabinet: Box;
  /** Absolute rect (px) of the CRT screen cutout where the game renders. */
  screen: Box;
}

// Cabinet sizing
const CAB_WIDTH_FRAC = 0.86; // of viewport width
const CAB_MAX_WIDTH = 440;
const CAB_ASPECT = 100 / 156; // viewBox w/h — the cabinet is tall

// Screen cutout as fractions of the cabinet box (must match the SVG viewBox below)
const SCREEN_FRAC = { x: 0.13, y: 0.205, w: 0.74, h: 0.345 } as const;

// PRESS START button placement as fractions of the cabinet box
const START_FRAC = { x: 0.26, y: 0.85, w: 0.48, h: 0.062 } as const;

/**
 * Compute where the cabinet and its screen sit in the viewport. Shared by the
 * cabinet artwork and the index orchestrator so the lobby can be mapped exactly
 * into the screen cutout and zoomed out of it.
 */
export function cabinetGeometry(vw: number, vh: number, insets: EdgeInsets): CabinetGeometry {
  const availH = vh - insets.top - insets.bottom - 16;
  let w = Math.min(vw * CAB_WIDTH_FRAC, CAB_MAX_WIDTH);
  let h = w / CAB_ASPECT;
  if (h > availH) {
    h = availH;
    w = h * CAB_ASPECT;
  }
  const x = (vw - w) / 2;
  const y = insets.top + (availH - h) / 2;
  return {
    cabinet: { x, y, w, h },
    screen: {
      x: x + SCREEN_FRAC.x * w,
      y: y + SCREEN_FRAC.y * h,
      w: SCREEN_FRAC.w * w,
      h: SCREEN_FRAC.h * h,
    },
  };
}

/**
 * Cartoon retro arcade cabinet — pure chrome (no game content). The CRT screen
 * is left transparent so the orchestrator can render the live lobby through it.
 * The whole screen area and the marquee PRESS START button trigger `onStart`.
 */
export function ArcadeCabinet({
  width,
  height,
  onStart,
}: {
  width: number;
  height: number;
  onStart: () => void;
}) {
  const blink = useSharedValue(1);
  useEffect(() => {
    blink.value = withRepeat(withTiming(0.35, { duration: 650, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [blink]);

  const blinkStyle = useAnimatedStyle(() => ({ opacity: blink.value }));

  const startBox = {
    left: START_FRAC.x * width,
    top: START_FRAC.y * height,
    width: START_FRAC.w * width,
    height: START_FRAC.h * height,
  };
  const screenBox = {
    left: SCREEN_FRAC.x * width,
    top: SCREEN_FRAC.y * height,
    width: SCREEN_FRAC.w * width,
    height: SCREEN_FRAC.h * height,
  };

  return (
    <View style={[styles.root, { width, height }]} pointerEvents="box-none">
      <Svg width={width} height={height} viewBox="0 0 100 156">
        <Defs>
          <LinearGradient id="body" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#3C414D" />
            <Stop offset="1" stopColor="#21252E" />
          </LinearGradient>
          <LinearGradient id="side" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#23272F" />
            <Stop offset="0.5" stopColor="#363B45" />
            <Stop offset="1" stopColor="#23272F" />
          </LinearGradient>
          <LinearGradient id="marquee" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FF5A6E" />
            <Stop offset="1" stopColor="#E23B4E" />
          </LinearGradient>
          <LinearGradient id="panel" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#444A57" />
            <Stop offset="1" stopColor="#2A2E38" />
          </LinearGradient>
          <RadialGradient id="screenGlow" cx="0.5" cy="0.5" r="0.7">
            <Stop offset="0" stopColor="#ffffff" stopOpacity="0.06" />
            <Stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Drop shadow on the floor */}
        <Path d="M16 150 H84 L92 154 H8 Z" fill="rgba(0,0,0,0.12)" />

        {/* Cabinet body */}
        <Rect x={4} y={12} width={92} height={140} rx={13} fill="url(#side)" stroke="#14161B" strokeWidth={2.5} />
        <Rect x={9} y={16} width={82} height={132} rx={9} fill="url(#body)" />

        {/* Classic side accent stripes */}
        <Rect x={11} y={94} width={3} height={50} rx={1.5} fill="#FFC83D" opacity={0.85} />
        <Rect x={86} y={94} width={3} height={50} rx={1.5} fill="#FFC83D" opacity={0.85} />
        <Rect x={14.5} y={94} width={1.5} height={50} rx={0.75} fill="#E23B4E" opacity={0.7} />
        <Rect x={84} y={94} width={1.5} height={50} rx={0.75} fill="#E23B4E" opacity={0.7} />

        {/* Marquee header */}
        <Rect x={6} y={1.5} width={88} height={21} rx={6} fill="#14161B" stroke="#0B0D12" strokeWidth={2} />
        <Rect x={9} y={4} width={82} height={16} rx={4} fill="url(#marquee)" />
        <Rect x={9} y={4} width={82} height={6} rx={4} fill="#ffffff" opacity={0.2} />

        {/* Screen glow halo (behind transparent cutout) */}
        <Rect
          x={SCREEN_FRAC.x * 100 - 2}
          y={SCREEN_FRAC.y * 156 - 2}
          width={SCREEN_FRAC.w * 100 + 4}
          height={SCREEN_FRAC.h * 156 + 4}
          rx={7}
          fill="url(#screenGlow)"
        />
        {/* Screen bezel — stroked so the interior stays transparent for the game */}
        <Rect
          x={SCREEN_FRAC.x * 100}
          y={SCREEN_FRAC.y * 156}
          width={SCREEN_FRAC.w * 100}
          height={SCREEN_FRAC.h * 156}
          rx={5}
          fill="none"
          stroke="#0B0D12"
          strokeWidth={6}
        />
        <Rect
          x={SCREEN_FRAC.x * 100 - 1.5}
          y={SCREEN_FRAC.y * 156 - 1.5}
          width={SCREEN_FRAC.w * 100 + 3}
          height={SCREEN_FRAC.h * 156 + 3}
          rx={6.5}
          fill="none"
          stroke="#5A6170"
          strokeWidth={1}
          opacity={0.5}
        />

        {/* Speaker grille slits below the screen */}
        {[0, 1, 2].map((i) => (
          <Rect key={i} x={34} y={92 + i * 2.4} width={32} height={1} rx={0.5} fill="#8A90A0" opacity={0.3} />
        ))}

        {/* Control panel deck */}
        <Path d="M12 100 H88 L84 122 H16 Z" fill="url(#panel)" stroke="#14161B" strokeWidth={1.5} strokeOpacity={0.6} />
        {/* Joystick */}
        <Rect x={26} y={108} width={3} height={9} rx={1.5} fill="#0B0D12" />
        <Circle cx={27.5} cy={107} r={4.2} fill="#E23B4E" stroke="#14161B" strokeWidth={1} />
        <Circle cx={26} cy={105.6} r={1.4} fill="#ffffff" opacity={0.5} />
        {/* Buttons */}
        <Circle cx={52} cy={111} r={3.4} fill="#E23B4E" stroke="#0B0D12" strokeWidth={1} />
        <Circle cx={62} cy={110} r={3.4} fill="#FFC83D" stroke="#0B0D12" strokeWidth={1} />
        <Circle cx={72} cy={112} r={3.4} fill="#3D7DFF" stroke="#0B0D12" strokeWidth={1} />

        {/* Coin slot */}
        <Rect x={42} y={130} width={16} height={6} rx={2} fill="#0B0D12" />
        <Rect x={48} y={131.5} width={4} height={3} rx={1} fill="#FFC83D" opacity={0.7} />

        {/* Base feet */}
        <Rect x={12} y={144} width={76} height={6} rx={2} fill="#14161B" />
      </Svg>

      {/* Marquee wordmark */}
      <View style={[styles.marqueeLabel, { top: height * 0.022, height: height * 0.105 }]} pointerEvents="none">
        <Text style={styles.marqueeText} numberOfLines={1} adjustsFontSizeToFit>
          ARCADE
        </Text>
      </View>

      {/* Tapping the screen also starts */}
      <Pressable style={[styles.screenHit, screenBox]} onPress={onStart} />

      {/* PRESS START button */}
      <Pressable onPress={onStart} style={[styles.startBtn, startBox]}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.startInner, blinkStyle]}>
          <Text style={styles.startText} numberOfLines={1} adjustsFontSizeToFit>
            PRESS START
          </Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: "relative" },
  marqueeLabel: {
    position: "absolute",
    left: "9%",
    right: "9%",
    alignItems: "center",
    justifyContent: "center",
  },
  marqueeText: {
    fontFamily: Fonts.display,
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 1,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  screenHit: { position: "absolute" },
  startBtn: { position: "absolute" },
  startInner: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E23B4E",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#FF8A98",
    shadowColor: "#E23B4E",
    shadowOpacity: 0.8,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  startText: {
    fontFamily: Fonts.display,
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
});
