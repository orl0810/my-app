import { useContext } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";

import { ColorSchemePreferenceContext } from "@/src/context/ColorSchemePreferenceContext";

export function useColorScheme() {
  const ctx = useContext(ColorSchemePreferenceContext);
  const system = useRNColorScheme();
  if (ctx !== undefined) {
    return ctx.resolvedColorScheme;
  }
  return system;
}
