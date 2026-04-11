import { useState } from "react";

import { supabase } from "@/src/utils/supabase";

export type PaywallAction = "viewed" | "tapped_upgrade" | "dismissed";

export function usePaywall() {
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [currentFeature, setCurrentFeature] = useState<string | null>(null);

  async function trackInteraction(
    feature: string | null,
    action: PaywallAction,
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("paywall_interactions").insert({
      user_id: user.id,
      feature,
      action,
    });
  }

  function showPaywall(feature: string) {
    setCurrentFeature(feature);
    setPaywallVisible(true);
    void trackInteraction(feature, "viewed");
  }

  function handleUpgradeTap() {
    void trackInteraction(currentFeature, "tapped_upgrade");
    setPaywallVisible(false);
    // v2: navegar al flujo de pago real
  }

  function handleDismiss() {
    void trackInteraction(currentFeature, "dismissed");
    setPaywallVisible(false);
  }

  return {
    paywallVisible,
    currentFeature,
    showPaywall,
    handleUpgradeTap,
    handleDismiss,
  };
}
