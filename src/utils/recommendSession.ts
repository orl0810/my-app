/**
 * Picks a session to recommend from catalog + completion history + profile.
 * Scoring mirrors a simple rules engine (level fit, novelty, spacing, goals, recency).
 */

export interface RecommendSessionCandidate {
  id: number | string;
  level: string;
  objectives?: string[];
}

export interface RecommendSessionHistoryEntry {
  session_id: string;
  completed_at: string;
}

export interface RecommendSessionUserProfile {
  level?: string | null;
  objectives?: string[] | null;
}

/** Onboarding goal ids → keywords often used in session objective copy */
const GOAL_OBJECTIVE_HINTS: Record<string, RegExp> = {
  technique: /técnica|tecnica|technique|technical/i,
  fitness:
    /condición|condicion|físic|fisic|fitness|cardio|resistencia|fuerza|physical|conditioning/i,
  competition: /compet|tournament|torneo|competition/i,
  social: /social|grupo|group|meet|diversión|diversion/i,
  speed: /velocidad|speed|agility|agilidad|rápid|rapido/i,
  fun: /diversión|diversion|fun|disfrut|enjoy/i,
};

function normalizeSessionId(id: number | string): string {
  return String(id);
}

function sessionLevelMatchesProfile(
  sessionLevel: string,
  profileLevel: string,
): boolean {
  const lv = sessionLevel.toLowerCase();
  const pl = profileLevel.trim().toLowerCase();
  if (!pl) return false;

  if (pl === "beginner") {
    return /principiante|beginner|básico|basico|iniciación|iniciacion|novato|starter/i.test(
      lv,
    );
  }
  if (pl === "intermediate") {
    return /intermedio|intermediate|medio/i.test(lv);
  }
  if (pl === "advanced" || pl === "professional") {
    return /avanzado|advanced|pro|experto|élite|elite|professional|profesional|crown/i.test(
      lv,
    );
  }

  return lv === pl || lv.includes(pl) || pl.includes(lv);
}

function userGoalMatchesSessionObjective(
  objectiveText: string,
  userGoal: string,
): boolean {
  const obj = objectiveText.toLowerCase();
  const ug = userGoal.toLowerCase();
  if (obj.includes(ug) || ug.includes(obj)) return true;
  const hint = GOAL_OBJECTIVE_HINTS[ug];
  return hint ? hint.test(objectiveText) : false;
}

function countMatchingObjectives(
  sessionObjectives: string[] | undefined,
  userObjectives: string[] | undefined,
): number {
  if (!sessionObjectives?.length || !userObjectives?.length) return 0;
  return sessionObjectives.filter((obj) =>
    userObjectives.some((uo) => userGoalMatchesSessionObjective(obj, uo)),
  ).length;
}

function buildLastCompletedDaysAgo(
  history: RecommendSessionHistoryEntry[],
  nowMs: number,
): Record<string, number> {
  const lastCompletedDaysAgo: Record<string, number> = {};
  const dayMs = 1000 * 60 * 60 * 24;

  for (const entry of history) {
    const days = Math.floor(
      (nowMs - new Date(entry.completed_at).getTime()) / dayMs,
    );
    const sid = normalizeSessionId(entry.session_id);
    if (
      !(sid in lastCompletedDaysAgo) ||
      days < lastCompletedDaysAgo[sid]!
    ) {
      lastCompletedDaysAgo[sid] = days;
    }
  }
  return lastCompletedDaysAgo;
}

/**
 * @returns Best-scoring session, or `null` if `sessions` is empty.
 */
export function recommendSession<T extends RecommendSessionCandidate>(
  sessions: T[],
  history: RecommendSessionHistoryEntry[],
  userProfile: RecommendSessionUserProfile,
  options?: { now?: number },
): T | null {
  if (sessions.length === 0) return null;

  const nowMs = options?.now ?? Date.now();
  const completedIds = new Set(
    history.map((h) => normalizeSessionId(h.session_id)),
  );
  const lastCompletedDaysAgo = buildLastCompletedDaysAgo(history, nowMs);
  const profileLevel = userProfile.level?.trim() ?? "";

  const scored = sessions.map((session) => {
    let score = 0;
    const sid = normalizeSessionId(session.id);

    if (profileLevel && sessionLevelMatchesProfile(session.level, profileLevel)) {
      score += 40;
    }

    if (!completedIds.has(sid)) {
      score += 30;
    }

    const daysAgo = lastCompletedDaysAgo[sid];
    if (daysAgo !== undefined && daysAgo >= 7) {
      score += 15;
    }

    score +=
      countMatchingObjectives(session.objectives, userProfile.objectives ?? undefined) *
      10;

    if (daysAgo !== undefined && daysAgo < 3) {
      score -= 50;
    }

    return { session, score };
  });

  return scored.reduce((best, cur) =>
    cur.score > best.score ? cur : best,
  ).session;
}
