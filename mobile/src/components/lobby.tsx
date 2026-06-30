import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { createGame, createLocalGame, joinGame, saveSession } from "@/lib/api";
import type { GameMode } from "@/lib/game";
import { GavelIcon } from "@/components/gavel-icon";
import { OnboardingSlides } from "@/components/onboarding-slides";
import { Palette, Fonts, Spacing, Radius } from "@/constants/theme";

type Tab = "create" | "join" | "local";
const ONBOARDING_KEY = "hb_seen_onboarding";

/**
 * The interactive lobby (create / join / same-device) — extracted from the
 * index route so it can be rendered both behind the arcade cabinet's screen
 * (non-interactive preview) and full-screen after the zoom-in. Renders on a
 * transparent background; the caller owns whatever sits behind it.
 */
export function Lobby() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<Tab>("create");
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [localP1Name, setLocalP1Name] = useState("");
  const [localP2Name, setLocalP2Name] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [gameMode, setGameMode] = useState<GameMode>("nba");
  const [showSlides, setShowSlides] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((v) => setShowSlides(!v));
  }, []);

  async function dismissSlides() {
    await AsyncStorage.setItem(ONBOARDING_KEY, "1");
    setShowSlides(false);
  }

  async function handleCreate() {
    setLoading(true);
    setError("");
    try {
      const p1 = name.trim() || "Player 1";
      const { gameId, token } = await createGame(p1, gameMode);
      await saveSession(gameId, { role: "p1", token, playerName: p1 });
      router.push(`/game/${gameId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create game");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!joinCode.trim()) {
      setError("Enter a join code");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const p2 = name.trim() || "Player 2";
      const { gameId, token } = await joinGame(joinCode.trim(), p2);
      await saveSession(gameId, { role: "p2", token, playerName: p2 });
      router.push(`/game/${gameId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to join");
    } finally {
      setLoading(false);
    }
  }

  async function handleLocal() {
    setLoading(true);
    setError("");
    try {
      const p1 = localP1Name.trim() || "Player 1";
      const p2 = localP2Name.trim() || "Player 2";
      const { gameId, token } = await createLocalGame(p1, p2, gameMode);
      await saveSession(gameId, { mode: "local", role: "local", token, playerName: p1, player2Name: p2 });
      router.push(`/game/${gameId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start local game");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.five, paddingBottom: insets.bottom + Spacing.five },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.wrap}>
          {/* Wordmark */}
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <GavelIcon size={28} />
              <Text style={styles.logoText}>Highest Bid</Text>
            </View>
            <View style={styles.taglineRow}>
              <Text style={styles.tagline}>NBA Draft Auction</Text>
              <Pressable style={styles.howToBtn} onPress={() => setShowSlides(true)}>
                <Text style={styles.howToText}>How to play</Text>
              </Pressable>
            </View>
          </View>

          {showSlides ? (
            <OnboardingSlides onDone={dismissSlides} />
          ) : (
            <View style={styles.card}>
              {/* Mode picker */}
              <View style={styles.modeRow}>
                {(["nba", "cbb"] as GameMode[]).map((m) => {
                  const active = gameMode === m;
                  return (
                    <Pressable
                      key={m}
                      onPress={() => setGameMode(m)}
                      style={[
                        styles.modeBtn,
                        {
                          backgroundColor: active ? (m === "nba" ? Palette.gold : Palette.accent) : Palette.courtMid,
                        },
                      ]}
                    >
                      <Text style={[styles.modeText, { color: active ? "#fff" : Palette.whiteDim }]}>
                        {m === "nba" ? "🏀 NBA" : "🎓 College"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Tabs */}
              <View style={styles.tabs}>
                {(
                  [
                    ["create", "Online host"],
                    ["join", "Join code"],
                    ["local", "Same computer"],
                  ] as [Tab, string][]
                ).map(([t, label]) => (
                  <Pressable
                    key={t}
                    onPress={() => {
                      setTab(t);
                      setError("");
                    }}
                    style={[styles.tab, tab === t && styles.tabActive]}
                  >
                    <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{label}</Text>
                  </Pressable>
                ))}
              </View>

              {tab === "create" && (
                <View style={styles.form}>
                  <Text style={styles.fieldLabel}>Your name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Player 1"
                    placeholderTextColor={Palette.whiteDim}
                    value={name}
                    onChangeText={setName}
                    maxLength={20}
                  />
                  {!!error && <Text style={styles.errMsg}>{error}</Text>}
                  <PrimaryButton label="Create game" loadingLabel="Creating…" loading={loading} onPress={handleCreate} />
                </View>
              )}

              {tab === "join" && (
                <View style={styles.form}>
                  <Text style={styles.fieldLabel}>Join code</Text>
                  <TextInput
                    style={[styles.input, styles.codeInput]}
                    placeholder="ABCXYZ"
                    placeholderTextColor={Palette.borderStrong}
                    value={joinCode}
                    onChangeText={(t) => setJoinCode(t.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6))}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={6}
                  />
                  <Text style={styles.fieldLabel}>Your name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Player 2"
                    placeholderTextColor={Palette.whiteDim}
                    value={name}
                    onChangeText={setName}
                    maxLength={20}
                  />
                  {!!error && <Text style={styles.errMsg}>{error}</Text>}
                  <PrimaryButton
                    label="Join game"
                    loadingLabel="Joining…"
                    loading={loading}
                    onPress={handleJoin}
                    color={Palette.accent}
                  />
                </View>
              )}

              {tab === "local" && (
                <View style={styles.form}>
                  <Text style={styles.fieldLabel}>Player 1 name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Player 1"
                    placeholderTextColor={Palette.whiteDim}
                    value={localP1Name}
                    onChangeText={setLocalP1Name}
                    maxLength={20}
                  />
                  <Text style={styles.fieldLabel}>Player 2 name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Player 2"
                    placeholderTextColor={Palette.whiteDim}
                    value={localP2Name}
                    onChangeText={setLocalP2Name}
                    maxLength={20}
                  />
                  <Text style={styles.helperText}>
                    Players share one device and pass it between turns.
                  </Text>
                  {!!error && <Text style={styles.errMsg}>{error}</Text>}
                  <PrimaryButton
                    label="Start same-device game"
                    loadingLabel="Starting…"
                    loading={loading}
                    onPress={handleLocal}
                  />
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PrimaryButton({
  label,
  loadingLabel,
  loading,
  onPress,
  color = Palette.gold,
}: {
  label: string;
  loadingLabel: string;
  loading: boolean;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable
      disabled={loading}
      onPress={onPress}
      style={[styles.primaryBtn, { backgroundColor: color, opacity: loading ? 0.7 : 1 }]}
    >
      {loading ? (
        <View style={styles.btnLoading}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.primaryBtnText}>{loadingLabel}</Text>
        </View>
      ) : (
        <Text style={styles.primaryBtnText}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: "center", paddingHorizontal: Spacing.four },
  wrap: { width: "100%", maxWidth: 480, alignSelf: "center", gap: Spacing.four },

  header: { alignItems: "center", gap: Spacing.two },
  logoRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two + 2 },
  logoText: { fontFamily: Fonts.display, fontSize: 44, fontWeight: "800", color: Palette.white, letterSpacing: -1.3 },
  taglineRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two + 2 },
  tagline: { fontSize: 18, color: Palette.whiteDim, fontWeight: "500" },
  howToBtn: { borderWidth: 1, borderColor: Palette.border, borderRadius: 20, paddingHorizontal: Spacing.three, paddingVertical: 3, opacity: 0.75 },
  howToText: { fontSize: 11, color: Palette.whiteDim, letterSpacing: 0.4 },

  card: {
    backgroundColor: Palette.courtSurface,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.xl,
    padding: Spacing.four,
  },
  modeRow: { flexDirection: "row", gap: Spacing.two, marginBottom: Spacing.three },
  modeBtn: { flex: 1, paddingVertical: Spacing.two + 2, borderRadius: Radius.md, alignItems: "center" },
  modeText: { fontFamily: Fonts.display, fontSize: 13, fontWeight: "700", letterSpacing: 0.5 },

  tabs: { flexDirection: "row", gap: 2, marginBottom: Spacing.four, backgroundColor: Palette.courtMid, borderRadius: Radius.md, padding: 3 },
  tab: { flex: 1, paddingVertical: Spacing.two - 1, borderRadius: Radius.sm, alignItems: "center" },
  tabActive: { backgroundColor: Palette.courtSurface },
  tabText: { fontFamily: Fonts.display, fontSize: 12, fontWeight: "600", color: Palette.whiteDim },
  tabTextActive: { color: Palette.white },

  form: { gap: Spacing.two },
  fieldLabel: { fontSize: 12, fontWeight: "500", color: Palette.whiteDim, marginBottom: 2 },
  input: {
    backgroundColor: Palette.courtMid,
    borderWidth: 1,
    borderColor: Palette.borderStrong,
    borderRadius: 7,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    color: Palette.white,
    fontSize: 15,
    fontWeight: "500",
  },
  codeInput: { fontFamily: Fonts.display, fontSize: 22, fontWeight: "700", letterSpacing: 6, color: Palette.accent, textAlign: "center" },
  helperText: { fontSize: 12, color: Palette.whiteDim, lineHeight: 18, marginTop: 2 },
  errMsg: {
    fontSize: 12,
    color: Palette.danger,
    backgroundColor: "rgba(248,113,113,0.08)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.2)",
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    overflow: "hidden",
  },
  primaryBtn: { marginTop: Spacing.one, paddingVertical: Spacing.three, borderRadius: 7, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontFamily: Fonts.display, fontSize: 15, fontWeight: "600", letterSpacing: 0.3 },
  btnLoading: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
});
