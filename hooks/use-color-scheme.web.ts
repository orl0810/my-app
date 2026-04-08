import { useContext, useEffect, useState } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";

import { ColorSchemePreferenceContext } from "@/src/context/ColorSchemePreferenceContext";

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const ctx = useContext(ColorSchemePreferenceContext);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const system = useRNColorScheme();

  if (ctx !== undefined) {
    return ctx.resolvedColorScheme;
  }

  if (hasHydrated) {
    return system;
  }

  return "light";
}
