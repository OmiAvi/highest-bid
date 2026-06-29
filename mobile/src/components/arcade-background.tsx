import { StyleSheet, useWindowDimensions } from "react-native";
import {
  Canvas,
  Picture,
  Skia,
  createPicture,
  useClock,
  vec,
  PaintStyle,
  TileMode,
} from "@shopify/react-native-skia";
import { useDerivedValue } from "react-native-reanimated";

const PINK = "rgba(255,45,120,";
const CYAN = "rgba(0,229,255,";

const NUM_STARS = 160;
const HORIZON = 0.68;
const FOCAL = 350;
const Z_RANGE = 900;
const STAR_SPEED = 240; // z units per second
const GRID_COLS = 16;
const GRID_ROWS = 14;
const GRID_SPEED = 0.28;

interface Star {
  x: number;
  y: number;
  z0: number;
  tint: 0 | 1 | 2; // 0 white, 1 cyan, 2 pink
}

// Deterministic PRNG so the star layout is fixed (no impure Math.random in render)
// and stable across re-renders.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STARS: Star[] = (() => {
  const rng = mulberry32(0x9e3779b9);
  return Array.from({ length: NUM_STARS }, () => {
    const x = (rng() - 0.5) * 1800;
    return {
      x,
      y: (rng() - 0.5) * 900,
      z0: rng() * Z_RANGE + 10,
      tint: (x > 400 ? 1 : x < -400 ? 2 : 0) as 0 | 1 | 2,
    };
  });
})();

/**
 * Animated retro-arcade backdrop (warp-speed starfield, neon horizon grid,
 * floating orb glows, vignette) — a Skia port of the web canvas ArcadeBackground.
 */
