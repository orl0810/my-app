import { supabase } from "./supabase";

// ─── Favorites ───────────────────────────────────────────────

export async function toggleFavorite(sessionId: string): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error("Not authenticated");

  const { data: existing } = await supabase
    .from("favorite_sessions")
    .select("id")
    .eq("user_id", user.id)
    .eq("session_id", sessionId)
    .single();

  if (existing) {
    await supabase
      .from("favorite_sessions")
      .delete()
      .eq("user_id", user.id)
      .eq("session_id", sessionId);
    return false; // removed
  } else {
    await supabase
      .from("favorite_sessions")
      .insert({ user_id: user.id, session_id: sessionId });
    return true; // added
  }
}

export async function getFavorites(): Promise<string[]> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return [];

  const { data, error } = await supabase
    .from("favorite_sessions")
    .select("session_id")
    .eq("user_id", user.id);

  if (error) throw error;
  return data.map((row) => row.session_id);
}

export async function isFavorite(sessionId: string): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return false;

  const { data } = await supabase
    .from("favorite_sessions")
    .select("id")
    .eq("user_id", user.id)
    .eq("session_id", sessionId)
    .single();

  return !!data;
}

// ─── Progress ─────────────────────────────────────────────────

export interface SessionProgress {
  session_id: string;
  progress_percent: number;
  last_position_seconds: number;
  completed: boolean;
  updated_at: string;
  /** JSON string array of exercise ids when saved from session detail */
  completed_exercise_ids?: string | null;
}

export type SaveProgressOptions = {
  /** When set, stored as JSON so checkboxes restore correctly */
  completedExerciseIds?: string[];
};

export async function saveProgress(
  sessionId: string,
  progressPercent: number,
  lastPositionSeconds: number,
  options?: SaveProgressOptions
): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    console.log("Current session user:", session?.user?.email);
    const user = session?.user;
    if (!user) throw new Error("Not authenticated");

  const completed = progressPercent >= 95; // mark complete at 95%
  const ids = options?.completedExerciseIds;
  const positionSecs =
    ids !== undefined ? ids.length : lastPositionSeconds;

  const row: Record<string, unknown> = {
    user_id: user.id,
    session_id: sessionId,
    progress_percent: progressPercent,
    last_position_seconds: positionSecs,
    completed,
    updated_at: new Date().toISOString(),
  };
  if (ids !== undefined) {
    row.completed_exercise_ids = JSON.stringify(ids);
  }

  let { error } = await supabase
    .from("session_progress")
    .upsert(row, { onConflict: "user_id,session_id" });

  if (error && ids !== undefined && "completed_exercise_ids" in row) {
    const retryRow = { ...row };
    delete retryRow.completed_exercise_ids;
    ({ error } = await supabase
      .from("session_progress")
      .upsert(retryRow, { onConflict: "user_id,session_id" }));
  }

  if (error) throw error;
}

/** Resets `session_progress` for this session (no completed exercises). */
export async function clearSessionProgress(sessionId: string): Promise<void> {
  await saveProgress(sessionId, 0, 0, { completedExerciseIds: [] });
}

export async function getProgress(sessionId: string): Promise<SessionProgress | null> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return null;

  const { data, error } = await supabase
    .from("session_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("session_id", sessionId)
    .single();

  if (error) return null;
  return data;
}

export async function getAllProgress(): Promise<SessionProgress[]> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return [];

  const { data, error } = await supabase
    .from("session_progress")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data;
}