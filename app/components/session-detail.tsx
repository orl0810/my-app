import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSessionContext } from "@/src/store/SessionContext";
import {
  clearSessionProgress,
  getProgress,
  saveProgress,
  type SessionProgress,
} from "@/src/utils/sessions";

import {
  exercisesFromApi,
  getRawSessionExercises,
} from "@/src/utils/session-exercises";

import { PaywallModal } from "@/src/components/PaywallModal";
import { usePaywall } from "@/src/hooks/usePaywall";

import { ExerciseCard, type Exercise } from "./exercise-card";
import { SessionCompleteModal } from "./session-complete-modal";
import { type TrainingSession } from "./session-card";

const POST_SAVE_PAYWALL_DELAY_MS = 2500;

type TabKey = "exercises" | "objectives" | "equipment";

function applyStoredProgress(
  base: Exercise[],
  p: SessionProgress
): Exercise[] {
  if (base.length === 0) return base;

  let ids: string[] = [];
  const raw = p.completed_exercise_ids;
  if (typeof raw === "string" && raw.length > 0) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        ids = parsed.filter((x): x is string => typeof x === "string");
      }
    } catch {
      /* ignore */
    }
  }

  if (ids.length > 0) {
    const set = new Set(ids);
    return base.map((ex) => ({ ...ex, completed: set.has(ex.id) }));
  }

  const n = base.length;
  const secs = p.last_position_seconds;
  if (
    typeof secs === "number" &&
    Number.isFinite(secs) &&
    secs >= 0 &&
    secs <= n &&
    secs === Math.floor(secs)
  ) {
    const k = secs;
    return base.map((ex, i) => ({ ...ex, completed: i < k }));
  }

  const k = Math.min(
    n,
    Math.max(0, Math.round((p.progress_percent / 100) * n))
  );
  return base.map((ex, i) => ({ ...ex, completed: i < k }));
}

