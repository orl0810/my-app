import { Redirect } from "expo-router";
import type { ReactElement } from "react";

/** Legacy entry; routing sends new users to `/onboarding-step-welcome`. */
export default function OnboardingRedirect(): ReactElement {
  return <Redirect href="/onboarding-step-welcome" />;
}
