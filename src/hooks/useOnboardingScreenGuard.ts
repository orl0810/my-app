import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { useAuth } from "@/src/context/AuthContext";
import {
  getOnboardingFlowStep,
  ONBOARDING_STEP_AFTER_LEVEL,
  ONBOARDING_STEP_AFTER_WELCOME,
} from "@/src/utils/onboarding";

export type OnboardingGuardStep = "welcome" | "level" | "goals";

/**
 * Ensures only signed-in users who have not finished server onboarding see
 * these screens, and enforces welcome → level → goals order (via local step).
 */
export function useOnboardingScreenGuard(step: OnboardingGuardStep): {
  ready: boolean;
} {
  const router = useRouter();
  const { session, onboardingCompleted, isLoading } = useAuth();
  const [flowChecked, setFlowChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (isLoading) return;

    if (!session) {
      router.replace("/auth");
      return;
    }

    if (onboardingCompleted) {
      router.replace("/(tabs)");
      return;
    }

    if (step === "welcome") {
      setFlowChecked(true);
      return;
    }

    setFlowChecked(false);

    void (async () => {
      const flowStep = await getOnboardingFlowStep();

      if (cancelled) return;

      if (step === "level") {
        if (
          flowStep !== ONBOARDING_STEP_AFTER_WELCOME &&
          flowStep !== ONBOARDING_STEP_AFTER_LEVEL
        ) {
          router.replace("/onboarding-step-welcome");
          return;
        }
      }

      if (step === "goals") {
        if (flowStep !== ONBOARDING_STEP_AFTER_LEVEL) {
          router.replace(
            flowStep === ONBOARDING_STEP_AFTER_WELCOME
              ? "/onboarding-step-level"
              : "/onboarding-step-welcome",
          );
          return;
        }
      }

      if (!cancelled) setFlowChecked(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoading, session, onboardingCompleted, step, router]);

  return {
    ready: !isLoading && !!session && !onboardingCompleted && flowChecked,
  };
}
