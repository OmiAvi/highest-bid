/**
 * Highest Bid design tokens — a dark-only "deep arcade" theme ported from the
 * web app's CSS custom properties (web/src/index.css). The mobile app does not
 * support a light mode; every screen renders on the court-black background.
 */
import { Platform } from "react-native";

export const Palette = {
  // Surfaces — deep arcade black-purple
  court: "#06050F",
  courtMid: "#0C0818",
  courtSurface: "#130F1E",
  surfaceHigh: "#1A1428",

  // Text
  white: "#F0F2F5",
  whiteDim: "#C8CCE0",
  whiteFaint: "rgba(240,242,245,0.05)",

  // Player accents
  gold: "#FF2D78", // P1 — hot magenta
  goldGlow: "rgba(255,45,120,0.18)",
  accent: "#00E5FF", // P2 — electric cyan
  accentGlow: "rgba(0,229,255,0.14)",

  // Borders
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.15)",

  // Status
  danger: "#F87171",
} as const;

/** Player-color helpers keyed by player number (1 = P1 gold, 2 = P2 accent). */
export const playerColor = (num: 1 | 2): string => (num === 1 ? Palette.gold : Palette.accent);

export const Fonts = Platform.select({
  default: {
    // Display / wordmark font (bundled OTF, registered in the root layout).
    display: "SpaceRabbit",
    // Body font (Inter, loaded via @expo-google-fonts/inter).
    body: "Inter_400Regular",
    bodyMedium: "Inter_500Medium",
    bodySemiBold: "Inter_600SemiBold",
    bodyBold: "Inter_700Bold",
  },
})!;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
} as const;

export const MaxContentWidth = 780;
