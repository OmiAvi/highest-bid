import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";

import type { Position } from "@/lib/players";
import { POSITION_COLORS, POSITION_LABELS } from "@/lib/players";
import { Palette, Fonts, Spacing, Radius } from "@/constants/theme";

interface PlayerDef {
  name: string;
  pos: Position;
  rating: number;
  team: string;
}

const SPIN_PLAYERS: PlayerDef[] = [
  { name: "LeBron James", pos: "SF", rating: 97, team: "LAL" },
  { name: "Stephen Curry", pos: "PG", rating: 96, team: "GSW" },
  { name: "Giannis A.", pos: "PF", rating: 97, team: "MIL" },
  { name: "Luka Doncic", pos: "PG", rating: 96, team: "DAL" },
  { name: "Kevin Durant", pos: "SF", rating: 95, team: "PHX" },
  { name: "Nikola Jokic", pos: "C", rating: 98, team: "DEN" },
  { name: "Joel Embiid", pos: "C", rating: 96, team: "PHI" },
  { name: "Jayson Tatum", pos: "SF", rating: 93, team: "BOS" },
  { name: "Devin Booker", pos: "SG", rating: 92, team: "PHX" },
  { name: "Damian Lillard", pos: "PG", rating: 93, team: "MIL" },
  { name: "Anthony Davis", pos: "PF", rating: 95, team: "LAL" },
  { name: "Kawhi Leonard", pos: "SF", rating: 91, team: "LAC" },
];

const WINNER = SPIN_PLAYERS[1]; // Stephen Curry — controlled landing
const FINAL_BID = 7;
const POSITIONS_LIST: Position[] = ["PG", "SG", "SF", "PF", "C"];

