import { useEffect, useRef } from "react";

interface Star { x: number; y: number; z: number; pz: number; }

const PINK = "255,45,120";
const CYAN = "0,229,255";

export function ArcadeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let t = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const NUM_STARS = 220;
    const HORIZON = 0.68;
    const FOCAL = 350;
    const GRID_COLS = 16;
    const GRID_ROWS = 14;
    const GRID_SPEED = 0.28;

    const stars: Star[] = Array.from({ length: NUM_STARS }, () => spawnStar(true));

    function spawnStar(randomZ = false): Star {
      return {
        x: (Math.random() - 0.5) * 1800,
        y: (Math.random() - 0.5) * 900,
        z: randomZ ? Math.random() * 900 + 10 : 900,
        pz: randomZ ? 1 : 900,
      };
    }

    const orbDefs = [
      { rx: 0.10, ry: 0.12, r: 200, c: PINK, p: 0.0 },
      { rx: 0.90, ry: 0.10, r: 180, c: CYAN, p: 2.1 },
      { rx: 0.78, ry: 0.42, r: 110, c: PINK, p: 4.2 },
      { rx: 0.18, ry: 0.48, r: 120, c: CYAN, p: 1.5 },
    ];

    function draw() {
      const W = canvas!.width;
      const H = canvas!.height;
      const cx = W / 2;
      const horizonY = H * HORIZON;
      const starCY = horizonY * 0.48;

      // Full-screen gradient so top/bottom never look like a hard cutoff
      const bgGrad = ctx!.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0,    "#0D0A1A");
      bgGrad.addColorStop(0.45, "#06050F");
      bgGrad.addColorStop(1,    "#08060F");
      ctx!.fillStyle = bgGrad;
      ctx!.fillRect(0, 0, W, H);

      // ── STARFIELD ──
      for (const s of stars) {
        s.pz = s.z;
        s.z -= 4;
        if (s.z <= 0) {
          Object.assign(s, spawnStar(false));
          continue;
        }
        const sx = cx + (s.x / s.z) * FOCAL;
        const sy = starCY + (s.y / s.z) * FOCAL;
        if (sx < 0 || sx > W || sy < 0 || sy > horizonY) continue;

        const px = cx + (s.x / s.pz) * FOCAL;
        const py = starCY + (s.y / s.pz) * FOCAL;

        const bright = Math.min(1, 1 - s.z / 900);
        // tint some stars cyan or pink for extra arcade feel
        const tint = s.x > 400 ? `rgba(${CYAN},` : s.x < -400 ? `rgba(${PINK},` : "rgba(240,242,245,";
        ctx!.beginPath();
        ctx!.moveTo(px, py);
        ctx!.lineTo(sx, sy);
        ctx!.strokeStyle = `${tint}${bright * 0.9 + 0.1})`;
        ctx!.lineWidth = bright * 2 + 0.4;
        ctx!.stroke();
      }

      // ── HORIZON GLOW ──
      const sunR = ctx!.createRadialGradient(cx, horizonY, 0, cx, horizonY, W * 0.65);
      sunR.addColorStop(0,    `rgba(${PINK},0.22)`);
      sunR.addColorStop(0.15, `rgba(${CYAN},0.12)`);
      sunR.addColorStop(0.4,  `rgba(${PINK},0.04)`);
      sunR.addColorStop(1,    `rgba(${PINK},0)`);
      ctx!.fillStyle = sunR;
      ctx!.fillRect(0, horizonY - H * 0.4, W, H * 0.72);

      // thin glowing horizon line — softer so it blends rather than cuts
      ctx!.beginPath();
      ctx!.moveTo(0, horizonY);
      ctx!.lineTo(W, horizonY);
      const lineGrad = ctx!.createLinearGradient(0, 0, W, 0);
      lineGrad.addColorStop(0,    `rgba(${PINK},0)`);
      lineGrad.addColorStop(0.18, `rgba(${PINK},0.55)`);
      lineGrad.addColorStop(0.5,  `rgba(${CYAN},0.65)`);
      lineGrad.addColorStop(0.82, `rgba(${PINK},0.55)`);
      lineGrad.addColorStop(1,    `rgba(${PINK},0)`);
      ctx!.strokeStyle = lineGrad;
      ctx!.lineWidth = 1.5;
      ctx!.stroke();

      // soft wide glow behind the line
      ctx!.beginPath();
      ctx!.moveTo(0, horizonY);
      ctx!.lineTo(W, horizonY);
      ctx!.strokeStyle = `rgba(${CYAN},0.07)`;
      ctx!.lineWidth = 14;
      ctx!.stroke();

      // ── NEON GRID ──
      const scroll = (t * GRID_SPEED) % 1;

      // vertical lines — cyan
      for (let i = 0; i <= GRID_COLS; i++) {
        const frac = i / GRID_COLS;
        const xBot = cx + (frac - 0.5) * W * 2.8;
        const edgeDim = 1 - Math.abs(frac - 0.5) * 1.4;
        const alpha = Math.max(0, edgeDim) * 0.7;

        const vGrad = ctx!.createLinearGradient(cx, horizonY, xBot, H);
        vGrad.addColorStop(0,    `rgba(${CYAN},0)`);
        vGrad.addColorStop(0.12, `rgba(${CYAN},${alpha * 0.4})`);
        vGrad.addColorStop(1,    `rgba(${CYAN},${alpha})`);

        ctx!.beginPath();
        ctx!.moveTo(cx, horizonY);
        ctx!.lineTo(xBot, H);
        ctx!.strokeStyle = vGrad;
        ctx!.lineWidth = 1;
        ctx!.stroke();
      }

      // horizontal lines — cyan base, pink accents
      for (let j = 0; j <= GRID_ROWS; j++) {
        const worldFrac = ((j / GRID_ROWS) + scroll) % 1;
        const depth = 1 - 1 / (1 + worldFrac * 5.5);
        const screenY = horizonY + (H - horizonY) * depth;
        const halfW = depth * W * 1.4;
        const alpha = depth * 0.80 + 0.02;

        const isAccent = j % 4 === 0;
        const color = isAccent ? PINK : CYAN;

        ctx!.beginPath();
        ctx!.moveTo(Math.max(0, cx - halfW), screenY);
        ctx!.lineTo(Math.min(W, cx + halfW), screenY);
        ctx!.strokeStyle = `rgba(${color},${alpha})`;
        ctx!.lineWidth = (isAccent ? 1.6 : 1) * (depth * 1.8 + 0.4);
        ctx!.stroke();
      }

      // bottom fade — gradual so the grid dissolves rather than hard-stops
      const btmFade = ctx!.createLinearGradient(0, H - 160, 0, H);
      btmFade.addColorStop(0, "rgba(8,6,15,0)");
      btmFade.addColorStop(0.6, "rgba(8,6,15,0.5)");
      btmFade.addColorStop(1, "rgba(8,6,15,0.92)");
      ctx!.fillStyle = btmFade;
      ctx!.fillRect(0, H - 170, W, 170);

      // ── FLOATING ORB GLOWS ──
      for (const orb of orbDefs) {
        const ox = orb.rx * W + Math.sin(t * 0.55 + orb.p) * 28;
        const oy = orb.ry * H + Math.cos(t * 0.38 + orb.p) * 20;
        const r = orb.r + Math.sin(t * 0.45 + orb.p) * 22;
        const og = ctx!.createRadialGradient(ox, oy, 0, ox, oy, r);
        og.addColorStop(0,   `rgba(${orb.c},0.25)`);
        og.addColorStop(0.4, `rgba(${orb.c},0.08)`);
        og.addColorStop(1,   `rgba(${orb.c},0)`);
        ctx!.fillStyle = og;
        ctx!.beginPath();
        ctx!.arc(ox, oy, r, 0, Math.PI * 2);
        ctx!.fill();
      }

      // ── VIGNETTE ──
      const vig = ctx!.createRadialGradient(cx, H * 0.5, H * 0.35, cx, H * 0.5, H * 1.1);
      vig.addColorStop(0, "rgba(6,5,15,0)");
      vig.addColorStop(1, "rgba(6,5,15,0.55)");
      ctx!.fillStyle = vig;
      ctx!.fillRect(0, 0, W, H);

      // ── SCANLINES ──
      ctx!.fillStyle = "rgba(0,0,0,0.028)";
      for (let y = 0; y < H; y += 4) {
        ctx!.fillRect(0, y, W, 2);
      }

      t += 1 / 60;
      raf = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
