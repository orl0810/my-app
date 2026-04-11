import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import type { MarkedDates } from "react-native-calendars/src/types";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  SESSION_HISTORY_PAGE_SIZE,
  useSessionHistory,
} from "@/src/hooks/useSessionHistory";
import {
  buildMarkedDates,
  completedAtToCalendarKey,
  getActiveDaysThisMonth,
} from "@/src/utils/calendar-helpers";

const BRAND_GREEN = "#1D9E75";

function formatCalendarChipDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatCompletedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function difficultyLabel(
  d: "easy" | "good" | "hard" | null | undefined
): string | null {
  if (d === "easy") return "Easy";
  if (d === "good") return "Good";
  if (d === "hard") return "Hard";
  return null;
}

type DifficultyKey = "easy" | "good" | "hard" | null;

/** Card chrome aligned with {@link session-card} + difficulty tint */
type HistoryCardPalette = {
  cardBg: string;
  cardBorder: string;
  shadowOpacity: number;
  title: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  detailMuted: string;
  detailText: string;
  buttonBorder: string;
  buttonBg: string;
  buttonAccent: string;
};

function historyCardPalette(
  difficulty: DifficultyKey,
  isDark: boolean
): HistoryCardPalette {
  if (isDark) {
    if (difficulty === "easy") {
      return {
        cardBg: "#14261a",
        cardBorder: "#166534",
        shadowOpacity: 0.28,
        title: "#ffffff",
        badgeBg: "#14532d",
        badgeBorder: "#22c55e",
        badgeText: "#bbf7d0",
        detailMuted: "#86efac",
        detailText: "#bbf7d0",
        buttonBorder: "#15803d",
        buttonBg: "#14532d",
        buttonAccent: "#4ade80",
      };
    }
    if (difficulty === "good") {
      return {
        cardBg: "#172554",
        cardBorder: "#1e40af",
        shadowOpacity: 0.28,
        title: "#ffffff",
        badgeBg: "#172554",
        badgeBorder: "#3b82f6",
        badgeText: "#bfdbfe",
        detailMuted: "#93c5fd",
        detailText: "#bfdbfe",
        buttonBorder: "#1e40af",
        buttonBg: "#172554",
        buttonAccent: "#60a5fa",
      };
    }
    if (difficulty === "hard") {
      return {
        cardBg: "#422006",
        cardBorder: "#b45309",
        shadowOpacity: 0.28,
        title: "#ffffff",
        badgeBg: "#713f12",
        badgeBorder: "#eab308",
        badgeText: "#fef08a",
        detailMuted: "#fcd34d",
        detailText: "#fde047",
        buttonBorder: "#a16207",
        buttonBg: "#713f12",
        buttonAccent: "#facc15",
      };
    }
    return {
      cardBg: "#1f1f1f",
      cardBorder: "#2e2e2e",
      shadowOpacity: 0.28,
      title: "#ffffff",
      badgeBg: "#262626",
      badgeBorder: "#404040",
      badgeText: "#d4d4d4",
      detailMuted: "#9ca3af",
      detailText: "#a3a3a3",
      buttonBorder: "#1e40af",
      buttonBg: "#172554",
      buttonAccent: "#60a5fa",
    };
  }

  if (difficulty === "easy") {
    return {
      cardBg: "#F0FDF4",
      cardBorder: "#BBF7D0",
      shadowOpacity: 0.08,
      title: "#111827",
      badgeBg: "#DCFCE7",
      badgeBorder: "#86EFAC",
      badgeText: "#166534",
      detailMuted: "#15803D",
      detailText: "#166534",
      buttonBorder: "#86EFAC",
      buttonBg: "#DCFCE7",
      buttonAccent: "#15803D",
    };
  }
  if (difficulty === "good") {
    return {
      cardBg: "#EFF6FF",
      cardBorder: "#BFDBFE",
      shadowOpacity: 0.08,
      title: "#111827",
      badgeBg: "#DBEAFE",
      badgeBorder: "#93C5FD",
      badgeText: "#1E40AF",
      detailMuted: "#2563EB",
      detailText: "#1D4ED8",
      buttonBorder: "#BFDBFE",
      buttonBg: "#DBEAFE",
      buttonAccent: "#2563EB",
    };
  }
  if (difficulty === "hard") {
    return {
      cardBg: "#FFFBEB",
      cardBorder: "#FDE68A",
      shadowOpacity: 0.08,
      title: "#111827",
      badgeBg: "#FEF3C7",
      badgeBorder: "#FCD34D",
      badgeText: "#B45309",
      detailMuted: "#D97706",
      detailText: "#B45309",
      buttonBorder: "#FCD34D",
      buttonBg: "#FEF3C7",
      buttonAccent: "#B45309",
    };
  }
  return {
    cardBg: "#FFFFFF",
    cardBorder: "#E5E7EB",
    shadowOpacity: 0.08,
    title: "#111827",
    badgeBg: "#F3F4F6",
    badgeBorder: "#D1D5DB",
    badgeText: "#374151",
    detailMuted: "#6B7280",
    detailText: "#4B5563",
    buttonBorder: "#DBEAFE",
    buttonBg: "#EFF6FF",
    buttonAccent: "#2563EB",
  };
}