const progressLayout = StyleSheet.create({
  progressTrack: {
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
});

const sessionDetailPalette = {
  light: {
    screenBg: "#F9FAFB",
    textPrimary: "#111827",
    textSecondary: "#4B5563",
    textMuted: "#6B7280",
    textTertiary: "#374151",
    primary: "#2563EB",
    primaryButtonText: "#FFFFFF",
    headerBg: "#FFFFFF",
    border: "#E5E7EB",
    favoriteBg: "#F3F4F6",
    favoriteInactive: "#6B7280",
    favoriteActive: "#DC2626",
    cardBg: "#FFFFFF",
    badgeBg: "#F9FAFB",
    badgeBorder: "#D1D5DB",
    progressCardBg: "#EFF6FF",
    progressCardBorder: "#BFDBFE",
    progressTrack: "#DBEAFE",
    progressFill: "#2563EB",
    tabInactive: "#E5E7EB",
    tabActive: "#111827",
    tabText: "#374151",
    tabTextActive: "#FFFFFF",
    objectiveIndexBg: "#DBEAFE",
    objectiveIndexText: "#2563EB",
    equipmentCheck: "#16A34A",
    equipmentItemBg: "#F9FAFB",
    errorIcon: "#9CA3AF",
    shadowOpacityCard: 0.06,
    shadowOpacityPanel: 0.04,
  },
  dark: {
    screenBg: "#0d0d0d",
    textPrimary: "#ffffff",
    textSecondary: "#a3a3a3",
    textMuted: "#9ca3af",
    textTertiary: "#d4d4d4",
    primary: "#60a5fa",
    primaryButtonText: "#FFFFFF",
    headerBg: "#1f1f1f",
    border: "#2e2e2e",
    favoriteBg: "#262626",
    favoriteInactive: "#a3a3a3",
    favoriteActive: "#f87171",
    cardBg: "#1f1f1f",
    badgeBg: "#262626",
    badgeBorder: "#404040",
    progressCardBg: "#0f172a",
    progressCardBorder: "#1e3a5f",
    progressTrack: "#1e3a5f",
    progressFill: "#3b82f6",
    tabInactive: "#262626",
    tabActive: "#3b82f6",
    tabText: "#d4d4d4",
    tabTextActive: "#ffffff",
    objectiveIndexBg: "#1e3a5f",
    objectiveIndexText: "#60a5fa",
    equipmentCheck: "#4ade80",
    equipmentItemBg: "#262626",
    errorIcon: "#737373",
    shadowOpacityCard: 0.25,
    shadowOpacityPanel: 0.2,
  },
} as const;

type SessionDetailPalette =
  (typeof sessionDetailPalette)["light"] | (typeof sessionDetailPalette)["dark"];

function createSessionDetailStyles(p: SessionDetailPalette) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: p.screenBg,
    },
    safeNotFound: {
      flex: 1,
      backgroundColor: p.screenBg,
      justifyContent: "center",
      alignItems: "center",
    },
    notFoundInner: {
      alignItems: "center",
      paddingHorizontal: 24,
      gap: 12,
    },
    notFoundTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: p.textPrimary,
      marginBottom: 8,
    },
    primaryButton: {
      marginTop: 8,
      backgroundColor: p.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
    },
    primaryButtonText: {
      color: p.primaryButtonText,
      fontWeight: "700",
      fontSize: 16,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: p.headerBg,
      borderBottomWidth: 1,
      borderBottomColor: p.border,
    },
    headerBack: {
      padding: 8,
      marginLeft: -8,
    },
    headerTitle: {
      flex: 1,
      minWidth: 0,
      fontSize: 18,
      fontWeight: "700",
      color: p.textPrimary,
    },
    headerFavorite: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: p.favoriteBg,
      alignItems: "center",
      justifyContent: "center",
      marginRight: -4,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 24,
      paddingBottom: 32,
      maxWidth: 1120,
      width: "100%",
      alignSelf: "center",
    },
    infoCard: {
      backgroundColor: p.cardBg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: p.border,
      padding: 24,
      marginBottom: 24,
      gap: 20,
      shadowColor: "#000",
      shadowOpacity: p.shadowOpacityCard,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
    infoCardWide: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    infoMain: {
      flex: 1,
      minWidth: 0,
    },
    badgeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 16,
    },
    badge: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 999,
      borderWidth: 1,
    },
    badgeNeutral: {
      backgroundColor: p.badgeBg,
      borderColor: p.badgeBorder,
    },
    badgeTextNeutral: {
      fontSize: 12,
      fontWeight: "600",
      color: p.textTertiary,
    },
    description: {
      fontSize: 15,
      color: p.textSecondary,
      lineHeight: 22,
      marginBottom: 20,
    },
    metaGrid: {
      gap: 12,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    metaText: {
      fontSize: 14,
      color: p.textSecondary,
      flex: 1,
    },
    progressCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: p.progressCardBorder,
      backgroundColor: p.progressCardBg,
      padding: 20,
    },
    progressCardWide: {
      width: 300,
      flexShrink: 0,
    },
    progressHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 16,
    },
    progressTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: p.textPrimary,
    },
    progressCounts: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    progressFraction: {
      fontSize: 28,
      fontWeight: "800",
      color: p.textPrimary,
    },
    progressSub: {
      fontSize: 14,
      color: p.textMuted,
    },
    progressHint: {
      fontSize: 14,
      color: p.textSecondary,
    },
    tabsWrap: {
      gap: 16,
    },
    tabList: {
      flexDirection: "row",
      gap: 8,
      paddingBottom: 4,
    },
    tabTrigger: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 999,
      backgroundColor: p.tabInactive,
    },
    tabTriggerActive: {
      backgroundColor: p.tabActive,
    },
    tabTriggerText: {
      fontSize: 14,
      fontWeight: "600",
      color: p.tabText,
    },
    tabTriggerTextActive: {
      color: p.tabTextActive,
    },
    tabPanel: {
      gap: 16,
    },
    panelCard: {
      backgroundColor: p.cardBg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: p.border,
      padding: 24,
      shadowColor: "#000",
      shadowOpacity: p.shadowOpacityPanel,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 1 },
      elevation: 2,
    },
    panelHeadingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 16,
    },
    panelTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: p.textPrimary,
    },
    objectiveRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      marginBottom: 12,
    },
    objectiveIndex: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: p.objectiveIndexBg,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
    },
    objectiveIndexText: {
      fontSize: 12,
      fontWeight: "700",
      color: p.objectiveIndexText,
    },
    objectiveText: {
      flex: 1,
      fontSize: 15,
      color: p.textTertiary,
      lineHeight: 22,
    },
    equipmentTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: p.textPrimary,
      marginBottom: 16,
    },
    equipmentGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    equipmentItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 14,
      backgroundColor: p.equipmentItemBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: p.border,
      minWidth: "45%",
      flexGrow: 1,
    },
    equipmentText: {
      fontSize: 15,
      color: p.textTertiary,
      flex: 1,
    },
  });
}

