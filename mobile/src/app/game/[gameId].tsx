import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInUp } from "react-native-reanimated";
import * as Clipboard from "expo-clipboard";

import type { GameState } from "@/lib/game";
import { fmt$, getMaxBidForPlayer, getPlacementOptions, toC, STARTING_BUDGET } from "@/lib/game";
import type { Position } from "@/lib/players";
import { useGame } from "@/hooks/use-game";
import { PlayerCard } from "@/components/player-card";
import { RosterPanel } from "@/components/roster-panel";
import { GavelIcon } from "@/components/gavel-icon";
import { Palette, Fonts, Spacing, Radius, playerColor } from "@/constants/theme";

export default function GameScreen() {
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { session, sessionLoading, poll, raise, pass, assign, advance } = useGame(gameId);

  const [bidInput, setBidInput] = useState("");
  const [actionError, setActionError] = useState("");
  const [rosterOpen, setRosterOpen] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // New round → reset inputs (adjust state during render when the round changes,
  // the React-recommended alternative to a reset effect).
  const round = poll?.state.round;
  const [prevRound, setPrevRound] = useState(round);
  if (round !== prevRound) {
    setPrevRound(round);
    setBidInput("");
    setActionError("");
  }

  // No session for this game → back to lobby.
  useEffect(() => {
    if (!sessionLoading && !session) router.replace("/");
  }, [sessionLoading, session, router]);

  // Game finished → results.
  useEffect(() => {
    if (poll?.state.phase === "complete") router.replace(`/results/${gameId}`);
  }, [poll?.state.phase, gameId, router]);

  if (!session || !poll) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Palette.gold} />
        <Text style={styles.connecting}>Connecting…</Text>
      </View>
    );
  }

  const gs: GameState = poll.state;
  const isLocal = session.mode === "local";
  const myNum: 1 | 2 = isLocal ? gs.biddingTurn : poll.myRole ?? (session.role === "p1" ? 1 : 2);
  const myColor = playerColor(myNum);
  const isMyTurn = gs.phase === "bidding" && (isLocal || gs.biddingTurn === myNum);
  const myBudget = myNum === 1 ? gs.p1Budget : gs.p2Budget;
  const lr = gs.lastResult;
  const minBid = gs.currentBid + 1;
  const maxBid = gs.phase === "bidding" ? getMaxBidForPlayer(gs, myNum) : 0;
  const canRaise = maxBid > gs.currentBid;
  const currentTurnName = gs.biddingTurn === 1 ? gs.p1Name : gs.p2Name;
  const revealWinner = lr?.winner ?? null;
  const canChooseSlot =
    gs.phase === "reveal" && !!revealWinner && !lr?.assignedSlot && (isLocal || revealWinner === myNum);
  const waitingForSlotChoice =
    gs.phase === "reveal" && !!revealWinner && !lr?.assignedSlot && !canChooseSlot;
  const winningBid = lr?.winner === 1 ? lr.bid1 : lr?.winner === 2 ? lr.bid2 : 0;
  const placementOptions =
    gs.phase === "reveal" && lr?.winner && !lr.assignedSlot
      ? getPlacementOptions(lr.winner === 1 ? gs.roster1 : gs.roster2, lr.player, winningBid)
      : [];

  const passHint =
    gs.currentLeader === myNum
      ? "Pass — let opponent respond"
      : gs.currentLeader !== null
        ? `Pass — ${gs.currentLeader === 1 ? gs.p1Name : gs.p2Name} wins at ${fmt$(gs.currentBid)}`
        : gs.firstPassUsed
          ? "Pass — player goes to no one"
          : "Pass — give opponent a chance";

  const actionPending = raise.isPending || pass.isPending || assign.isPending;

  function handleRaise() {
    const cents = toC(bidInput || "0");
    if (cents <= gs.currentBid) {
      setActionError(`Must exceed ${fmt$(gs.currentBid)}`);
      return;
    }
    if (cents > maxBid) {
      setActionError(`Max bid is ${fmt$(maxBid)}`);
      return;
    }
    setActionError("");
    raise.mutate(cents, {
      onSuccess: () => setBidInput(""),
      onError: (e) => setActionError(e instanceof Error ? e.message : "Failed"),
    });
  }

  function handlePass() {
    setActionError("");
    pass.mutate(undefined, {
      onError: (e) => setActionError(e instanceof Error ? e.message : "Failed"),
    });
  }

  function handleAssign(position: Position) {
    setActionError("");
    assign.mutate(position, {
      onError: (e) => setActionError(e instanceof Error ? e.message : "Failed"),
    });
  }

  async function copyCode() {
    await Clipboard.setStringAsync(poll!.joinCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <View style={styles.topLeft}>
          {gs.phase === "waiting" ? (
            <Text style={styles.roundLabel}>WAITING ROOM</Text>
          ) : (
            <>
              <Text style={styles.roundLabel}>ROUND {gs.round}</Text>
              <View style={styles.roundDot} />
              <Text style={[styles.turnText, isMyTurn ? { color: myColor } : null]}>
                {gs.phase === "bidding"
                  ? isLocal
                    ? `${currentTurnName}'s turn`
                    : isMyTurn
                      ? "Your turn"
                      : "Opponent's turn"
                  : gs.phase === "reveal"
                    ? "Reveal"
                    : ""}
              </Text>
            </>
          )}
        </View>
        <View style={styles.topRight}>
          {gs.phase !== "waiting" && (
            <View style={styles.budgetRow}>
              <BudgetChip name={gs.p1Name} budget={gs.p1Budget} color={Palette.gold} isMe={!isLocal && myNum === 1} />
              <Text style={styles.dot}>·</Text>
              <BudgetChip name={gs.p2Name} budget={gs.p2Budget} color={Palette.accent} isMe={!isLocal && myNum === 2} />
            </View>
          )}
          <Pressable style={styles.rosterToggle} onPress={() => setRosterOpen(true)}>
            <Text style={styles.rosterToggleText}>Roster</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* WAITING */}
        {gs.phase === "waiting" && (
          <Animated.View entering={FadeInUp.duration(300)} style={styles.waitingCard}>
            <Text style={styles.waitingLabel}>SHARE THIS CODE</Text>
            <Pressable style={styles.joinCodeBox} onPress={copyCode}>
              <Text style={styles.joinCodeText}>{poll.joinCode}</Text>
              <Text style={[styles.copyHint, codeCopied ? { color: Palette.gold } : null]}>
                {codeCopied ? "Copied" : "Tap to copy"}
              </Text>
            </Pressable>
            <Text style={styles.waitingHelp}>
              Your opponent opens the app, taps <Text style={styles.bold}>Join with code</Text>, and the game starts
              automatically.
            </Text>
          </Animated.View>
        )}

        {/* BIDDING */}
        {gs.phase === "bidding" && gs.currentPlayer && (
          <View style={styles.stack}>
            <PlayerCard player={gs.currentPlayer} animKey={gs.round} />

            {/* Current bid status */}
            <View style={styles.statusBar}>
              {gs.currentLeader ? (
                <View style={styles.bidLine}>
                  <Text style={styles.currentBidAmount}>{fmt$(gs.currentBid)}</Text>
                  <Text style={styles.bidLedBy}>
                    led by{" "}
                    {!isLocal && gs.currentLeader === myNum
                      ? "you"
                      : gs.currentLeader === 1
                        ? gs.p1Name
                        : gs.p2Name}
                    {gs.firstPassUsed ? " · opponent passed" : ""}
                  </Text>
                </View>
              ) : (
                <View style={styles.bidLineRow}>
                  <Text style={styles.noBids}>No bids yet</Text>
                  {gs.firstPassUsed && <Text style={styles.pill}>Opponent passed</Text>}
                </View>
              )}
            </View>

            {/* My turn panel */}
            {isMyTurn && (
              <View style={styles.panel}>
                <View style={[styles.panelHeader, { borderLeftColor: myColor }]}>
                  <Text style={styles.panelTitle}>{isLocal ? `${currentTurnName}'s turn` : "Your turn"}</Text>
                  <Text style={styles.panelSub}>
                    Budget: {fmt$(myBudget)} · Max bid: {fmt$(maxBid)}
                    {gs.currentBid > 0 ? ` · min raise ${fmt$(minBid)}` : ""}
                  </Text>
                </View>

                {canRaise ? (
                  <View style={styles.bidRow}>
                    <Text style={[styles.dollar, { color: myColor }]}>$</Text>
                    <TextInput
                      style={[styles.bidInput, { color: myColor }]}
                      keyboardType="number-pad"
                      value={bidInput}
                      onChangeText={(t) => {
                        setBidInput(t.replace(/[^0-9]/g, ""));
                        setActionError("");
                      }}
                      placeholder={`${minBid}`}
                      placeholderTextColor={Palette.borderStrong}
                      maxLength={3}
                    />
                  </View>
                ) : (
                  <Text style={styles.mustPass}>
                    You must keep at least $1 for each remaining open slot, so you have to pass.
                  </Text>
                )}

                {!!actionError && <Text style={styles.errMsg}>{actionError}</Text>}

                <View style={styles.actionRow}>
                  {canRaise && (
                    <Pressable
                      disabled={actionPending || !bidInput}
                      onPress={handleRaise}
                      style={[
                        styles.btnRaise,
                        { backgroundColor: myColor, opacity: actionPending || !bidInput ? 0.45 : 1 },
                      ]}
                    >
                      <Text style={styles.btnRaiseText}>Raise bid</Text>
                    </Pressable>
                  )}
                  <Pressable
                    disabled={actionPending}
                    onPress={handlePass}
                    style={[styles.btnPass, { flex: canRaise ? 0 : 1 }]}
                  >
                    <Text style={styles.btnPassText}>Pass</Text>
                  </Pressable>
                </View>
                <Text style={styles.passHint}>{passHint}</Text>
              </View>
            )}

            {/* Waiting on opponent (online) */}
            {!isMyTurn && !isLocal && (
              <View style={styles.waitingTurnPanel}>
                <ActivityIndicator size="small" color={Palette.whiteDim} />
                <View>
                  <Text style={styles.panelTitle}>
                    {gs.biddingTurn === 1 ? gs.p1Name : gs.p2Name} is deciding
                  </Text>
                  <Text style={styles.panelSub}>They can raise or pass</Text>
                </View>
              </View>
            )}

            {/* History */}
            {gs.history.length > 0 && (
              <View style={styles.historyPanel}>
                <Text style={styles.sectionLabel}>RECENT</Text>
                {[...gs.history]
                  .reverse()
                  .slice(0, 3)
                  .map((h) => (
                    <View key={h.id} style={styles.historyRow}>
                      <Text style={styles.historyName}>{h.playerName}</Text>
                      <Text style={styles.dot}>·</Text>
                      {h.winner ? (
                        <Text style={[styles.historyWin, { color: playerColor(h.winner) }]}>
                          {h.winner === 1 ? gs.p1Name : gs.p2Name} — {fmt$(h.winningBid!)}
                        </Text>
                      ) : (
                        <Text style={styles.historyNo}>No winner</Text>
                      )}
                    </View>
                  ))}
              </View>
            )}
          </View>
        )}

        {/* REVEAL */}
        {gs.phase === "reveal" && lr && (
          <View style={styles.stack}>
            <PlayerCard player={lr.player} animKey={`reveal-${gs.round}`} />

            <View style={styles.revealGrid}>
              <RevealSide name={gs.p1Name} bid={lr.bid1} won={lr.winner === 1} color={Palette.gold} isMe={!isLocal && myNum === 1} />
              <Text style={styles.vsLabel}>vs</Text>
              <RevealSide name={gs.p2Name} bid={lr.bid2} won={lr.winner === 2} color={Palette.accent} isMe={!isLocal && myNum === 2} />
            </View>

            <View style={styles.outcomePanel}>
              {lr.winner && lr.assignedSlot ? (
                <Text style={styles.outcomeText}>
                  <Text style={{ color: playerColor(lr.winner), fontFamily: Fonts.display, fontWeight: "700" }}>
                    {lr.winner === 1 ? gs.p1Name : gs.p2Name} wins
                  </Text>
                  <Text style={styles.outcomeSub}>
                    {"  "}
                    {lr.slotFilled
                      ? `${lr.player.name} → ${lr.assignedSlot}${lr.outOfPosition ? ` from ${lr.player.position} (-${lr.penaltyApplied})` : ""} · ${fmt$(lr.winner === 1 ? lr.bid1 : lr.bid2)}`
                      : `No roster slot left for ${lr.player.name}`}
                  </Text>
                </Text>
              ) : lr.winner ? (
                <Text style={[styles.outcomeWinOnly, { color: playerColor(lr.winner) }]}>
                  {lr.winner === 1 ? gs.p1Name : gs.p2Name} wins the auction
                </Text>
              ) : (
                <Text style={styles.outcomeNone}>Both passed — player skipped</Text>
              )}
            </View>

            {canChooseSlot && (
              <View style={styles.slotPicker}>
                <Text style={styles.slotPickerTitle}>Choose a lineup slot</Text>
                <Text style={styles.slotPickerSub}>
                  Pick the position and we&apos;ll place the rest of the lineup around it.
                </Text>
                <View style={styles.slotGrid}>
                  {placementOptions.map((option) => (
                    <Pressable
                      key={option.position}
                      disabled={actionPending}
                      onPress={() => handleAssign(option.position)}
                      style={styles.slotButton}
                    >
                      <Text style={styles.slotPos}>{option.position}</Text>
                      <Text style={[styles.slotOvr, option.overall >= 85 ? { color: Palette.gold } : null]}>
                        {option.overall}
                      </Text>
                      <Text style={styles.slotNote}>
                        {option.outOfPosition ? `-${option.penalty} penalty` : "natural fit"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {!!actionError && <Text style={styles.errMsg}>{actionError}</Text>}
              </View>
            )}

            {waitingForSlotChoice && (
              <View style={styles.waitingTurnPanel}>
                <ActivityIndicator size="small" color={Palette.whiteDim} />
                <View>
                  <Text style={styles.panelTitle}>
                    {lr.winner === 1 ? gs.p1Name : gs.p2Name} is choosing a lineup slot
                  </Text>
                  <Text style={styles.panelSub}>The roster updates as soon as they lock it in</Text>
                </View>
              </View>
            )}

            {(!lr.winner || lr.assignedSlot) && (
              <Pressable
                style={styles.nextBtn}
                disabled={advance.isPending}
                onPress={() => advance.mutate()}
              >
                <Text style={styles.nextBtnText}>Next player</Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>

      {/* Roster drawer */}
      <Modal visible={rosterOpen} animationType="slide" transparent onRequestClose={() => setRosterOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setRosterOpen(false)}>
          {/* Absorbs taps so touching the drawer doesn't close it (RN press events don't bubble). */}
          <Pressable style={[styles.drawer, { paddingTop: insets.top + Spacing.three }]} onPress={() => {}}>
            <View style={styles.drawerHeader}>
              <View style={styles.sideHeader}>
                <GavelIcon size={20} />
                <Text style={styles.logoText}>Highest Bid</Text>
              </View>
              <Pressable style={styles.drawerClose} onPress={() => setRosterOpen(false)}>
                <Text style={styles.drawerCloseText}>Close</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.drawerBody}>
              <Text style={styles.sectionLabel}>ROSTERS</Text>
              <RosterPanel name={gs.p1Name} slots={gs.roster1} budget={gs.p1Budget} num={1} />
              <RosterPanel name={gs.p2Name} slots={gs.roster2} budget={gs.p2Budget} num={2} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function BudgetChip({ name, budget, color, isMe }: { name: string; budget: number; color: string; isMe: boolean }) {
  const pct = budget / STARTING_BUDGET;
  return (
    <View style={styles.chip}>
      <Text style={styles.chipName} numberOfLines={1}>
        {name}
        {isMe ? " ·you" : ""}
      </Text>
      <Text style={[styles.chipAmount, { color: pct > 0.2 ? color : Palette.danger }]}>{fmt$(budget)}</Text>
    </View>
  );
}

function RevealSide({
  name,
  bid,
  won,
  color,
  isMe,
}: {
  name: string;
  bid: number;
  won: boolean;
  color: string;
  isMe: boolean;
}) {
  return (
    <View
      style={[
        styles.revealSide,
        { borderColor: won ? `${color}60` : Palette.border, backgroundColor: won ? `${color}10` : "transparent" },
      ]}
    >
      {won && <Text style={[styles.revealWinnerTag, { color }]}>WINNER</Text>}
      <Text style={styles.revealName} numberOfLines={1}>
        {name}
        {isMe ? " (you)" : ""}
      </Text>
      {bid > 0 ? (
        <Text style={[styles.revealBid, { color }]}>{fmt$(bid)}</Text>
      ) : (
        <Text style={styles.revealPassed}>Passed</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Palette.court },
  center: { flex: 1, alignItems: "center", justifyContent: "center", flexDirection: "row", backgroundColor: Palette.court },
  connecting: { fontSize: 13, color: Palette.whiteDim, marginLeft: 10 },

  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
    gap: Spacing.two,
  },
  topLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.two, flexShrink: 1 },
  roundLabel: { fontFamily: Fonts.display, fontSize: 12, fontWeight: "600", letterSpacing: 0.7, color: Palette.whiteDim },
  roundDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: Palette.borderStrong },
  turnText: { fontSize: 12, color: Palette.whiteDim },
  topRight: { flexDirection: "row", alignItems: "center", gap: Spacing.three },
  budgetRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  dot: { color: Palette.borderStrong, fontSize: 12 },
  rosterToggle: {
    backgroundColor: Palette.courtSurface,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 1,
  },
  rosterToggleText: { fontSize: 12, fontWeight: "500", color: Palette.whiteDim },

  content: { padding: Spacing.four, gap: Spacing.four },
  stack: { gap: Spacing.three },

  // Waiting
  waitingCard: {
    backgroundColor: Palette.courtSurface,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.xl,
    padding: Spacing.five,
    alignItems: "center",
  },
  waitingLabel: { fontSize: 12, fontWeight: "600", color: Palette.whiteDim, letterSpacing: 0.8, marginBottom: Spacing.four },
  joinCodeBox: {
    alignItems: "center",
    gap: Spacing.two,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.five,
    backgroundColor: Palette.courtMid,
    borderWidth: 1,
    borderColor: Palette.borderStrong,
    borderRadius: Radius.lg,
  },
  joinCodeText: { fontFamily: Fonts.display, fontSize: 44, fontWeight: "700", color: Palette.gold, letterSpacing: 8 },
  copyHint: { fontSize: 11, color: Palette.whiteDim },
  waitingHelp: { fontSize: 13, color: Palette.whiteDim, marginTop: Spacing.four, lineHeight: 20, textAlign: "center" },
  bold: { color: Palette.white, fontWeight: "600" },

  // Bidding status
  statusBar: {
    backgroundColor: Palette.courtSurface,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  bidLine: { flexDirection: "row", alignItems: "baseline", gap: Spacing.two, flexWrap: "wrap" },
  bidLineRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  currentBidAmount: { fontFamily: Fonts.display, fontSize: 38, fontWeight: "700", color: Palette.white, letterSpacing: -0.8 },
  bidLedBy: { fontSize: 13, color: Palette.whiteDim },
  noBids: { fontFamily: Fonts.display, fontSize: 16, fontWeight: "600", color: Palette.whiteDim },
  pill: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: Palette.accent,
    backgroundColor: "rgba(0,229,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.2)",
    borderRadius: 100,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    overflow: "hidden",
  },

  // Panels
  panel: {
    backgroundColor: Palette.courtSurface,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.xl,
    padding: Spacing.four,
  },
  panelHeader: { borderLeftWidth: 2, paddingLeft: Spacing.three, marginBottom: Spacing.four },
  panelTitle: { fontFamily: Fonts.display, fontSize: 14, fontWeight: "600", color: Palette.white },
  panelSub: { fontSize: 12, color: Palette.whiteDim, marginTop: 2 },
  bidRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    backgroundColor: Palette.courtMid,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    marginBottom: Spacing.three,
  },
  dollar: { fontFamily: Fonts.display, fontSize: 26, fontWeight: "600" },
  bidInput: { flex: 1, fontFamily: Fonts.display, fontSize: 36, fontWeight: "700", padding: 0 },
  mustPass: { fontSize: 13, color: Palette.danger, marginBottom: Spacing.three },
  errMsg: {
    fontSize: 12,
    color: Palette.danger,
    backgroundColor: "rgba(248,113,113,0.08)",
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one + 2,
    marginBottom: Spacing.two,
    overflow: "hidden",
  },
  actionRow: { flexDirection: "row", gap: Spacing.three, marginTop: Spacing.one + 2 },
  btnRaise: { flex: 1, paddingVertical: Spacing.three, borderRadius: Radius.md, alignItems: "center" },
  btnRaiseText: { color: "#fff", fontFamily: Fonts.display, fontSize: 15, fontWeight: "600", letterSpacing: 0.4 },
  btnPass: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPassText: { color: Palette.whiteDim, fontFamily: Fonts.display, fontSize: 15, fontWeight: "500" },
  passHint: { fontSize: 12, color: Palette.whiteDim, marginTop: Spacing.two + 2 },

  waitingTurnPanel: {
    backgroundColor: Palette.courtSurface,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },

  // History
  historyPanel: {
    backgroundColor: Palette.courtSurface,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  sectionLabel: { fontSize: 10, fontWeight: "600", letterSpacing: 1, color: Palette.whiteDim },
  historyRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two, flexWrap: "wrap" },
  historyName: { fontFamily: Fonts.display, fontSize: 14, fontWeight: "600", color: Palette.white },
  historyWin: { fontSize: 13, fontWeight: "500" },
  historyNo: { fontSize: 13, color: Palette.whiteDim },

  // Reveal
  revealGrid: { flexDirection: "row", alignItems: "center", gap: Spacing.two + 2 },
  vsLabel: { fontFamily: Fonts.display, fontSize: 12, fontWeight: "600", color: Palette.whiteDim },
  revealSide: { flex: 1, borderWidth: 1, borderRadius: Radius.lg, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, alignItems: "center" },
  revealWinnerTag: { fontSize: 10, fontWeight: "600", letterSpacing: 0.8, marginBottom: Spacing.one + 2 },
  revealName: { fontSize: 11, color: Palette.whiteDim, marginBottom: Spacing.one + 2 },
  revealBid: { fontFamily: Fonts.display, fontSize: 28, fontWeight: "700" },
  revealPassed: { fontFamily: Fonts.display, fontSize: 16, fontWeight: "500", color: Palette.whiteDim },

  outcomePanel: {
    backgroundColor: Palette.courtSurface,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  outcomeText: { fontSize: 14 },
  outcomeSub: { fontSize: 12, color: Palette.whiteDim },
  outcomeWinOnly: { fontFamily: Fonts.display, fontSize: 18, fontWeight: "600" },
  outcomeNone: { fontFamily: Fonts.display, fontSize: 18, fontWeight: "600", color: Palette.whiteDim },

  slotPicker: {
    backgroundColor: Palette.courtSurface,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.two + 2,
  },
  slotPickerTitle: { fontFamily: Fonts.display, fontSize: 15, fontWeight: "600", color: Palette.white },
  slotPickerSub: { fontSize: 12, color: Palette.whiteDim },
  slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two + 2 },
  slotButton: {
    flexGrow: 1,
    flexBasis: "30%",
    backgroundColor: Palette.courtMid,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two + 2,
    gap: Spacing.one + 2,
  },
  slotPos: { fontFamily: Fonts.display, fontSize: 15, fontWeight: "700", color: Palette.white },
  slotOvr: { fontFamily: Fonts.display, fontSize: 22, fontWeight: "700", color: Palette.white },
  slotNote: { fontSize: 11, color: Palette.whiteDim },

  nextBtn: {
    alignSelf: "center",
    backgroundColor: Palette.courtSurface,
    borderWidth: 1,
    borderColor: Palette.borderStrong,
    borderRadius: Radius.md,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
  },
  nextBtnText: { color: Palette.white, fontFamily: Fonts.display, fontSize: 13, fontWeight: "600", letterSpacing: 0.4 },

  // Budget chip
  chip: { alignItems: "center" },
  chipName: { fontSize: 10, color: Palette.whiteDim, fontWeight: "500", maxWidth: 80 },
  chipAmount: { fontFamily: Fonts.display, fontSize: 14, fontWeight: "700" },

  // Drawer
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", flexDirection: "row" },
  drawer: { width: "86%", maxWidth: 340, backgroundColor: Palette.courtMid, paddingHorizontal: Spacing.three },
  drawerHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.three },
  sideHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  logoText: { fontFamily: Fonts.display, fontSize: 14, fontWeight: "700", color: Palette.white },
  drawerClose: { borderWidth: 1, borderColor: Palette.border, borderRadius: Radius.sm, paddingHorizontal: Spacing.three, paddingVertical: Spacing.one + 2 },
  drawerCloseText: { fontSize: 12, color: Palette.whiteDim },
  drawerBody: { gap: Spacing.three, paddingBottom: Spacing.five },
});