function buildHistoryCardStyles(p: HistoryCardPalette) {
  return StyleSheet.create({
    cardContainer: {
      backgroundColor: p.cardBg,
      borderWidth: 1,
      borderColor: p.cardBorder,
      borderRadius: 16,
      padding: 14,
      shadowColor: "#000",
      shadowOpacity: p.shadowOpacity,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    content: {
      gap: 10,
    },
    header: {
      gap: 6,
    },
    title: {
      fontSize: 17,
      fontWeight: "700",
      color: p.title,
      lineHeight: 22,
    },
    badgeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    badge: {
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: p.badgeBorder,
      backgroundColor: p.badgeBg,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: "600",
      color: p.badgeText,
    },
    details: {
      gap: 6,
    },
    detailRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    detailText: {
      color: p.detailText,
      fontSize: 13,
    },
    button: {
      marginTop: 2,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 8,
      paddingHorizontal: 11,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: p.buttonBorder,
      backgroundColor: p.buttonBg,
    },
    buttonText: {
      color: p.buttonAccent,
      fontWeight: "700",
      fontSize: 13,
    },
  });
}

export default function HistoryScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  const screen = useMemo(
    () =>
      isDark
        ? {
            bg: "#0d0d0d",
            title: "#fafafa",
            muted: "#a1a1aa",
            refreshTint: "#60a5fa",
          }
        : {
            bg: "#f2f2f7",
            title: "#111827",
            muted: "#6b7280",
            refreshTint: "#2563eb",
          },
    [isDark]
  );

  const cardStylesByDifficulty = useMemo(() => {
    const keys: DifficultyKey[] = [null, "easy", "good", "hard"];
    const map: Record<string, ReturnType<typeof buildHistoryCardStyles>> = {};
    for (const k of keys) {
      const key = k ?? "none";
      map[key] = buildHistoryCardStyles(historyCardPalette(k, isDark));
    }
    return map;
  }, [isDark]);

  const layoutStyles = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1 },
        scroll: { paddingHorizontal: 20, paddingBottom: 32 },
        headerBlock: { marginTop: 8, marginBottom: 16 },
        screenTitle: { fontSize: 28, fontWeight: "700", marginBottom: 6 },
        subtitle: { fontSize: 15, lineHeight: 22 },
        subtitleExplain: {
          fontSize: 14,
          lineHeight: 21,
          marginTop: 10,
        },
        cardList: {
          gap: 12,
        },
        historyError: {
          fontSize: 14,
          marginBottom: 12,
        },
        centerBlock: {
          paddingVertical: 40,
          alignItems: "center",
          gap: 12,
        },
        loadMoreSection: {
          marginTop: 20,
          alignItems: "stretch",
          gap: 10,
          paddingBottom: 8,
        },
        loadMoreButton: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          paddingVertical: 14,
          paddingHorizontal: 20,
          borderRadius: 999,
          borderWidth: 1.5,
        },
        loadMoreIconCircle: {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1.5,
        },
        loadMoreLabel: {
          fontSize: 15,
          fontWeight: "700",
        },
        noMoreText: {
          fontSize: 14,
          textAlign: "center",
          marginTop: 4,
        },
        calendarSection: {
          marginBottom: 20,
        },
        calendarCard: {
          borderRadius: 22,
          paddingTop: 14,
          paddingBottom: 6,
          borderWidth: 1,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowRadius: 24,
          elevation: 5,
        },
        calendarTitle: {
          fontSize: 17,
          fontWeight: "700",
          letterSpacing: -0.3,
        },
        statPill: {
          paddingVertical: 5,
          paddingHorizontal: 11,
          borderRadius: 999,
          borderWidth: 1,
        },
        statPillText: {
          fontSize: 12,
          fontWeight: "700",
        },
        calendarHint: {
          fontSize: 12,
          paddingHorizontal: 14,
          marginBottom: 6,
          lineHeight: 16,
        },
        filterChipRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
          flexWrap: "wrap",
        },
        filterChip: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingVertical: 8,
          paddingHorizontal: 14,
          borderRadius: 999,
          borderWidth: 1,
        },
        filterChipLabel: {
          fontSize: 13,
          fontWeight: "600",
        },
        filterClear: {
          fontSize: 13,
          fontWeight: "700",
        },
        filterEmpty: {
          fontSize: 14,
          textAlign: "center",
          marginBottom: 16,
          lineHeight: 20,
        },
        calendarHeaderPressable: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingHorizontal: 14,
          paddingVertical: 10,
          marginBottom: 4,
        },
        calendarHeaderMiddle: {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
          minWidth: 0,
        },
        calendarCollapsedCaption: {
          fontSize: 12,
          lineHeight: 16,
          paddingHorizontal: 14,
          marginBottom: 12,
        },
      }),
    []
  );

  const router = useRouter();
  const sessionHistoryFirstFocus = useRef(true);
  const {
    history: sessionHistoryRows,
    loading: sessionHistoryLoading,
    loadingMore: sessionHistoryLoadingMore,
    hasMore: sessionHistoryHasMore,
    error: sessionHistoryError,
    refetch: refetchSessionHistory,
    loadMore: loadMoreSessionHistory,
  } = useSessionHistory();

  const [refreshing, setRefreshing] = useState(false);
  const [calendarExpanded, setCalendarExpanded] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<
    string | undefined
  >();

  useEffect(() => {
    if (!calendarExpanded) {
      setSelectedCalendarDate(undefined);
    }
  }, [calendarExpanded]);

  const markedDatesMap = useMemo(
    () => buildMarkedDates(sessionHistoryRows),
    [sessionHistoryRows],
  );

  const calendarMarkedDates = useMemo((): MarkedDates => {
    const next: MarkedDates = {};
    for (const date of Object.keys(markedDatesMap)) {
      next[date] = { marked: true, dotColor: BRAND_GREEN };
    }
    if (selectedCalendarDate) {
      const existing = next[selectedCalendarDate];
      next[selectedCalendarDate] = {
        ...existing,
        selected: true,
        selectedColor: BRAND_GREEN,
        selectedTextColor: "#ffffff",
      };
    }
    return next;
  }, [markedDatesMap, selectedCalendarDate]);

  const activeDaysRolling30 = useMemo(
    () => getActiveDaysThisMonth(markedDatesMap),
    [markedDatesMap],
  );

  const displayedSessionRows = useMemo(() => {
    if (!calendarExpanded || !selectedCalendarDate) {
      return sessionHistoryRows;
    }
    return sessionHistoryRows.filter(
      (row) => completedAtToCalendarKey(row.completed_at) === selectedCalendarDate,
    );
  }, [calendarExpanded, sessionHistoryRows, selectedCalendarDate]);

  const calendarTheme = useMemo(() => {
    const title = screen.title;
    const muted = screen.muted;
    const cardBg = isDark ? "#161616" : "#ffffff";
    const disabled = isDark ? "#3f3f46" : "#d1d5db";
    return {
      backgroundColor: "transparent",
      calendarBackground: cardBg,
      monthTextColor: title,
      textMonthFontSize: 18,
      textMonthFontWeight: "700" as const,
      textSectionTitleColor: muted,
      textSectionTitleDisabledColor: disabled,
      dayTextColor: title,
      todayTextColor: BRAND_GREEN,
      todayBackgroundColor: isDark
        ? "rgba(29, 158, 117, 0.12)"
        : "rgba(29, 158, 117, 0.1)",
      textDayFontSize: 15,
      textDayFontWeight: "600" as const,
      textDayHeaderFontSize: 12,
      textDayHeaderFontWeight: "700" as const,
      textDisabledColor: disabled,
      arrowColor: BRAND_GREEN,
      selectedDayBackgroundColor: BRAND_GREEN,
      selectedDayTextColor: "#ffffff",
      dotColor: BRAND_GREEN,
      selectedDotColor: "#ffffff",
    };
  }, [isDark, screen.muted, screen.title]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setSelectedCalendarDate(undefined);
    try {
      await refetchSessionHistory();
    } finally {
      setRefreshing(false);
    }
  }, [refetchSessionHistory]);

  useFocusEffect(
    useCallback(() => {
      if (sessionHistoryFirstFocus.current) {
        sessionHistoryFirstFocus.current = false;
        return;
      }
      void refetchSessionHistory();
    }, [refetchSessionHistory])
  );

  const showEmptySessionHistory =
    !sessionHistoryLoading &&
    !sessionHistoryError &&
    sessionHistoryRows.length === 0;

  return (
    <SafeAreaView style={[layoutStyles.safe, { backgroundColor: screen.bg }]} edges={["top"]}>
      <ScrollView
        contentContainerStyle={layoutStyles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={screen.refreshTint}
          />
        }
      >
        <View style={layoutStyles.headerBlock}>
          <Text style={[layoutStyles.screenTitle, { color: screen.title }]}>
            History
          </Text>
          <Text style={[layoutStyles.subtitle, { color: screen.muted }]}>
            Sessions you have completed in the app, newest first.
          </Text>
        </View>

        {sessionHistoryLoading && sessionHistoryRows.length === 0 ? (
          <View style={layoutStyles.centerBlock}>
            <ActivityIndicator size="large" color={screen.refreshTint} />
          </View>
        ) : sessionHistoryError ? (
          <ThemedText style={layoutStyles.historyError}>
            {sessionHistoryError.message}
          </ThemedText>
        ) : (
          <>
            <View style={layoutStyles.calendarSection}>
              <View
                style={[
                  layoutStyles.calendarCard,
                  {
                    backgroundColor: isDark ? "#161616" : "#ffffff",
                    borderColor: isDark ? "#2e2e2e" : "#e8eaef",
                    shadowOpacity: isDark ? 0.4 : 0.08,
                  },
                ]}
              >
                <TouchableOpacity
                  style={layoutStyles.calendarHeaderPressable}
                  activeOpacity={sessionHistoryRows.length > 0 ? 0.65 : 1}
                  disabled={sessionHistoryRows.length === 0}
                  onPress={() => {
                    if (sessionHistoryRows.length === 0) return;
                    void Haptics.selectionAsync();
                    setCalendarExpanded((prev) => !prev);
                  }}
                  accessibilityRole={sessionHistoryRows.length > 0 ? "button" : "none"}
                  accessibilityLabel={
                    calendarExpanded
                      ? "Collapse activity calendar"
                      : "Expand activity calendar"
                  }
                >
                  <MaterialIcons
                    name="calendar-month"
                    size={22}
                    color={BRAND_GREEN}
                  />
                  <View style={layoutStyles.calendarHeaderMiddle}>
                    <Text
                      style={[
                        layoutStyles.calendarTitle,
                        { color: screen.title },
                      ]}
                    >
                      Activity
                    </Text>
                    <View
                      style={[
                        layoutStyles.statPill,
                        {
                          backgroundColor: isDark
                            ? "rgba(29, 158, 117, 0.14)"
                            : "rgba(29, 158, 117, 0.1)",
                          borderColor: isDark
                            ? "rgba(29, 158, 117, 0.35)"
                            : "rgba(29, 158, 117, 0.22)",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          layoutStyles.statPillText,
                          { color: BRAND_GREEN },
                        ]}
                      >
                        {activeDaysRolling30} active · 30d
                      </Text>
                    </View>
                  </View>
                  {sessionHistoryRows.length > 0 ? (
                    <MaterialIcons
                      name={calendarExpanded ? "expand-less" : "expand-more"}
                      size={26}
                      color={screen.muted}
                    />
                  ) : null}
                </TouchableOpacity>

                {calendarExpanded ? (
                  <>
                    <Text
                      style={[
                        layoutStyles.calendarHint,
                        { color: screen.muted },
                      ]}
                    >
                      Tap a day to show only sessions
                      completed on that day.
                    </Text>
                    <Calendar
                      enableSwipeMonths
                      hideExtraDays
                      firstDay={1}
                      markingType="dot"
                      markedDates={calendarMarkedDates}
                      theme={calendarTheme}
                      onDayPress={(day) => {
                        void Haptics.selectionAsync();
                        setSelectedCalendarDate((prev) =>
                          prev === day.dateString ? undefined : day.dateString,
                        );
                      }}
                    />
                  </>
                ) : (
                  <Text
                    style={[
                      layoutStyles.calendarCollapsedCaption,
                      { color: screen.muted },
                    ]}
                  >
                    Tap the Activity header to open the calendar
                    and filter by day.
                  </Text>
                )}
              </View>
            </View>

            {calendarExpanded && selectedCalendarDate ? (
              <View style={layoutStyles.filterChipRow}>
                <View
                  style={[
                    layoutStyles.filterChip,
                    {
                      backgroundColor: isDark ? "#1f1f1f" : "#f4f4f5",
                      borderColor: isDark ? "#3f3f46" : "#e4e4e7",
                    },
                  ]}
                >
                  <MaterialIcons
                    name="filter-list"
                    size={18}
                    color={BRAND_GREEN}
                  />
                  <Text
                    style={[
                      layoutStyles.filterChipLabel,
                      { color: screen.title },
                    ]}
                  >
                    {formatCalendarChipDate(selectedCalendarDate)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setSelectedCalendarDate(undefined)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel="Clear calendar filter"
                  >
                    <Text
                      style={[
                        layoutStyles.filterClear,
                        { color: screen.refreshTint },
                      ]}
                    >
                      Clear
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {showEmptySessionHistory ? (
              <View style={layoutStyles.centerBlock}>
                <MaterialIcons
                  name="event-available"
                  size={48}
                  color={screen.muted}
                />
                <Text
                  style={{
                    color: screen.muted,
                    textAlign: "center",
                    fontSize: 15,
                  }}
                >
                  No past sessions yet. When you complete a lesson in the app, it
                  will show up here.
                </Text>
              </View>
            ) : (
              <>
                {calendarExpanded &&
                selectedCalendarDate &&
                displayedSessionRows.length === 0 ? (
                  <Text
                    style={[
                      layoutStyles.filterEmpty,
                      { color: screen.muted },
                    ]}
                  >
                    No sessions on this day in your loaded history. Load more
                    below or pick another day.
                  </Text>
                ) : null}
                <View style={layoutStyles.cardList}>
                  {displayedSessionRows.map((row) => {
                    const diffKey = (row.difficulty ?? null) as DifficultyKey;
                    const paletteKey = diffKey ?? "none";
                    const styles = cardStylesByDifficulty[paletteKey];
                    const p = historyCardPalette(diffKey, isDark);
                    const diffLabel = difficultyLabel(row.difficulty);
                    const when = formatCompletedAt(row.completed_at);

                    return (
                      <View key={row.id} style={styles.cardContainer}>
                        <View style={styles.content}>
                          <View style={styles.header}>
                            <Text style={styles.title} numberOfLines={2}>
                              {row.session_title}
                            </Text>
                            <View style={styles.badgeRow}>
                              <View style={styles.badge}>
                                <Text style={styles.badgeText}>
                                  {diffLabel ?? "No difficulty"}
                                </Text>
                              </View>
                              {row.duration_minutes != null ? (
                                <View style={styles.badge}>
                                  <Text style={styles.badgeText}>
                                    {row.duration_minutes} min
                                  </Text>
                                </View>
                              ) : null}
                            </View>
                          </View>

                          {when ? (
                            <View style={styles.details}>
                              <View style={styles.detailRow}>
                                <MaterialIcons
                                  name="event"
                                  size={15}
                                  color={p.detailMuted}
                                />
                                <Text style={styles.detailText}>{when}</Text>
                              </View>
                            </View>
                          ) : null}

                          <TouchableOpacity
                            style={styles.button}
                            onPress={() =>
                              router.push({
                                pathname: "/session/[sessionId]",
                                params: { sessionId: row.session_id },
                              })
                            }
                            activeOpacity={0.85}
                          >
                            <Text style={styles.buttonText}>See details</Text>
                            <MaterialIcons
                              name="chevron-right"
                              size={17}
                              color={p.buttonAccent}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>

                <View style={layoutStyles.loadMoreSection}>
                  {sessionHistoryHasMore ? (
                    <TouchableOpacity
                      style={[
                        layoutStyles.loadMoreButton,
                        {
                          borderColor: screen.refreshTint,
                          backgroundColor: isDark
                            ? "rgba(96, 165, 250, 0.12)"
                            : "rgba(37, 99, 235, 0.08)",
                        },
                      ]}
                      onPress={() => void loadMoreSessionHistory()}
                      disabled={sessionHistoryLoadingMore}
                      activeOpacity={0.75}
                      accessibilityRole="button"
                      accessibilityLabel={`Load ${SESSION_HISTORY_PAGE_SIZE} more sessions`}
                    >
                      {sessionHistoryLoadingMore ? (
                        <ActivityIndicator color={screen.refreshTint} />
                      ) : (
                        <>
                          <View
                            style={[
                              layoutStyles.loadMoreIconCircle,
                              {
                                borderColor: screen.refreshTint,
                                backgroundColor: isDark
                                  ? "rgba(96, 165, 250, 0.2)"
                                  : "rgba(37, 99, 235, 0.12)",
                              },
                            ]}
                          >
                            <MaterialIcons
                              name="arrow-downward"
                              size={22}
                              color={screen.refreshTint}
                            />
                          </View>
                          <Text
                            style={[
                              layoutStyles.loadMoreLabel,
                              { color: screen.refreshTint },
                            ]}
                          >
                            Load {SESSION_HISTORY_PAGE_SIZE} more
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <Text
                      style={[layoutStyles.noMoreText, { color: screen.muted }]}
                    >
                      No more sessions to load
                    </Text>
                  )}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