function ProgressBar({
  value,
  trackColor,
  fillColor,
}: {
  value: number;
  trackColor: string;
  fillColor: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <View style={[progressLayout.progressTrack, { backgroundColor: trackColor }]}>
      <View
        style={[
          progressLayout.progressFill,
          { backgroundColor: fillColor, width: `${clamped}%` },
        ]}
      />
    </View>
  );
}

export function SessionDetail() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const p =
    colorScheme === "dark"
      ? sessionDetailPalette.dark
      : sessionDetailPalette.light;
  const styles = useMemo(() => createSessionDetailStyles(p), [p]);

  const { toggleFavorite, isFavorite, toggleComplete, isCompleted } =
    useSessionContext();
  const params = useLocalSearchParams<{ sessionId: string | string[] }>();
  const sessionId = Array.isArray(params.sessionId)
    ? params.sessionId[0]
    : params.sessionId;

  const [session, setSession] = useState<TrainingSession | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("exercises");
  const [showSessionCompleteModal, setShowSessionCompleteModal] =
    useState(false);
  const {
    paywallVisible,
    currentFeature,
    showPaywall,
    handleUpgradeTap,
    handleDismiss,
  } = usePaywall();
  const postSavePaywallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const isWide = width >= 1024;

  const fetchSession = async () => {
    if (!sessionId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `https://n8n.srv1108930.hstgr.cloud/webhook/tt-sessions?id=${sessionId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch session");

      const data = await response.json();

      const raw = data.session ?? data;
      const sessionData = raw as TrainingSession;
      setSession(sessionData);
      const baseExercises = exercisesFromApi(
        getRawSessionExercises(
          sessionData as unknown as Record<string, unknown>
        )
      );
      let exercisesWithProgress = baseExercises;
      try {
        const p = await getProgress(String(sessionData.id));
        if (p) {
          exercisesWithProgress = applyStoredProgress(baseExercises, p);
        }
      } catch {
        /* keep base exercises */
      }
      setExercises(exercisesWithProgress);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  useEffect(() => {
    setShowSessionCompleteModal(false);
  }, [sessionId]);

  useEffect(() => {
    return () => {
      if (postSavePaywallTimerRef.current) {
        clearTimeout(postSavePaywallTimerRef.current);
        postSavePaywallTimerRef.current = null;
      }
    };
  }, []);

  const prevSessionIdForSyncRef = useRef<string | null>(null);
  const prevAllExercisesDoneRef = useRef<boolean | null>(null);

  /** Keep account “Sessions done” in sync with exercise-level completion */
  useEffect(() => {
    if (!session?.id || exercises.length === 0) {
      prevSessionIdForSyncRef.current =
        session != null && session.id != null ? String(session.id) : null;
      prevAllExercisesDoneRef.current = null;
      return;
    }
    const sid = String(session.id);
    if (prevSessionIdForSyncRef.current !== sid) {
      prevSessionIdForSyncRef.current = sid;
      prevAllExercisesDoneRef.current = null;
    }

    const allDone = exercises.every((ex) => ex.completed);
    const prevDone = prevAllExercisesDoneRef.current;

    if (prevDone === null) {
      prevAllExercisesDoneRef.current = allDone;
      if (allDone && !isCompleted(sid)) toggleComplete(sid);
      else if (!allDone && isCompleted(sid)) toggleComplete(sid);
      return;
    }

    if (allDone === prevDone) return;
    prevAllExercisesDoneRef.current = allDone;

    if (allDone && prevDone === false) {
      setShowSessionCompleteModal(true);
    }

    if (allDone && !isCompleted(sid)) toggleComplete(sid);
    else if (!allDone && isCompleted(sid)) toggleComplete(sid);
  }, [session?.id, exercises, isCompleted, toggleComplete]);

  const completedExercises = useMemo(
    () => exercises.filter((ex) => ex.completed).length,
    [exercises]
  );
  const progressPercentage =
    exercises.length > 0 ? (completedExercises / exercises.length) * 100 : 0;

  const persistExerciseProgress = useCallback(
    async (list: Exercise[]) => {
      if (!session?.id || list.length === 0) return;
      const completedIds = list.filter((e) => e.completed).map((e) => e.id);
      const pct = (completedIds.length / list.length) * 100;
      try {
        await saveProgress(String(session.id), pct, completedIds.length, {
          completedExerciseIds: completedIds,
        });
      } catch (e) {
        if (e instanceof Error && e.message === "Not authenticated") {
          return;
        }
        console.warn("saveProgress", e);
      }
    },
    [session?.id]
  );

  const handleToggleComplete = (exerciseId: string) => {
    setExercises((prev) => {
      const next = prev.map((ex) =>
        ex.id === exerciseId ? { ...ex, completed: !ex.completed } : ex
      );
      void persistExerciseProgress(next);
      return next;
    });
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  const goHomeAfterPaywall = useCallback(() => {
    router.replace("/(tabs)");
  }, [router]);

  const onPaywallDismiss = useCallback(() => {
    handleDismiss();
    goHomeAfterPaywall();
  }, [goHomeAfterPaywall, handleDismiss]);

  const onPaywallUpgrade = useCallback(() => {
    handleUpgradeTap();
    goHomeAfterPaywall();
  }, [goHomeAfterPaywall, handleUpgradeTap]);

  const handleSessionHistorySaved = useCallback(async () => {
    if (!session?.id) return;
    const sid = String(session.id);
    try {
      await clearSessionProgress(sid);
    } catch (e) {
      if (e instanceof Error && e.message === "Not authenticated") {
        /* still reset UI and leave */
      } else {
        console.warn("clearSessionProgress", e);
      }
    }
    if (isCompleted(sid)) toggleComplete(sid);
    setExercises((prev) => prev.map((ex) => ({ ...ex, completed: false })));
    setShowSessionCompleteModal(false);

    if (postSavePaywallTimerRef.current) {
      clearTimeout(postSavePaywallTimerRef.current);
      postSavePaywallTimerRef.current = null;
    }
    postSavePaywallTimerRef.current = setTimeout(() => {
      postSavePaywallTimerRef.current = null;
      showPaywall("advanced_stats");
    }, POST_SAVE_PAYWALL_DELAY_MS);
  }, [isCompleted, session?.id, showPaywall, toggleComplete]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeNotFound} edges={["top", "bottom"]}>
        <ActivityIndicator size="large" color={p.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeNotFound} edges={["top", "bottom"]}>
        <View style={styles.notFoundInner}>
          <MaterialIcons name="error-outline" size={64} color={p.errorIcon} />
          <Text style={styles.notFoundTitle}>{error}</Text>
          <Pressable onPress={fetchSession} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Reintentar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safeNotFound} edges={["top", "bottom"]}>
        <View style={styles.notFoundInner}>
          <MaterialIcons name="error-outline" size={64} color={p.errorIcon} />
          <Text style={styles.notFoundTitle}>Session not found</Text>
          <Pressable
            onPress={goBack}
            style={styles.primaryButton}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Text style={styles.primaryButtonText}>Volver</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          onPress={goBack}
          style={styles.headerBack}
          accessibilityRole="button"
          accessibilityLabel="Volver atrás"
        >
          <MaterialIcons name="arrow-back" size={22} color={p.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {session.title}
        </Text>
        <Pressable
          onPress={() => toggleFavorite(String(session.id))}
          style={styles.headerFavorite}
          accessibilityRole="button"
          accessibilityLabel={
            isFavorite(String(session.id))
              ? "Quitar de favoritos"
              : "Marcar como favorita"
          }
          accessibilityState={{ selected: isFavorite(String(session.id)) }}
        >
          <MaterialIcons
            name={isFavorite(String(session.id)) ? "favorite" : "favorite-border"}
            size={22}
            color={
              isFavorite(String(session.id))
                ? p.favoriteActive
                : p.favoriteInactive
            }
          />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.infoCard, isWide && styles.infoCardWide]}>
          <View style={styles.infoMain}>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, styles.badgeNeutral]}>
                <Text style={styles.badgeTextNeutral}>
                  {session.type === "individual" ? "Individual" : "Grupal"}
                </Text>
              </View>
              <View style={[styles.badge, styles.badgeNeutral]}>
                <Text style={styles.badgeTextNeutral}>{session.level}</Text>
              </View>
              <View style={[styles.badge, styles.badgeNeutral]}>
                <Text style={styles.badgeTextNeutral}>
                  {session.duration} min
                </Text>
              </View>
            </View>

            <Text style={styles.description}>{session.description}</Text>

            <View style={styles.metaGrid}>
              <View style={styles.metaRow}>
                <MaterialIcons name="schedule" size={16} color={p.textMuted} />
                <Text style={styles.metaText}>{session.duration} minutes</Text>
              </View>
              {session.coach ? (
                <View style={styles.metaRow}>
                  <MaterialIcons name="person" size={16} color={p.textMuted} />
                  <Text style={styles.metaText}>Coach: {session.coach}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={[styles.progressCard, isWide && styles.progressCardWide]}>
            <View style={styles.progressHeader}>
              <MaterialIcons name="check-circle" size={22} color={p.primary} />
              <Text style={styles.progressTitle}>Session progress</Text>
            </View>
            <View style={styles.progressCounts}>
              <Text style={styles.progressFraction}>
                {completedExercises}/{exercises.length}
              </Text>
              <Text style={styles.progressSub}>exercises</Text>
            </View>
            <ProgressBar
              value={progressPercentage}
              trackColor={p.progressTrack}
              fillColor={p.progressFill}
            />
            <Text style={styles.progressHint}>
              {exercises.length === 0
                ? "No exercises in this session"
                : completedExercises === exercises.length
                  ? "¡Session completed! 🎉"
                  : `${exercises.length - completedExercises} remaining exercises`}
            </Text>
          </View>
        </View>

        <View style={styles.tabsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabList}
          >
            <Pressable
              onPress={() => setActiveTab("exercises")}
              style={[
                styles.tabTrigger,
                activeTab === "exercises" && styles.tabTriggerActive,
              ]}
            >
              <Text
                style={[
                  styles.tabTriggerText,
                  activeTab === "exercises" && styles.tabTriggerTextActive,
                ]}
              >
                Exercises ({exercises.length})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("objectives")}
              style={[
                styles.tabTrigger,
                activeTab === "objectives" && styles.tabTriggerActive,
              ]}
            >
              <Text
                style={[
                  styles.tabTriggerText,
                  activeTab === "objectives" && styles.tabTriggerTextActive,
                ]}
              >
                Objetives ({session.objectives?.length ?? 0})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("equipment")}
              style={[
                styles.tabTrigger,
                activeTab === "equipment" && styles.tabTriggerActive,
              ]}
            >
              <Text
                style={[
                  styles.tabTriggerText,
                  activeTab === "equipment" && styles.tabTriggerTextActive,
                ]}
              >
                Equipment ({session.equipment?.length ?? 0})
              </Text>
            </Pressable>
          </ScrollView>

          {activeTab === "exercises" ? (
            <View style={styles.tabPanel}>
              {exercises.map((exercise, index) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  index={index}
                  onToggleComplete={handleToggleComplete}
                />
              ))}
            </View>
          ) : null}

          {activeTab === "objectives" ? (
            <View style={styles.panelCard}>
              <View style={styles.panelHeadingRow}>
                <MaterialIcons name="track-changes" size={22} color={p.primary} />
                <Text style={styles.panelTitle}>Objetictives of the session</Text>
              </View>
              {(session.objectives ?? []).map((objective, idx) => (
                <View key={idx} style={styles.objectiveRow}>
                  <View style={styles.objectiveIndex}>
                    <Text style={styles.objectiveIndexText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.objectiveText}>{objective}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {activeTab === "equipment" ? (
            <View style={styles.panelCard}>
              <Text style={styles.equipmentTitle}>Equipamiento necesario</Text>
              <View style={styles.equipmentGrid}>
                {(session.equipment ?? []).map((item, idx) => (
                  <View key={idx} style={styles.equipmentItem}>
                    <MaterialIcons
                      name="check-circle"
                      size={22}
                      color={p.equipmentCheck}
                    />
                    <Text style={styles.equipmentText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <SessionCompleteModal
        visible={showSessionCompleteModal}
        session={{
          id: String(session.id),
          title: session.title,
        }}
        durationMinutes={session.duration}
        onClose={() => setShowSessionCompleteModal(false)}
        onSaved={handleSessionHistorySaved}
      />
      <PaywallModal
        visible={paywallVisible}
        feature={currentFeature ?? "advanced_stats"}
        onUpgrade={onPaywallUpgrade}
        onDismiss={onPaywallDismiss}
      />
    </SafeAreaView>
  );
}