import AsyncStorage from "@react-native-async-storage/async-storage";

import { supabase } from "./supabase";

const ONBOARDING_FLOW_STEP_KEY = "onboarding_flow_step";

/** After welcome CTA; user may be on level or navigated back from goals. */
export const ONBOARDING_STEP_AFTER_WELCOME = "after_welcome";
/** After level CTA; user may be on goals or navigated back to level. */
export const ONBOARDING_STEP_AFTER_LEVEL = "after_level";

export async function setOnboardingFlowStep(
  step: typeof ONBOARDING_STEP_AFTER_WELCOME | typeof ONBOARDING_STEP_AFTER_LEVEL,
): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_FLOW_STEP_KEY, step);
}

export async function getOnboardingFlowStep(): Promise<string | null> {
  return AsyncStorage.getItem(ONBOARDING_FLOW_STEP_KEY);
}

export async function clearOnboardingFlowStep(): Promise<void> {
  await AsyncStorage.removeItem(ONBOARDING_FLOW_STEP_KEY);
}

function toErrorFromSupabase(err: {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
}): Error {
  const parts = [err.message, err.details, err.hint].filter(Boolean);
  const text =
    parts.length > 0 ? parts.join(" — ") : "Could not save to the server.";
  const e = new Error(text);
  e.name = err.code ? `PostgrestError(${err.code})` : "PostgrestError";
  return e;
}

/** Persists the level id chosen on onboarding (e.g. beginner, intermediate). */
export async function saveProfileLevel(level: string): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Not authenticated");

  const { error } = await supabase.rpc("set_user_profile_level", {
    p_level: level,
  });
  if (error) throw toErrorFromSupabase(error);
}

/** Persists onboarding goal ids (e.g. technique, fitness) on profiles.goals. */
export async function saveProfileGoals(goals: string[]): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Not authenticated");

  const { error } = await supabase.rpc("set_user_profile_goals", {
    p_goals: goals,
  });
  if (error) throw toErrorFromSupabase(error);
}

export async function completeOnboarding(): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Not authenticated");

  const { error } = await supabase.rpc("complete_user_onboarding", {});
  if (error) throw toErrorFromSupabase(error);
}

export async function getOnboardingStatus(): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return false;

  const { data, error } = await supabase.rpc(
    "get_user_onboarding_completed",
    {},
  );
  if (error) return false;
  return data === true;
}