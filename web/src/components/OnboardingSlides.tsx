import { useState, useEffect } from "react";
import type { Position } from "../lib/players";
import { POSITION_COLORS } from "../lib/players";

interface PlayerDef { name: string; pos: Position; rating: number; team: string; }

const SPIN_PLAYERS: PlayerDef[] = [
  { name: "LeBron James",   pos: "SF", rating: 97, team: "LAL" },
  { name: "Stephen Curry",  pos: "PG", rating: 96, team: "GSW" },
  { name: "Giannis A.",     pos: "PF", rating: 97, team: "MIL" },
  { name: "Luka Doncic",    pos: "PG", rating: 96, team: "DAL" },
  { name: "Kevin Durant",   pos: "SF", rating: 95, team: "PHX" },
  { name: "Nikola Jokic",   pos: "C",  rating: 98, team: "DEN" },
  { name: "Joel Embiid",    pos: "C",  rating: 96, team: "PHI" },
  { name: "Jayson Tatum",   pos: "SF", rating: 93, team: "BOS" },
  { name: "Devin Booker",   pos: "SG", rating: 92, team: "PHX" },
  { name: "Damian Lillard", pos: "PG", rating: 93, team: "MIL" },
  { name: "Anthony Davis",  pos: "PF", rating: 95, team: "LAL" },
  { name: "Kawhi Leonard",  pos: "SF", rating: 91, team: "LAC" },
];

const WINNER = SPIN_PLAYERS[1]; // Stephen Curry — controlled landing
const FINAL_BID = 7;
const POSITIONS_LIST: Position[] = ["PG", "SG", "SF", "PF", "C"];
const POS_LABELS: Record<string, string> = {
  PG: "Point Guard", SG: "Shooting Guard", SF: "Small Forward", PF: "Power Forward", C: "Center",
};

/* ── Mini Roster ───────────────────────────────────────── */

