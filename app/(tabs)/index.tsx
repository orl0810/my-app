import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { HelloWave } from "@/components/hello-wave";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useEffect, useMemo, useState } from "react";
import { MotivationalMessage } from "../components/home-message";
import { HomeStatsCards } from "../components/home-stats-cards";
import { SessionCard, type TrainingSession } from "../components/session-card";

const LEVEL_OPTIONS = ["Beginner", "Intermediate", "Advanced", "All levels"] as const;

const DURATION_BUCKETS = [
  { id: "corta" as const, label: "Short (≤ 60 min)" },
  { id: "media" as const, label: "Medium (61–75 min)" },
  { id: "larga" as const, label: "Long (> 75 min)" },
];

const OBJECTIVE_OPTIONS = ["Technique", "Physical fitness", "Strategy", "Precision"] as const;

const HOME_MOTIVATION = {
  message:
    "Success in tennis is not only about winning—it is about improving every day. Each session is a chance to be better than yesterday.",
  author: "Carlos Martínez",
  authorImage: "https://example.com/author.jpg",
} as const;

type DurationBucketId = (typeof DURATION_BUCKETS)[number]["id"];

const OBJECTIVE_MATCHERS: Record<(typeof OBJECTIVE_OPTIONS)[number], RegExp> = {
  Technique: /técnica|tecnica|technique|technical/i,
  "Physical fitness":
    /condición|condicion|físic|fisic|fitness|cardio|resistencia|fuerza|physical|conditioning/i,
  Strategy: /estrategia|strategy|táctica|tactica|juego|mental/i,
  Precision: /precisión|precision|accuracy|puntería|punteria|colocación|colocacion/i,
};

function sessionMatchesSearch(session: TrainingSession, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const inText = (s: string | undefined) => (s ?? "").toLowerCase().includes(q);
  if (inText(session.title) || inText(session.coach) || inText(session.description)) return true;
  return session.objectives?.some((o) => o.toLowerCase().includes(q)) ?? false;
}

function sessionMatchesLevelFilter(session: TrainingSession, selected: string | null): boolean {
  if (!selected || selected === "All levels") return true;
  const lv = (session.level ?? "").toLowerCase();
  if (selected === "Beginner") {
    return /principiante|beginner|básico|basico|iniciación|iniciacion|novato|starter/i.test(lv);
  }
  if (selected === "Intermediate") {
    return /intermedio|intermediate|medio/i.test(lv);
  }
  if (selected === "Advanced") {
    return /avanzado|advanced|pro|experto|élite|elite/i.test(lv);
  }
  return true;
}

function sessionMatchesDurationBucket(
  session: TrainingSession,
  bucket: DurationBucketId | null
): boolean {
  if (!bucket) return true;
  const d = session.duration;
  if (typeof d !== "number") return true;
  if (bucket === "corta") return d <= 60;
  if (bucket === "media") return d >= 61 && d <= 75;
  return d > 75;
}

function sessionMatchesObjectiveFilter(session: TrainingSession, selected: string | null): boolean {
  if (!selected || !(selected in OBJECTIVE_MATCHERS)) return true;
  const matcher = OBJECTIVE_MATCHERS[selected as keyof typeof OBJECTIVE_MATCHERS];
  const texts = session.objectives ?? [];
  return texts.some((o) => matcher.test(o));
}

