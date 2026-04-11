/** Minimal shape for entries grouped by completion day */
export type CompletedAtEntry = {
  completed_at: string;
};

/** Local calendar day `YYYY-MM-DD` for alignment with `react-native-calendars`. */
export function completedAtToCalendarKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type MarkedDay<T extends CompletedAtEntry = CompletedAtEntry> = {
  marked: true;
  dotColor: string;
  sessions: T[];
};

export type MarkedDatesMap<T extends CompletedAtEntry = CompletedAtEntry> = Record<
  string,
  MarkedDay<T>
>;

const BRAND_DOT_COLOR = "#1D9E75";

/**
 * Groups history rows by calendar day (UTC date from ISO `completed_at`).
 * Suitable for `react-native-calendars` plus a custom `sessions` list per day.
 */
export function buildMarkedDates<T extends CompletedAtEntry>(
  history: readonly T[],
): MarkedDatesMap<T> {
  const marked: MarkedDatesMap<T> = {};

  for (const entry of history) {
    const date = completedAtToCalendarKey(entry.completed_at);
    if (!date) continue;

    if (!marked[date]) {
      marked[date] = {
        marked: true,
        dotColor: BRAND_DOT_COLOR,
        sessions: [],
      };
    }

    marked[date].sessions.push(entry);
  }

  return marked;
}

/**
 * Counts unique calendar days that have at least one session in the rolling
 * last 30 days (compare by local midnight for `YYYY-MM-DD` keys).
 */
export function getActiveDaysThisMonth(
  markedDates: MarkedDatesMap,
): number {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  return Object.keys(markedDates).filter((dateKey) => {
    const day = new Date(`${dateKey}T00:00:00`);
    return !Number.isNaN(day.getTime()) && day >= thirtyDaysAgo;
  }).length;
}