function MiniRoster({ filledPos }: { filledPos: Position | null }) {
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
      {POSITIONS_LIST.map((pos, i) => {
        const filled = pos === filledPos;
        return (
          <div key={pos} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "9px 12px",
            borderBottom: i < 4 ? "1px solid var(--border)" : "none",
            background: filled ? "rgba(255,45,120,0.07)" : "transparent",
            animation: filled ? "fillSlot 0.4s ease-out" : "none",
            transition: "background 300ms",
          }}>
            <span style={{
              fontFamily: "var(--font-d)", fontSize: 10, fontWeight: 700,
              letterSpacing: "0.05em", color: POSITION_COLORS[pos], width: 24, flexShrink: 0,
            }}>
              {pos}
            </span>
            {filled ? (
              <>
                <span style={{
                  fontFamily: "var(--font-d)", fontWeight: 700, fontSize: 13,
                  color: "var(--white)", flex: 1,
                }}>
                  {WINNER.name}
                </span>
                <span style={{
                  fontFamily: "var(--font-d)", fontSize: 13, fontWeight: 700,
                  color: "var(--gold)",
                }}>
                  ${FINAL_BID}
                </span>
              </>
            ) : (
              <span style={{ fontSize: 12, color: "rgba(200,204,224,0.28)", flex: 1 }}>
                {POS_LABELS[pos]}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Slide 1: Slot Machine ─────────────────────────────── */

function SlotMachineSlide({ onNext }: { onNext: () => void }) {
  const [idx, setIdx] = useState(0);
  const [tick, setTick] = useState(0);
  const [phase, setPhase] = useState<"spin" | "slow" | "done">("spin");

  useEffect(() => {
    let cancelled = false;
    // spin fast → decelerate → snap to WINNER (idx 1)
    const delays: number[] = [
      ...Array(22).fill(60),
      90, 115, 150, 200, 270, 370, 510,
    ];
    let i = 0;
    let cur = 0;

    function step() {
      if (cancelled) return;
      if (i >= delays.length) {
        setIdx(1);
        setPhase("done");
        return;
      }
      cur = (cur + 1) % SPIN_PLAYERS.length;
      setIdx(cur);
      setTick(t => t + 1);
      if (i === delays.length - 3) setPhase("slow");
      setTimeout(step, delays[i++]);
    }
    setTimeout(step, 280);
    return () => { cancelled = true; };
  }, []);

  const N = SPIN_PLAYERS.length;
  const prevP = SPIN_PLAYERS[(idx - 1 + N) % N];
  const currP = SPIN_PLAYERS[idx];
  const nextP = SPIN_PLAYERS[(idx + 1) % N];
  const ITEM_H = 76;

  return (
    <div style={{ padding: "28px 20px 24px", minHeight: 300 }}>
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <div style={sl.label}>Round starts</div>
        <div style={sl.title}>A random NBA player goes up for auction each round</div>
      </div>

      {/* Drum */}
      <div style={{ position: "relative", maxWidth: 320, margin: "0 auto" }}>
        {/* Highlight band */}
        <div style={{
          position: "absolute", top: ITEM_H, left: -3, right: -3, height: ITEM_H,
          border: `2px solid ${phase === "done" ? "var(--gold)" : "rgba(255,255,255,0.1)"}`,
          borderRadius: 10, pointerEvents: "none", zIndex: 2,
          boxShadow: phase === "done" ? "0 0 28px rgba(255,45,120,0.25)" : "none",
          animation: phase === "done" ? "glowPulse 1.6s ease-in-out infinite" : "none",
          transition: "border-color 350ms, box-shadow 500ms",
        }} />
        {/* Top/bottom fade */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none",
          background: "linear-gradient(to bottom, var(--court-surface) 0%, transparent 30%, transparent 70%, var(--court-surface) 100%)",
        }} />
        {/* Items */}
        <div style={{
          overflow: "hidden", height: ITEM_H * 3,
          filter: phase === "spin" ? "blur(1.8px)" : phase === "slow" ? "blur(0.6px)" : "none",
          transition: "filter 280ms",
        }}>
          {([prevP, currP, nextP] as PlayerDef[]).map((p, ri) => {
            const isCenter = ri === 1;
            return (
              <div
                key={isCenter ? `c${tick}` : ri}
                style={{
                  height: ITEM_H,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 4,
                  animation: isCenter ? `slotIn ${phase === "spin" ? 70 : 180}ms ease-out` : "none",
                  opacity: isCenter ? 1 : 0.15,
                }}
              >
                <div style={{
                  fontFamily: "var(--font-d)", fontWeight: 700,
                  fontSize: isCenter ? 22 : 14, letterSpacing: isCenter ? "-0.02em" : "0",
                  color: isCenter && phase === "done" ? "var(--gold)" : "var(--white)",
                  transition: "color 350ms",
                }}>
                  {p.name}
                </div>
                {isCenter && (
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", color: POSITION_COLORS[p.pos] }}>
                    {p.pos} · {p.team} · {p.rating}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {phase === "done" && (
        <div style={{ textAlign: "center", marginTop: 22, animation: "fadeUp 0.4s ease-out" }}>
          <div style={{ color: "var(--gold)", fontFamily: "var(--font-d)", fontSize: 11, letterSpacing: "0.1em", marginBottom: 14 }}>
            ★ PLAYER SELECTED
          </div>
          <button onClick={onNext} style={sl.nextBtn}>
            See the bidding →
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Slide 2: Auction ──────────────────────────────────── */

function AuctionSlide({ onNext }: { onNext: () => void }) {
  const [bid, setBid] = useState(1);
  const [aPhase, setAPhase] = useState<"bidding" | "gavel" | "roster">("bidding");

  useEffect(() => {
    let cancelled = false;
    const schedule = [150, 160, 180, 260, 400, 620]; // delay before each increment
    let i = 0;
    let cur = 1;

    function step() {
      if (cancelled) return;
      if (i >= schedule.length) {
        setAPhase("gavel");
        setTimeout(() => { if (!cancelled) setAPhase("roster"); }, 1000);
        return;
      }
      setTimeout(() => {
        if (cancelled) return;
        cur++;
        setBid(cur);
        step();
      }, schedule[i++]);
    }
    setTimeout(step, 500);
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{ padding: "28px 20px 24px", minHeight: 300 }}>
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <div style={sl.label}>Bidding begins</div>
        <div style={sl.title}>Players bid against each other — raise or pass</div>
      </div>

      {/* Player chip */}
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "5px 14px", background: "var(--court-mid)",
          border: "1px solid var(--border)", borderRadius: 20,
        }}>
          <span style={{ fontFamily: "var(--font-d)", fontWeight: 700, fontSize: 14, color: "var(--white)" }}>
            {WINNER.name}
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: POSITION_COLORS[WINNER.pos] }}>
            {WINNER.pos}
          </span>
        </div>
      </div>

      {/* Bid counter */}
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div
          key={bid}
          style={{
            fontFamily: "var(--font-d)", fontSize: 80, fontWeight: 800, lineHeight: 1,
            letterSpacing: "-0.04em",
            color: aPhase !== "bidding" ? "var(--gold)" : "var(--white)",
            animation: "bidPop 180ms ease-out",
            transition: "color 300ms",
          }}
        >
          ${bid}
        </div>
        {aPhase === "bidding" && (
          <div style={{ fontSize: 11, color: "var(--white-dim)", letterSpacing: "0.05em", marginTop: 4 }}>
            CURRENT BID
          </div>
        )}
      </div>

      {/* Gavel */}
      {(aPhase === "gavel" || aPhase === "roster") && (
        <div style={{ textAlign: "center", marginBottom: 8, animation: "fadeUp 0.3s ease-out" }}>
          <div style={{ fontSize: 44, display: "inline-block", animation: "gavelHit 0.55s ease-out" }}>
            🔨
          </div>
          <div style={{
            fontFamily: "var(--font-d)", fontSize: 20, fontWeight: 800,
            color: "var(--gold)", letterSpacing: "0.06em", marginTop: 4,
            animation: "fadeUp 0.4s ease-out 0.25s both",
          }}>
            SOLD! ${FINAL_BID}
          </div>
        </div>
      )}

      {/* Roster */}
      {aPhase === "roster" && (
        <div style={{ animation: "fadeUp 0.45s ease-out 0.2s both", marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "var(--white-dim)", textAlign: "center", marginBottom: 10, letterSpacing: "0.04em" }}>
            {WINNER.name} added to your roster
          </div>
          <MiniRoster filledPos="PG" />
        </div>
      )}

      {aPhase === "roster" && (
        <div style={{ textAlign: "center", animation: "fadeUp 0.4s ease-out 0.5s both" }}>
          <button onClick={onNext} style={sl.nextBtn}>
            Almost there →
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Slide 3: CTA ──────────────────────────────────────── */

function CTASlide({ onDone }: { onDone: () => void }) {
  return (
    <div style={{ padding: "28px 20px 28px" }}>
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <div style={sl.label}>Your goal</div>
        <div style={{
          fontFamily: "var(--font-d)", fontSize: 30, fontWeight: 800,
          color: "var(--white)", letterSpacing: "-0.025em", lineHeight: 1.15,
          marginBottom: 6,
        }}>
          Build the best roster
        </div>
        <div style={{
          fontFamily: "var(--font-d)", fontSize: 22, fontWeight: 700,
          background: "linear-gradient(90deg, var(--gold), var(--accent))",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          under a $20 budget
        </div>
      </div>

      <MiniRoster filledPos={null} />

      <div style={{ textAlign: "center", marginTop: 20 }}>
        <div style={{ fontSize: 12, color: "var(--white-dim)", lineHeight: 1.6, marginBottom: 18 }}>
          Draft PG · SG · SF · PF · C — outbid your opponent<br />
          or pass and let them overpay
        </div>
        <button
          onClick={onDone}
          style={{
            ...sl.nextBtn,
            fontSize: 16, padding: "13px 36px",
            background: "linear-gradient(135deg, var(--gold), var(--accent))",
            boxShadow: "0 0 30px rgba(255,45,120,0.25)",
          }}
        >
          Let's Play →
        </button>
      </div>
    </div>
  );
}

/* ── Main export ───────────────────────────────────────── */

export function OnboardingSlides({ onDone }: { onDone: () => void }) {
  const [slide, setSlide] = useState(0);

  const goNext = () => {
    if (slide >= 2) onDone();
    else setSlide(s => s + 1);
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Skip */}
      <button onClick={onDone} style={{
        position: "absolute", top: -28, right: 0,
        fontSize: 11, color: "var(--white-dim)", background: "none", border: "none",
        letterSpacing: "0.05em", opacity: 0.55, padding: "4px 2px",
      }}>
        skip
      </button>

      {/* Dot indicators */}
      <div style={{ display: "flex", justifyContent: "center", gap: 5, marginBottom: 10 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            height: 4, borderRadius: 2,
            width: i === slide ? 20 : 6,
            background: i === slide ? "var(--gold)" : "rgba(255,255,255,0.14)",
            transition: "all 300ms ease",
          }} />
        ))}
      </div>

      {/* Slide panel */}
      <div
        key={slide}
        style={{
          background: "var(--court-surface)", border: "1px solid var(--border)",
          borderRadius: 12, overflow: "hidden",
          animation: "fadeUp 0.3s ease-out",
        }}
      >
        {slide === 0 && <SlotMachineSlide onNext={goNext} />}
        {slide === 1 && <AuctionSlide onNext={goNext} />}
        {slide === 2 && <CTASlide onDone={onDone} />}
      </div>
    </div>
  );
}

/* ── Shared styles ─────────────────────────────────────── */

const sl = {
  label: {
    fontSize: 10, fontWeight: 600, letterSpacing: "0.1em",
    color: "var(--white-dim)", textTransform: "uppercase" as const, marginBottom: 7,
  },
  title: {
    fontSize: 14, color: "var(--white-dim)", lineHeight: 1.55,
  },
  nextBtn: {
    padding: "10px 26px",
    background: "var(--gold)", color: "#fff",
    fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 600,
    letterSpacing: "0.03em", borderRadius: 8, border: "none", cursor: "pointer",
  } as React.CSSProperties,
};