const homeSessionsPalette = {
  light: {
    sessionsCardBg: "#FFFFFF",
    sessionsCardBorder: "#E5E7EB",
    shadowOpacity: 0.06,
    cardTitle: "#111827",
    filterIcon: "#111827",
    filterToggleBorder: "#E5E7EB",
    filterToggleBg: "#FFFFFF",
    filterToggleOpenBorder: "#9ECFC9",
    filterToggleOpenBg: "#E0F5F1",
    filterPanelBorder: "#9ECFC9",
    filterPanelBg: "#EAF6F3",
    filterCategoriesRule: "#A8D4E6",
    searchInputBorder: "#E5E7EB",
    searchInputBg: "#FFFFFF",
    searchInputText: "#111827",
    searchMuted: "#9CA3AF",
    filterGroupTitle: "#111827",
    chipLevelMutedBorder: "#BFDBFE",
    chipLevelMutedBg: "#EFF6FF",
    chipDurationMutedBorder: "#BBF7D0",
    chipDurationMutedBg: "#F0FDF4",
    chipObjectiveMutedBorder: "#E9D5FF",
    chipObjectiveMutedBg: "#FAF5FF",
    chipText: "#1F2937",
    activeFiltersRule: "#A8D4E6",
    activeFiltersLabel: "#6B7280",
    badgeNeutralBorder: "#E5E7EB",
    badgeNeutralBg: "#FFFFFF",
    badgeText: "#1F2937",
    badgeNeutralIcon: "#4B5563",
    badgeBlueBorder: "#BFDBFE",
    badgeBlueBg: "#DBEAFE",
    badgeBlueText: "#1E40AF",
    badgeBlueIcon: "#1D4ED8",
    badgeGreenBorder: "#BBF7D0",
    badgeGreenBg: "#DCFCE7",
    badgeGreenText: "#166534",
    badgeGreenIcon: "#15803D",
    badgePurpleBorder: "#E9D5FF",
    badgePurpleBg: "#F3E8FF",
    badgePurpleText: "#6B21A8",
    badgePurpleIcon: "#7E22CE",
    activityIndicator: "#2563EB",
  },
  dark: {
    sessionsCardBg: "#1f1f1f",
    sessionsCardBorder: "#2e2e2e",
    shadowOpacity: 0.28,
    cardTitle: "#ffffff",
    filterIcon: "#e5e5e5",
    filterToggleBorder: "#404040",
    filterToggleBg: "#262626",
    filterToggleOpenBorder: "#2dd4bf",
    filterToggleOpenBg: "#134e4a",
    filterPanelBorder: "#115e59",
    filterPanelBg: "#0c1917",
    filterCategoriesRule: "#404040",
    searchInputBorder: "#404040",
    searchInputBg: "#262626",
    searchInputText: "#f5f5f5",
    searchMuted: "#737373",
    filterGroupTitle: "#e5e5e5",
    chipLevelMutedBorder: "rgba(59, 130, 246, 0.45)",
    chipLevelMutedBg: "rgba(37, 99, 235, 0.18)",
    chipDurationMutedBorder: "rgba(34, 197, 94, 0.45)",
    chipDurationMutedBg: "rgba(22, 163, 74, 0.2)",
    chipObjectiveMutedBorder: "rgba(168, 85, 247, 0.45)",
    chipObjectiveMutedBg: "rgba(147, 51, 234, 0.18)",
    chipText: "#f5f5f5",
    activeFiltersRule: "#404040",
    activeFiltersLabel: "#9ca3af",
    badgeNeutralBorder: "#404040",
    badgeNeutralBg: "#262626",
    badgeText: "#e5e5e5",
    badgeNeutralIcon: "#a3a3a3",
    badgeBlueBorder: "#1e40af",
    badgeBlueBg: "#172554",
    badgeBlueText: "#93c5fd",
    badgeBlueIcon: "#60a5fa",
    badgeGreenBorder: "#166534",
    badgeGreenBg: "#14532d",
    badgeGreenText: "#86efac",
    badgeGreenIcon: "#4ade80",
    badgePurpleBorder: "#6b21a8",
    badgePurpleBg: "#581c87",
    badgePurpleText: "#e9d5ff",
    badgePurpleIcon: "#c084fc",
    activityIndicator: "#60a5fa",
  },
} as const;

type HomeSessionsPalette =
  (typeof homeSessionsPalette)["light"] | (typeof homeSessionsPalette)["dark"];

