import type { PostgrestError } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/src/utils/supabase";

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

/** Matches `session_history.difficulty` check constraint */
export type SessionDifficulty = "easy" | "good" | "hard";

export interface SessionHistoryRow {
  id: string;
  user_id: string;
  session_id: string;
  session_title: string;
  completed_at: string;
  difficulty: SessionDifficulty | null;
  duration_minutes: number | null;
}

export interface CompleteSessionInput {
  sessionId: string;
  sessionTitle: string;
  /** Post-session feedback; omit or null if not collected */
  difficulty?: SessionDifficulty | null;
  durationMinutes?: number | null;
}

/** Page size for history list + `loadMore` */
export const SESSION_HISTORY_PAGE_SIZE = 5;

/** Page size when summing `duration_minutes` without SQL aggregates (PostgREST aggregates are often disabled). */
const SESSION_HISTORY_DURATION_SUM_PAGE_SIZE = 500;

export interface UseSessionHistoryReturn {
  history: SessionHistoryRow[];
  loading: boolean;
  loadingMore: boolean;
  loadingAll: boolean;
  hasMore: boolean;
  error: PostgrestError | null;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  /** Fetches every remaining page and merges into `history`; sets `hasMore` false. Returns whether the full fetch finished without error. */
  loadAllHistory: () => Promise<boolean>;
  completeSession: (
    input: CompleteSessionInput,
  ) => Promise<{
    data: SessionHistoryRow | null;
    error: PostgrestError | Error | null;
  }>;
}

export function useSessionHistory(): UseSessionHistoryReturn {
  const [history, setHistory] = useState<SessionHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetchRange = useCallback(
    async (
      offset: number,
    ): Promise<{
      rows: SessionHistoryRow[];
      error: PostgrestError | null;
      noUser: boolean;
    }> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { rows: [], error: null, noUser: true };
      }

      const { data, error: queryError } = await supabase
        .from("session_history")
        .select("*")
        .order("completed_at", { ascending: false })
        .range(offset, offset + SESSION_HISTORY_PAGE_SIZE - 1);

      if (queryError) {
        return { rows: [], error: queryError, noUser: false };
      }

      return {
        rows: (data ?? []) as SessionHistoryRow[],
        error: null,
        noUser: false,
      };
    },
    []
  );

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { rows, error: queryError, noUser } = await fetchRange(0);

    if (noUser) {
      setHistory([]);
      setHasMore(false);
      setLoading(false);
      return;
    }

    if (queryError) {
      setError(queryError);
      setHistory([]);
      setHasMore(false);
    } else {
      setHistory(rows);
      setHasMore(rows.length === SESSION_HISTORY_PAGE_SIZE);
    }

    setLoading(false);
  }, [fetchRange]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || loadingAll || !hasMore) return;

    setLoadingMore(true);
    setError(null);

    const offset = history.length;
    const { rows, error: queryError, noUser } = await fetchRange(offset);

    if (noUser) {
      setLoadingMore(false);
      return;
    }

    if (queryError) {
      setError(queryError);
    } else {
      setHistory((prev) => [...prev, ...rows]);
      setHasMore(rows.length === SESSION_HISTORY_PAGE_SIZE);
    }

    setLoadingMore(false);
  }, [fetchRange, hasMore, history.length, loading, loadingAll, loadingMore]);

  const loadAllHistory = useCallback(async (): Promise<boolean> => {
    if (loading || loadingMore || loadingAll) return false;

    setLoadingAll(true);
    setError(null);

    let allRows = [...history];
    let offset = allRows.length;

    try {
      while (true) {
        const { rows, error: queryError, noUser } = await fetchRange(offset);
        if (noUser) {
          return false;
        }
        if (queryError) {
          setError(queryError);
          return false;
        }
        allRows = [...allRows, ...rows];
        if (rows.length < SESSION_HISTORY_PAGE_SIZE) {
          setHistory(allRows);
          setHasMore(false);
          return true;
        }
        offset += SESSION_HISTORY_PAGE_SIZE;
      }
    } finally {
      setLoadingAll(false);
    }
  }, [fetchRange, history, loading, loadingAll, loadingMore]);

  useEffect(() => {
    void refetch();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refetch();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refetch]);

  const completeSession = useCallback(
    async ({
      sessionId,
      sessionTitle,
      difficulty = null,
      durationMinutes = null,
    }: CompleteSessionInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return {
          data: null,
          error: new Error("Not authenticated"),
        };
      }

      const { data, error: insertError } = await supabase
        .from("session_history")
        .insert({
          user_id: user.id,
          session_id: sessionId,
          session_title: sessionTitle,
          difficulty,
          duration_minutes: durationMinutes,
        })
        .select()
        .single();

      if (insertError) {
        return { data: null, error: insertError };
      }

      const row = data as SessionHistoryRow;
      setHistory((prev) => [row, ...prev]);

      return { data: row, error: null };
    },
    [],
  );

  return {
    history,
    loading,
    loadingMore,
    loadingAll,
    hasMore,
    error,
    refetch,
    loadMore,
    loadAllHistory,
    completeSession,
  };
}