export function ArcadeBackground() {
  const { width: W, height: H } = useWindowDimensions();
  const clock = useClock();

  // Star positions are derived from the clock each frame (no mutable per-frame
  // state), so the drawing stays worklet-safe.
  const stars = STARS;

  const picture = useDerivedValue(() => {
    const t = clock.value / 1000;
    return createPicture((canvas) => {
      "worklet";
      const cx = W / 2;
      const horizonY = H * HORIZON;
      const starCY = horizonY * 0.48;

      const paint = Skia.Paint();

      // ── Full-screen background gradient ──
      paint.setShader(
        Skia.Shader.MakeLinearGradient(
          vec(0, 0),
          vec(0, H),
          [Skia.Color("#0D0A1A"), Skia.Color("#06050F"), Skia.Color("#08060F")],
          [0, 0.45, 1],
          TileMode.Clamp,
        ),
      );
      canvas.drawRect(Skia.XYWHRect(0, 0, W, H), paint);
      paint.setShader(null);

      // ── Starfield (warp streaks) ──
      paint.setStyle(PaintStyle.Stroke);
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        let z = s.z0 - t * STAR_SPEED;
        z = ((z % Z_RANGE) + Z_RANGE) % Z_RANGE;
        if (z < 1) z = 1;
        const pz = Math.min(Z_RANGE, z + 4);

        const sx = cx + (s.x / z) * FOCAL;
        const sy = starCY + (s.y / z) * FOCAL;
        if (sx < 0 || sx > W || sy < 0 || sy > horizonY) continue;

        const px = cx + (s.x / pz) * FOCAL;
        const py = starCY + (s.y / pz) * FOCAL;

        const bright = Math.min(1, 1 - z / Z_RANGE);
        const tint = s.tint === 1 ? CYAN : s.tint === 2 ? PINK : "rgba(240,242,245,";
        paint.setColor(Skia.Color(`${tint}${bright * 0.9 + 0.1})`));
        paint.setStrokeWidth(bright * 2 + 0.4);
        canvas.drawLine(px, py, sx, sy, paint);
      }

      // ── Horizon glow ──
      paint.setStyle(PaintStyle.Fill);
      paint.setShader(
        Skia.Shader.MakeRadialGradient(
          vec(cx, horizonY),
          W * 0.65,
          [
            Skia.Color(`${PINK}0.22)`),
            Skia.Color(`${CYAN}0.12)`),
            Skia.Color(`${PINK}0.04)`),
            Skia.Color(`${PINK}0)`),
          ],
          [0, 0.15, 0.4, 1],
          TileMode.Clamp,
        ),
      );
      canvas.drawRect(Skia.XYWHRect(0, horizonY - H * 0.4, W, H * 0.72), paint);
      paint.setShader(null);

      // Horizon line
      paint.setStyle(PaintStyle.Stroke);
      paint.setShader(
        Skia.Shader.MakeLinearGradient(
          vec(0, 0),
          vec(W, 0),
          [
            Skia.Color(`${PINK}0)`),
            Skia.Color(`${PINK}0.55)`),
            Skia.Color(`${CYAN}0.65)`),
            Skia.Color(`${PINK}0.55)`),
            Skia.Color(`${PINK}0)`),
          ],
          [0, 0.18, 0.5, 0.82, 1],
          TileMode.Clamp,
        ),
      );
      paint.setStrokeWidth(1.5);
      canvas.drawLine(0, horizonY, W, horizonY, paint);
      paint.setShader(null);
      paint.setColor(Skia.Color(`${CYAN}0.07)`));
      paint.setStrokeWidth(14);
      canvas.drawLine(0, horizonY, W, horizonY, paint);

      // ── Neon grid ──
      const scroll = (t * GRID_SPEED) % 1;

      // vertical lines
      for (let i = 0; i <= GRID_COLS; i++) {
        const frac = i / GRID_COLS;
        const xBot = cx + (frac - 0.5) * W * 2.8;
        const edgeDim = 1 - Math.abs(frac - 0.5) * 1.4;
        const alpha = Math.max(0, edgeDim) * 0.7;
        paint.setColor(Skia.Color(`${CYAN}${alpha})`));
        paint.setStrokeWidth(1);
        canvas.drawLine(cx, horizonY, xBot, H, paint);
      }

      // horizontal lines (scrolling toward viewer)
      for (let j = 0; j <= GRID_ROWS; j++) {
        const worldFrac = (j / GRID_ROWS + scroll) % 1;
        const depth = 1 - 1 / (1 + worldFrac * 5.5);
        const screenY = horizonY + (H - horizonY) * depth;
        const halfW = depth * W * 1.4;
        const alpha = depth * 0.8 + 0.02;
        const isAccent = j % 4 === 0;
        const color = isAccent ? PINK : CYAN;
        paint.setColor(Skia.Color(`${color}${alpha})`));
        paint.setStrokeWidth((isAccent ? 1.6 : 1) * (depth * 1.8 + 0.4));
        canvas.drawLine(Math.max(0, cx - halfW), screenY, Math.min(W, cx + halfW), screenY, paint);
      }

      // bottom fade
      paint.setStyle(PaintStyle.Fill);
      paint.setShader(
        Skia.Shader.MakeLinearGradient(
          vec(0, H - 170),
          vec(0, H),
          [Skia.Color("rgba(8,6,15,0)"), Skia.Color("rgba(8,6,15,0.5)"), Skia.Color("rgba(8,6,15,0.92)")],
          [0, 0.6, 1],
          TileMode.Clamp,
        ),
      );
      canvas.drawRect(Skia.XYWHRect(0, H - 170, W, 170), paint);
      paint.setShader(null);

      // ── Floating orb glows ──
      const orbs = [
        { rx: 0.1, ry: 0.12, r: 200, c: PINK, p: 0 },
        { rx: 0.9, ry: 0.1, r: 180, c: CYAN, p: 2.1 },
        { rx: 0.78, ry: 0.42, r: 110, c: PINK, p: 4.2 },
        { rx: 0.18, ry: 0.48, r: 120, c: CYAN, p: 1.5 },
      ];
      for (let i = 0; i < orbs.length; i++) {
        const orb = orbs[i];
        const ox = orb.rx * W + Math.sin(t * 0.55 + orb.p) * 28;
        const oy = orb.ry * H + Math.cos(t * 0.38 + orb.p) * 20;
        const r = orb.r + Math.sin(t * 0.45 + orb.p) * 22;
        paint.setShader(
          Skia.Shader.MakeRadialGradient(
            vec(ox, oy),
            r,
            [Skia.Color(`${orb.c}0.25)`), Skia.Color(`${orb.c}0.08)`), Skia.Color(`${orb.c}0)`)],
            [0, 0.4, 1],
            TileMode.Clamp,
          ),
        );
        canvas.drawCircle(ox, oy, r, paint);
        paint.setShader(null);
      }

      // ── Vignette ──
      paint.setShader(
        Skia.Shader.MakeRadialGradient(
          vec(cx, H * 0.5),
          H * 1.1,
          [Skia.Color("rgba(6,5,15,0)"), Skia.Color("rgba(6,5,15,0.55)")],
          [0.32, 1],
          TileMode.Clamp,
        ),
      );
      canvas.drawRect(Skia.XYWHRect(0, 0, W, H), paint);
      paint.setShader(null);
    });
  }, [W, H]);

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Picture picture={picture} />
    </Canvas>
  );
}
