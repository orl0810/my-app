import { MaterialIcons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";

import type { TrainingSession } from "./session-card";

/** API may send schedule fields under several keys */
export type SessionWithSchedule = TrainingSession & {
  date?: string;
  session_date?: string;
  scheduled_at?: string;
  starts_at?: string;
  status?: string;
  completed?: boolean;
};

function parseSessionDate(session: SessionWithSchedule): Date | null {
  const raw =
    session.scheduled_at ??
    session.starts_at ??
    session.session_date ??
    session.date;
  if (raw == null || typeof raw !== "string" || raw.trim() === "") return null;
  const d = new Date(raw.trim());
  return Number.isNaN(d.getTime()) ? null : d;
}

function isCompleted(session: SessionWithSchedule): boolean {
  if (session.completed === true) return true;
  const s = (session.status ?? "").toLowerCase();
  return (
    s === "completed" ||
    s === "completada" ||
    s === "completado" ||
    s === "done"
  );
}

function startOfMondayWeek(ref: Date): Date {
  const d = new Date(ref);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + offset);
  return d;
}

function addDays(d: Date, days: number): Date {
  const n = new Date(d);
  n.setDate(n.getDate() + days);
  return n;
}

function isInRange(t: Date, startInclusive: Date, endExclusive: Date): boolean {
  return t >= startInclusive && t < endExclusive;
}

function formatHours(h: number): string {
  const rounded = Math.round(h * 10) / 10;
  if (Number.isInteger(rounded)) return `${rounded}h`;
  return `${rounded.toFixed(1)}h`;
}

function computeStats(sessions: SessionWithSchedule[], now: Date) {
  const anyScheduled = sessions.some((s) => parseSessionDate(s) !== null);

  const thisWeekStart = startOfMondayWeek(now);
  const thisWeekEnd = addDays(thisWeekStart, 7);
  const lastWeekStart = addDays(thisWeekStart, -7);
  const lastWeekEnd = thisWeekStart;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  let sessionsThisWeek = 0;
  let completedThisWeek = 0;
  let hoursThisMonth = 0;
  let hoursThisWeek = 0;
  let hoursLastWeek = 0;

  if (anyScheduled) {
    for (const session of sessions) {
      const at = parseSessionDate(session);
      if (!at) continue;

      if (isInRange(at, thisWeekStart, thisWeekEnd)) {
        sessionsThisWeek += 1;
        if (isCompleted(session)) completedThisWeek += 1;
      }

      const durH = (Number(session.duration) || 0) / 60;
      if (isCompleted(session) && isInRange(at, monthStart, monthEnd)) {
        hoursThisMonth += durH;
      }
      if (isCompleted(session)) {
        if (isInRange(at, thisWeekStart, thisWeekEnd)) hoursThisWeek += durH;
        else if (isInRange(at, lastWeekStart, lastWeekEnd)) hoursLastWeek += durH;
      }
    }
  } else {
    sessionsThisWeek = sessions.length;
    completedThisWeek = sessions.filter(isCompleted).length;
    hoursThisMonth = sessions.reduce(
      (acc, s) => acc + (Number(s.duration) || 0) / 60,
      0
    );
  }

  let trendPercent: number | null = null;
  if (anyScheduled && hoursLastWeek > 0) {
    trendPercent = Math.round(
      ((hoursThisWeek - hoursLastWeek) / hoursLastWeek) * 100
    );
  }

  return {
    anyScheduled,
    sessionsThisWeek,
    completedThisWeek,
    hoursThisMonth,
    trendPercent,
  };
}

type HomeStatsCardsProps = {
  sessions: SessionWithSchedule[];
};

const homeStatsPalette = {
  light: {
    cardBg: "#FFFFFF",
    cardBorder: "#E5E7EB",
    shadowOpacity: 0.06,
    cardTitle: "#6B7280",
    cardMetric: "#111827",
    cardSub: "#9CA3AF",
    iconBoxBlueBg: "#DBEAFE",
    iconBlue: "#2563EB",
    iconBoxGreenBg: "#DCFCE7",
    iconGreen: "#16A34A",
    divider: "#E5E7EB",
    trendUp: "#16A34A",
    trendDown: "#DC2626",
    trendMuted: "#6B7280",
  },
  dark: {
    cardBg: "#1f1f1f",
    cardBorder: "#2e2e2e",
    shadowOpacity: 0.28,
    cardTitle: "#9ca3af",
    cardMetric: "#ffffff",
    cardSub: "#737373",
    iconBoxBlueBg: "#172554",
    iconBlue: "#60a5fa",
    iconBoxGreenBg: "#14532d",
    iconGreen: "#4ade80",
    divider: "#2e2e2e",
    trendUp: "#4ade80",
    trendDown: "#f87171",
    trendMuted: "#9ca3af",
  },
} as const;