function createHomeSessionsStyles(p: HomeSessionsPalette) {
  return StyleSheet.create({
    titleContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    stepContainer: {
      gap: 8,
      marginBottom: 8,
    },
    sessionsCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: p.sessionsCardBorder,
      backgroundColor: p.sessionsCardBg,
      padding: 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: p.shadowOpacity,
      shadowRadius: 3,
      elevation: 2,
    },
    cardHeader: {
      marginBottom: 24,
    },
    cardHeaderCompact: {
      marginBottom: 16,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: p.cardTitle,
      flexShrink: 0,
    },
    actionsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexGrow: 1,
      flexShrink: 1,
      minWidth: 160,
      justifyContent: "flex-end",
    },
    bookButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#000000",
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      minHeight: 50,
      maxHeight: 50,
    },
    bookIcon: {
      marginRight: 8,
    },
    bookButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },
    filterToggle: {
      width: 50,
      height: 50,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: p.filterToggleBorder,
      backgroundColor: p.filterToggleBg,
      alignItems: "center",
      justifyContent: "center",
    },
    filterToggleOpen: {
      borderColor: p.filterToggleOpenBorder,
      backgroundColor: p.filterToggleOpenBg,
    },
    filterPanel: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: p.filterPanelBorder,
      backgroundColor: p.filterPanelBg,
      padding: 20,
      marginBottom: 16,
      gap: 0,
    },
    searchWrap: {
      position: "relative",
      width: "100%",
    },
    searchIconLeft: {
      position: "absolute",
      left: 12,
      top: 0,
      height: 48,
      justifyContent: "center",
      zIndex: 1,
    },
    searchInput: {
      width: "100%",
      minHeight: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: p.searchInputBorder,
      backgroundColor: p.searchInputBg,
      paddingVertical: 12,
      paddingLeft: 44,
      paddingRight: 44,
      fontSize: 16,
      color: p.searchInputText,
    },
    searchClear: {
      position: "absolute",
      right: 8,
      top: 0,
      height: 48,
      justifyContent: "center",
      paddingHorizontal: 4,
      zIndex: 1,
    },
    filterCategories: {
      marginTop: 20,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: p.filterCategoriesRule,
      gap: 20,
    },
    filterGroup: {
      gap: 12,
    },
    filterGroupHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    filterGroupTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: p.filterGroupTitle,
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    chip: {
      borderRadius: 9999,
      borderWidth: 1.5,
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    chipLevelOff: {
      borderColor: p.chipLevelMutedBorder,
      backgroundColor: p.chipLevelMutedBg,
    },
    chipDurationOff: {
      borderColor: p.chipDurationMutedBorder,
      backgroundColor: p.chipDurationMutedBg,
    },
    chipObjectiveOff: {
      borderColor: p.chipObjectiveMutedBorder,
      backgroundColor: p.chipObjectiveMutedBg,
    },
    chipLevelOn: {
      borderColor: "#2563EB",
      backgroundColor: "#2563EB",
    },
    chipDurationOn: {
      borderColor: "#16A34A",
      backgroundColor: "#16A34A",
    },
    chipObjectiveOn: {
      borderColor: "#9333EA",
      backgroundColor: "#9333EA",
    },
    chipText: {
      fontSize: 14,
      fontWeight: "500",
      color: p.chipText,
    },
    chipTextOn: {
      color: "#FFFFFF",
      fontWeight: "600",
    },
    activeFiltersBlock: {
      marginTop: 20,
      gap: 12,
    },
    activeFiltersRule: {
      height: 1,
      width: "100%",
      backgroundColor: p.activeFiltersRule,
      marginBottom: 4,
    },
    activeFiltersLabel: {
      fontSize: 14,
      color: p.activeFiltersLabel,
    },
    badgeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      alignItems: "center",
    },
    badgeNeutral: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      maxWidth: "100%",
      borderRadius: 9999,
      borderWidth: 1,
      borderColor: p.badgeNeutralBorder,
      backgroundColor: p.badgeNeutralBg,
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
    badgeBlue: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: 9999,
      borderWidth: 1,
      borderColor: p.badgeBlueBorder,
      backgroundColor: p.badgeBlueBg,
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
    badgeGreen: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: 9999,
      borderWidth: 1,
      borderColor: p.badgeGreenBorder,
      backgroundColor: p.badgeGreenBg,
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
    badgePurple: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      maxWidth: "100%",
      borderRadius: 9999,
      borderWidth: 1,
      borderColor: p.badgePurpleBorder,
      backgroundColor: p.badgePurpleBg,
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
    badgeText: {
      fontSize: 12,
      color: p.badgeText,
      maxWidth: 140,
    },
    badgeTextBlue: {
      fontSize: 12,
      fontWeight: "600",
      color: p.badgeBlueText,
    },
    badgeTextGreen: {
      fontSize: 12,
      fontWeight: "600",
      color: p.badgeGreenText,
    },
    badgeTextPurple: {
      fontSize: 12,
      fontWeight: "600",
      color: p.badgePurpleText,
      maxWidth: 160,
    },
    clearAllText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#DC2626",
      alignSelf: "flex-start",
    },
    sessionsList: {
      marginTop: 12,
      gap: 16,
    },
    parallaxHeaderMessage: {
      flex: 1,
      width: "100%",
    },
    pressedOpacity: {
      opacity: 0.88,
    },
  });
}

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const sessionsPalette =
    colorScheme === "dark"
      ? homeSessionsPalette.dark
      : homeSessionsPalette.light;
  const styles = useMemo(
    () => createHomeSessionsStyles(sessionsPalette),
    [sessionsPalette]
  );

  const router = useRouter();
  const [upcomingSessions, setUpcomingSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedDurationBucket, setSelectedDurationBucket] = useState<DurationBucketId | null>(
    null
  );
  const [selectedObjective, setSelectedObjective] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("https://n8n.srv1108930.hstgr.cloud/webhook/tt-sessions", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Failed to fetch sessions");

      const data = await response.json();

      setUpcomingSessions(data.sessions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const filteredSessions = useMemo(() => {
    return upcomingSessions.filter((session) => {
      if (!sessionMatchesSearch(session, searchQuery)) return false;
      if (!sessionMatchesLevelFilter(session, selectedLevel)) return false;
      if (!sessionMatchesDurationBucket(session, selectedDurationBucket)) return false;
      if (!sessionMatchesObjectiveFilter(session, selectedObjective)) return false;
      return true;
    });
  }, [
    upcomingSessions,
    searchQuery,
    selectedLevel,
    selectedDurationBucket,
    selectedObjective,
  ]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedLevel != null ||
    selectedDurationBucket != null ||
    selectedObjective != null;

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedLevel(null);
    setSelectedDurationBucket(null);
    setSelectedObjective(null);
  };

  const handleBookSession = () => {
    router.push("/modal");
  };

  const showFilterPanel = showFilters || hasActiveFilters;

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <View style={styles.parallaxHeaderMessage}>
          <MotivationalMessage
            variant="fullBleed"
            message={HOME_MOTIVATION.message}
            author={HOME_MOTIVATION.author}
            authorImage={HOME_MOTIVATION.authorImage}
          />
        </View>
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>

      {!loading && !error ? (
        <ThemedView style={styles.stepContainer}>
          <HomeStatsCards sessions={upcomingSessions} />
        </ThemedView>
      ) : null}

      <View style={styles.sessionsCard}>
        <View style={[styles.cardHeader, !showFilterPanel && styles.cardHeaderCompact]}>
          <View style={styles.headerRow}>
            <Text style={styles.cardTitle}>My sessions</Text>
            <View style={styles.actionsRow}>
              <Pressable
                onPress={() => setShowFilters((v) => !v)}
                style={({ pressed }) => [
                  styles.filterToggle,
                  showFilters && styles.filterToggleOpen,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <MaterialIcons name="tune" size={22} color={sessionsPalette.filterIcon} />
                </Pressable>
            </View>
          </View>
        </View>

        {showFilterPanel ? (
        <View style={styles.filterPanel}>
          <View style={styles.searchWrap}>
            <View style={styles.searchIconLeft} pointerEvents="none">
              <MaterialIcons name="search" size={22} color={sessionsPalette.searchMuted} />
            </View>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by title, coach, or objective..."
              placeholderTextColor={sessionsPalette.searchMuted}
              style={styles.searchInput}
            />
            {searchQuery.length > 0 ? (
              <Pressable
                onPress={() => setSearchQuery("")}
                style={styles.searchClear}
                hitSlop={8}
              >
                <MaterialIcons name="close" size={22} color={sessionsPalette.searchMuted} />
              </Pressable>
            ) : null}
          </View>

          {showFilters ? (
            <View style={styles.filterCategories}>
              <View style={styles.filterGroup}>
                <View style={styles.filterGroupHeader}>
                  <MaterialIcons name="workspace-premium" size={20} color="#2563EB" />
                  <Text style={styles.filterGroupTitle}>Level</Text>
                </View>
                <View style={styles.chipRow}>
                  {LEVEL_OPTIONS.map((level) => {
                    const active =
                      level === "All levels"
                        ? selectedLevel === null
                        : selectedLevel === level;
                    return (
                      <Pressable
                        key={level}
                        onPress={() => {
                          if (level === "All levels") {
                            setSelectedLevel(null);
                            return;
                          }
                          setSelectedLevel(active ? null : level);
                        }}
                        style={({ pressed }) => [
                          styles.chip,
                          active ? styles.chipLevelOn : styles.chipLevelOff,
                          pressed && styles.pressedOpacity,
                        ]}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextOn]}>{level}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.filterGroup}>
                <View style={styles.filterGroupHeader}>
                  <MaterialIcons name="schedule" size={20} color="#16A34A" />
                  <Text style={styles.filterGroupTitle}>Duration</Text>
                </View>
                <View style={styles.chipRow}>
                  {DURATION_BUCKETS.map(({ id, label }) => {
                    const active = selectedDurationBucket === id;
                    return (
                      <Pressable
                        key={id}
                        onPress={() => setSelectedDurationBucket(active ? null : id)}
                        style={({ pressed }) => [
                          styles.chip,
                          active ? styles.chipDurationOn : styles.chipDurationOff,
                          pressed && styles.pressedOpacity,
                        ]}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextOn]}>{label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.filterGroup}>
                <View style={styles.filterGroupHeader}>
                  <MaterialIcons name="track-changes" size={20} color="#9333EA" />
                  <Text style={styles.filterGroupTitle}>Objective</Text>
                </View>
                <View style={styles.chipRow}>
                  {OBJECTIVE_OPTIONS.map((objective) => {
                    const active = selectedObjective === objective;
                    return (
                      <Pressable
                        key={objective}
                        onPress={() => setSelectedObjective(active ? null : objective)}
                        style={({ pressed }) => [
                          styles.chip,
                          active ? styles.chipObjectiveOn : styles.chipObjectiveOff,
                          pressed && styles.pressedOpacity,
                        ]}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextOn]}>
                          {objective}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          ) : null}

          {hasActiveFilters ? (
            <View style={styles.activeFiltersBlock}>
              <View style={styles.activeFiltersRule} />
              <Text style={styles.activeFiltersLabel}>Active filters</Text>
              <View style={styles.badgeRow}>
                {searchQuery.trim().length > 0 ? (
                  <View style={styles.badgeNeutral}>
                    <MaterialIcons name="search" size={14} color={sessionsPalette.badgeNeutralIcon} />
                    <Text style={styles.badgeText} numberOfLines={1}>
                      {searchQuery.trim()}
                    </Text>
                    <Pressable onPress={() => setSearchQuery("")} hitSlop={6}>
                      <MaterialIcons name="close" size={14} color="#DC2626" />
                    </Pressable>
                  </View>
                ) : null}
                {selectedLevel ? (
                  <View style={styles.badgeBlue}>
                    <MaterialIcons name="emoji-events" size={14} color={sessionsPalette.badgeBlueIcon} />
                    <Text style={styles.badgeTextBlue}>{selectedLevel}</Text>
                    <Pressable onPress={() => setSelectedLevel(null)} hitSlop={6}>
                      <MaterialIcons name="close" size={14} color="#DC2626" />
                    </Pressable>
                  </View>
                ) : null}
                {selectedDurationBucket != null ? (
                  <View style={styles.badgeGreen}>
                    <MaterialIcons name="schedule" size={14} color={sessionsPalette.badgeGreenIcon} />
                    <Text style={styles.badgeTextGreen}>
                      {DURATION_BUCKETS.find((b) => b.id === selectedDurationBucket)?.label}
                    </Text>
                    <Pressable onPress={() => setSelectedDurationBucket(null)} hitSlop={6}>
                      <MaterialIcons name="close" size={14} color="#DC2626" />
                    </Pressable>
                  </View>
                ) : null}
                {selectedObjective ? (
                  <View style={styles.badgePurple}>
                    <MaterialIcons name="track-changes" size={14} color={sessionsPalette.badgePurpleIcon} />
                    <Text style={styles.badgeTextPurple} numberOfLines={1}>
                      {selectedObjective}
                    </Text>
                    <Pressable onPress={() => setSelectedObjective(null)} hitSlop={6}>
                      <MaterialIcons name="close" size={14} color="#DC2626" />
                    </Pressable>
                  </View>
                ) : null}
              </View>
              <Pressable onPress={clearAllFilters} hitSlop={4}>
                <Text style={styles.clearAllText}>Clear all</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
        ) : null}

        <View style={styles.sessionsList}>
          {loading ? (
            <ActivityIndicator color={sessionsPalette.activityIndicator} />
          ) : error ? (
            <ThemedText>{error}</ThemedText>
          ) : upcomingSessions.length === 0 ? (
            <ThemedText>No sessions available.</ThemedText>
          ) : filteredSessions.length === 0 ? (
            <ThemedText>No sessions match your filters.</ThemedText>
          ) : (
            filteredSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))
          )}
        </View>
      </View>
    </ParallaxScrollView>
  );
}