function MiniRoster({ filledPos }: { filledPos: Position | null }) {
  return (
    <View style={styles.miniRoster}>
      {POSITIONS_LIST.map((pos, i) => {
        const filled = pos === filledPos;
        return (
          <View
            key={pos}
            style={[
              styles.miniRow,
              i < 4 && styles.miniRowBorder,
              filled && { backgroundColor: "rgba(255,45,120,0.07)" },
            ]}
          >
            <Text style={[styles.miniPos, { color: POSITION_COLORS[pos] }]}>{pos}</Text>
            {filled ? (
              <>
                <Text style={styles.miniName}>{WINNER.name}</Text>
                <Text style={styles.miniBid}>${FINAL_BID}</Text>
              </>
            ) : (
              <Text style={styles.miniEmpty}>{POSITION_LABELS[pos]}</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

function useTimeouts() {
  const ids = useRef<ReturnType<typeof setTimeout>[]>([]);
  const set = (fn: () => void, ms: number) => {
    ids.current.push(setTimeout(fn, ms));
  };
  useEffect(() => () => ids.current.forEach(clearTimeout), []);
  return set;
}

function SlotMachineSlide({ onNext }: { onNext: () => void }) {
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const setT = useTimeouts();

  useEffect(() => {
    const delays = [...Array(22).fill(60), 90, 115, 150, 200, 270, 370, 510];
    let elapsed = 280;
    let cur = 0;
    delays.forEach((d) => {
      elapsed += d;
      setT(() => {
        cur = (cur + 1) % SPIN_PLAYERS.length;
        setIdx(cur);
      }, elapsed);
    });
    setT(() => {
      setIdx(1);
      setDone(true);
    }, elapsed + 80);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const player = SPIN_PLAYERS[idx];

  return (
    <View style={styles.slide}>
      <View style={styles.slideHead}>
        <Text style={styles.label}>ROUND STARTS</Text>
        <Text style={styles.title}>A random NBA player goes up for auction each round</Text>
      </View>

      <View style={[styles.drum, done && styles.drumDone]}>
        <Text style={[styles.drumName, done && { color: Palette.gold }]}>{player.name}</Text>
        <Text style={[styles.drumMeta, { color: POSITION_COLORS[player.pos] }]}>
          {player.pos} · {player.team} · {player.rating}
        </Text>
      </View>

      {done && (
        <Animated.View entering={FadeInUp.duration(400)} style={styles.center}>
          <Text style={styles.selected}>★ PLAYER SELECTED</Text>
          <NextButton label="See the bidding →" onPress={onNext} />
        </Animated.View>
      )}
    </View>
  );
}

function AuctionSlide({ onNext }: { onNext: () => void }) {
  const [bid, setBid] = useState(1);
  const [phase, setPhase] = useState<"bidding" | "sold">("bidding");
  const setT = useTimeouts();

  useEffect(() => {
    const schedule = [150, 160, 180, 260, 400, 620];
    let elapsed = 500;
    let cur = 1;
    schedule.forEach((d) => {
      elapsed += d;
      setT(() => {
        cur += 1;
        setBid(cur);
      }, elapsed);
    });
    setT(() => setPhase("sold"), elapsed + 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.slide}>
      <View style={styles.slideHead}>
        <Text style={styles.label}>BIDDING BEGINS</Text>
        <Text style={styles.title}>Players bid against each other — raise or pass</Text>
      </View>

      <View style={styles.center}>
        <View style={styles.chip}>
          <Text style={styles.chipName}>{WINNER.name}</Text>
          <Text style={[styles.chipPos, { color: POSITION_COLORS[WINNER.pos] }]}>{WINNER.pos}</Text>
        </View>
      </View>

      <View style={styles.center}>
        <Text style={[styles.bigBid, phase === "sold" && { color: Palette.gold }]}>${phase === "sold" ? FINAL_BID : bid}</Text>
        {phase === "bidding" && <Text style={styles.bidCaption}>CURRENT BID</Text>}
      </View>

      {phase === "sold" && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.center}>
          <Text style={styles.sold}>SOLD! ${FINAL_BID}</Text>
          <Text style={styles.rosterCaption}>{WINNER.name} added to your roster</Text>
          <MiniRoster filledPos="PG" />
          <NextButton label="Almost there →" onPress={onNext} />
        </Animated.View>
      )}
    </View>
  );
}

function CTASlide({ onDone }: { onDone: () => void }) {
  return (
    <View style={styles.slide}>
      <View style={styles.slideHead}>
        <Text style={styles.label}>YOUR GOAL</Text>
        <Text style={styles.goalTitle}>Build the best roster</Text>
        <Text style={styles.goalBudget}>under a $20 budget</Text>
      </View>

      <MiniRoster filledPos={null} />

      <View style={styles.center}>
        <Text style={styles.ctaSub}>Draft PG · SG · SF · PF · C — outbid your opponent or pass and let them overpay</Text>
        <NextButton label="Let's Play →" onPress={onDone} primary />
      </View>
    </View>
  );
}

function NextButton({ label, onPress, primary }: { label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.nextBtn, primary && styles.nextBtnPrimary]}>
      <Text style={styles.nextBtnText}>{label}</Text>
    </Pressable>
  );
}

export function OnboardingSlides({ onDone }: { onDone: () => void }) {
  const [slide, setSlide] = useState(0);
  const goNext = () => (slide >= 2 ? onDone() : setSlide((s) => s + 1));

  return (
    <View>
      <Pressable onPress={onDone} style={styles.skip} hitSlop={8}>
        <Text style={styles.skipText}>skip</Text>
      </Pressable>

      <View style={styles.dots}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.dot, i === slide ? styles.dotActive : null]} />
        ))}
      </View>

      <Animated.View key={slide} entering={FadeInUp.duration(300)} style={styles.panel}>
        {slide === 0 && <SlotMachineSlide onNext={goNext} />}
        {slide === 1 && <AuctionSlide onNext={goNext} />}
        {slide === 2 && <CTASlide onDone={onDone} />}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  skip: { position: "absolute", top: -34, right: 0, paddingVertical: 6, paddingHorizontal: 10, opacity: 0.9, zIndex: 2 },
  skipText: { fontSize: 15, fontWeight: "600", color: Palette.whiteDim, letterSpacing: 0.5 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 5, marginBottom: Spacing.three },
  dot: { height: 4, width: 6, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.14)" },
  dotActive: { width: 20, backgroundColor: Palette.gold },
  panel: {
    backgroundColor: Palette.courtSurface,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.xl,
    overflow: "hidden",
  },
  slide: { padding: Spacing.four, gap: Spacing.four, minHeight: 320 },
  slideHead: { alignItems: "center", gap: Spacing.two },
  label: { fontSize: 10, fontWeight: "600", letterSpacing: 1, color: Palette.whiteDim },
  title: { fontSize: 14, color: Palette.whiteDim, lineHeight: 20, textAlign: "center" },
  center: { alignItems: "center", gap: Spacing.three },

  drum: {
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: Radius.lg,
    paddingVertical: Spacing.five,
    alignItems: "center",
    gap: Spacing.one + 2,
  },
  drumDone: { borderColor: Palette.gold },
  drumName: { fontFamily: Fonts.display, fontWeight: "700", fontSize: 22, color: Palette.white, letterSpacing: -0.5 },
  drumMeta: { fontSize: 11, fontWeight: "600", letterSpacing: 0.5 },
  selected: { color: Palette.gold, fontFamily: Fonts.display, fontSize: 11, letterSpacing: 1 },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingVertical: Spacing.one + 1,
    paddingHorizontal: Spacing.three,
    backgroundColor: Palette.courtMid,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 20,
  },
  chipName: { fontFamily: Fonts.display, fontWeight: "700", fontSize: 14, color: Palette.white },
  chipPos: { fontSize: 11, fontWeight: "600" },
  bigBid: { fontFamily: Fonts.display, fontSize: 72, fontWeight: "800", color: Palette.white, letterSpacing: -3 },
  bidCaption: { fontSize: 11, color: Palette.whiteDim, letterSpacing: 0.5 },
  sold: { fontFamily: Fonts.display, fontSize: 20, fontWeight: "800", color: Palette.gold, letterSpacing: 0.8 },
  rosterCaption: { fontSize: 11, color: Palette.whiteDim },

  goalTitle: { fontFamily: Fonts.display, fontSize: 28, fontWeight: "800", color: Palette.white, letterSpacing: -0.6 },
  goalBudget: { fontFamily: Fonts.display, fontSize: 20, fontWeight: "700", color: Palette.accent },
  ctaSub: { fontSize: 12, color: Palette.whiteDim, lineHeight: 19, textAlign: "center" },

  nextBtn: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
    backgroundColor: Palette.gold,
    borderRadius: Radius.md,
  },
  nextBtnPrimary: { paddingVertical: Spacing.three + 2, paddingHorizontal: Spacing.six / 2 + 12 },
  nextBtnText: { color: "#fff", fontFamily: Fonts.display, fontSize: 14, fontWeight: "600", letterSpacing: 0.5 },

  // Mini roster
  miniRoster: { borderWidth: 1, borderColor: Palette.border, borderRadius: Radius.lg, overflow: "hidden" },
  miniRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two + 2, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two + 1 },
  miniRowBorder: { borderBottomWidth: 1, borderBottomColor: Palette.border },
  miniPos: { fontFamily: Fonts.display, fontSize: 10, fontWeight: "700", letterSpacing: 0.5, width: 24 },
  miniName: { fontFamily: Fonts.display, fontWeight: "700", fontSize: 13, color: Palette.white, flex: 1 },
  miniBid: { fontFamily: Fonts.display, fontSize: 13, fontWeight: "700", color: Palette.gold },
  miniEmpty: { fontSize: 12, color: "rgba(200,204,224,0.28)", flex: 1 },
});