type HomeStatsPalette =
  (typeof homeStatsPalette)["light"] | (typeof homeStatsPalette)["dark"];

function createHomeStatsStyles(p: HomeStatsPalette) {
  return StyleSheet.create({
    wrap: {
      gap: 12,
      marginBottom: 16,
    },
    card: {
      backgroundColor: p.cardBg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: p.cardBorder,
      padding: 18,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: p.shadowOpacity,
      shadowRadius: 3,
      elevation: 2,
    },
    cardTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
    },
    cardTextCol: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: "500",
      color: p.cardTitle,
    },
    cardMetric: {
      fontSize: 32,
      fontWeight: "700",
      color: p.cardMetric,
      marginTop: 4,
    },
    cardSub: {
      fontSize: 13,
      color: p.cardSub,
      marginTop: 2,
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    iconBoxBlue: {
      backgroundColor: p.iconBoxBlueBg,
    },
    iconBoxGreen: {
      backgroundColor: p.iconBoxGreenBg,
    },
    divider: {
      height: 1,
      backgroundColor: p.divider,
      marginTop: 16,
      marginBottom: 12,
    },
    trendRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    trendText: {
      fontSize: 13,
      flex: 1,
      flexWrap: "wrap",
    },
    trendPct: {
      fontWeight: "700",
      color: p.trendUp,
    },
    trendPctDown: {
      color: p.trendDown,
    },
    trendMuted: {
      color: p.trendMuted,
      fontWeight: "400",
    },
  });
}

export function HomeStatsCards({ sessions }: HomeStatsCardsProps) {
  const colorScheme = useColorScheme() ?? "light";
  const p =
    colorScheme === "dark"
      ? homeStatsPalette.dark
      : homeStatsPalette.light;
  const styles = useMemo(() => createHomeStatsStyles(p), [p]);

  const stats = useMemo(
    () => computeStats(sessions, new Date()),
    [sessions]
  );

  const sessionsSubtitle = stats.anyScheduled
    ? `${stats.completedThisWeek} completada${stats.completedThisWeek === 1 ? "" : "s"}`
    : stats.completedThisWeek > 0
      ? `${stats.completedThisWeek} completada${stats.completedThisWeek === 1 ? "" : "s"}`
      : "In your list";

  const hoursSubtitle = stats.anyScheduled ? "This month" : "Sum of durations";

  const trendNode = useMemo(() => {
    if (!stats.anyScheduled || stats.trendPercent === null) return null;
    const up = stats.trendPercent >= 0;
    return (
      <View style={styles.trendRow}>
        <MaterialIcons
          name={up ? "trending-up" : "trending-down"}
          size={18}
          color={up ? p.trendUp : p.trendDown}
        />
        <Text style={styles.trendText}>
          <Text style={[styles.trendPct, !up && styles.trendPctDown]}>
            {up ? "+" : ""}
            {stats.trendPercent}%
          </Text>
          <Text style={styles.trendMuted}> vs semana anterior</Text>
        </Text>
      </View>
    );
  }, [p, stats.anyScheduled, stats.trendPercent, styles]);

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardTextCol}>
            <Text style={styles.cardTitle}>Sessions this week</Text>
            <Text style={styles.cardMetric}>{stats.sessionsThisWeek}</Text>
            <Text style={styles.cardSub}>{sessionsSubtitle}</Text>
          </View>
          <View style={[styles.iconBox, styles.iconBoxBlue]}>
            <MaterialIcons name="calendar-today" size={22} color={p.iconBlue} />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardTextCol}>
            <Text style={styles.cardTitle}>Training hours</Text>
            <Text style={styles.cardMetric}>
              {formatHours(stats.hoursThisMonth)}
            </Text>
            <Text style={styles.cardSub}>{hoursSubtitle}</Text>
          </View>
          <View style={[styles.iconBox, styles.iconBoxGreen]}>
            <MaterialIcons name="show-chart" size={22} color={p.iconGreen} />
          </View>
        </View>
        {trendNode ? (
          <>
            <View style={styles.divider} />
            {trendNode}
          </>
        ) : null}
      </View>
    </View>
  );
}
