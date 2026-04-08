import type { Exercise } from "@/app/components/exercise-card";
import { TrainingSession } from "../types";

function pickRawExerciseArray(session: Record<string, unknown>): unknown[] {
  const keys = [
    "exercises",
    "workout_exercises",
    "Exercises",
  ] as const;
  for (const k of keys) {
    const v = session[k];
    if (Array.isArray(v)) return v;
  }
  const w = session.workout;
  if (w && typeof w === "object") {
    const wo = w as Record<string, unknown>;
    for (const k of keys) {
      const v = wo[k];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
}

function firstString(
  ...candidates: unknown[]
): string | undefined {
  for (const c of candidates) {
    if (typeof c === "string" && c.trim().length > 0) return c.trim();
  }
  return undefined;
}

/**
 * Maps webhook / API exercise payloads to {@link Exercise} (same rules as session detail).
 */
export function exercisesFromApi(raw: unknown): Exercise[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    if (typeof item === "string") {
      return {
        id: `str-${index}-${item.slice(0, 32)}`,
        title: item,
        description: "",
        duration: 0,
        videoUrls: [],
        tips: [],
      };
    }
    if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      const id =
        o.id != null && String(o.id).length > 0
          ? String(o.id)
          : `idx-${index}`;
      const title =
        firstString(o.title, o.name, o.label) ?? `Ejercicio ${index + 1}`;
      const description =
        firstString(
          o.description,
          o.summary,
          o.details,
          o.desc,
          o.notes,
          o.instructions
        ) ?? "";
      const duration =
        typeof o.duration === "number"
          ? o.duration
          : typeof o.duration_minutes === "number"
            ? o.duration_minutes
            : typeof o.minutes === "number"
              ? o.minutes
              : 0;
      const sets = typeof o.sets === "number" ? o.sets : undefined;
      const reps = typeof o.reps === "number" ? o.reps : undefined;
      const videoUrls = Array.isArray(o.videoUrls)
        ? o.videoUrls.filter((u): u is string => typeof u === "string")
        : Array.isArray(o.videos)
          ? o.videos.filter((u): u is string => typeof u === "string")
          : [];
      const videoThumbnails = Array.isArray(o.videoThumbnails)
        ? o.videoThumbnails.filter((u): u is string => typeof u === "string")
        : undefined;
      const tips = Array.isArray(o.tips)
        ? o.tips.filter((t): t is string => typeof t === "string")
        : [];
      const completed =
        typeof o.completed === "boolean" ? o.completed : undefined;
      return {
        id,
        title,
        description,
        duration,
        sets,
        reps,
        videoUrls,
        videoThumbnails,
        tips,
        completed,
      };
    }
    return {
      id: `idx-${index}`,
      title: String(item),
      description: "",
      duration: 0,
      videoUrls: [],
      tips: [],
    };
  });
}

/**
 * Counts exercises for a session from the list or detail API (supports alternate keys and numeric fallbacks).
 */
export function getSessionExerciseCount(session: Record<string, TrainingSession>): number {

  const picked = pickRawExerciseArray(session);
  const direct = session["session"];

  const arr =
    picked.length > 0
      ? picked
      : Array.isArray(direct)
        ? direct
        : [];
  if (arr.length > 0) return arr.length;

  const n =
    session.exercise_count ??
    session.exerciseCount ??
    session.exercises_count ??
    session.exercisesCount;
    
  if (typeof n === "number" && Number.isFinite(n) && n >= 0) {
    return Math.floor(n);
  }
  return 0;
}

/**
 * Raw exercise array for the session (for parsing with {@link exercisesFromApi}).
 */
export function getRawSessionExercises(
  session: Record<string, unknown>
): unknown[] {
  const picked = pickRawExerciseArray(session);
  if (picked.length > 0) return picked;
  const direct = session.exercises;
  return Array.isArray(direct) ? direct : [];
}