/**
 * Count of `session_history` rows for the current week (Mon 00:00 – next Mon 00:00, local),
 * aligned with home stats cards. `null` when unauthenticated or on query error (use fallback UI).
 */
export function useSessionsThisWeekFromHistory(): {
  count: number | null;
  loading: boolean;
  refetch: () => Promise<void>;
} {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCount = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true;
    if (!silent) setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setCount(null);
      if (!silent) setLoading(false);
      return;
    }

    const now = new Date();
    const weekStart = startOfMondayWeek(now);
    const weekEnd = addDays(weekStart, 7);

    const { count: n, error: queryError } = await supabase
      .from("session_history")
      .select("*", { count: "exact", head: true })
      .gte("completed_at", weekStart.toISOString())
      .lt("completed_at", weekEnd.toISOString());

    if (queryError) {
      setCount(null);
    } else {
      setCount(n ?? 0);
    }

    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    void fetchCount();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void fetchCount();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchCount]);

  const refetch = useCallback(async () => {
    await fetchCount({ silent: true });
  }, [fetchCount]);

  return { count, loading, refetch };
}

/**
 * Sum of `duration_minutes` / 60 for all `session_history` rows (all time).
 * Uses paginated `select` instead of `sum()` because PostgREST aggregates are
 * often disabled on Supabase (`db-aggregates-enabled`), which would make the
 * aggregate request fail and the UI fall back to the wrong number.
 * `null` when unauthenticated or on query error (use fallback UI).
 */
export function useTotalTrainingHoursFromHistory(): {
  hours: number | null;
  loading: boolean;
  refetch: () => Promise<void>;
} {
  const [hours, setHours] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTotal = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true;
    if (!silent) setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setHours(null);
      if (!silent) setLoading(false);
      return;
    }

    let totalMinutes = 0;
    let offset = 0;

    for (;;) {
      const { data, error: queryError } = await supabase
        .from("session_history")
        .select("duration_minutes")
        .order("completed_at", { ascending: true })
        .range(
          offset,
          offset + SESSION_HISTORY_DURATION_SUM_PAGE_SIZE - 1,
        );

      if (queryError) {
        setHours(null);
        if (!silent) setLoading(false);
        return;
      }

      const rows = data ?? [];
      for (const row of rows) {
        const m = row.duration_minutes;
        if (typeof m === "number" && Number.isFinite(m)) {
          totalMinutes += m;
        }
      }

      if (rows.length < SESSION_HISTORY_DURATION_SUM_PAGE_SIZE) {
        break;
      }
      offset += SESSION_HISTORY_DURATION_SUM_PAGE_SIZE;
    }

    setHours(totalMinutes / 60);
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    void fetchTotal();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void fetchTotal();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchTotal]);

  const refetch = useCallback(async () => {
    await fetchTotal({ silent: true });
  }, [fetchTotal]);

  return { hours, loading, refetch };
}
