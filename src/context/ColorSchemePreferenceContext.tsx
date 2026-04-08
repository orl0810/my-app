import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme as useRNColorScheme } from "react-native";

const STORAGE_KEY = "@ttcoach:appearance";

export type AppearancePreference = "light" | "dark" | "system";

interface ColorSchemePreferenceValue {
  preference: AppearancePreference;
  setPreference: (value: AppearancePreference) => void;
  resolvedColorScheme: "light" | "dark";
}

export const ColorSchemePreferenceContext = createContext<
  ColorSchemePreferenceValue | undefined
>(undefined);

interface ColorSchemePreferenceProviderProps {
  children: ReactNode;
}

export function ColorSchemePreferenceProvider({
  children,
}: ColorSchemePreferenceProviderProps): ReactElement {
  const systemScheme = useRNColorScheme();
  const [preference, setPreferenceState] =
    useState<AppearancePreference>("system");

  useEffect(() => {
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw === "light" || raw === "dark" || raw === "system") {
          setPreferenceState(raw);
        }
      } catch {
        // keep default
      }
    })();
  }, []);

  const setPreference = useCallback((value: AppearancePreference) => {
    setPreferenceState(value);
    void AsyncStorage.setItem(STORAGE_KEY, value);
  }, []);

  const resolvedColorScheme: "light" | "dark" =
    preference === "system" ? (systemScheme ?? "light") : preference;

  const value = useMemo(
    () => ({ preference, setPreference, resolvedColorScheme }),
    [preference, setPreference, resolvedColorScheme]
  );

  return (
    <ColorSchemePreferenceContext.Provider value={value}>
      {children}
    </ColorSchemePreferenceContext.Provider>
  );
}

export function useAppearancePreference(): ColorSchemePreferenceValue {
  const ctx = useContext(ColorSchemePreferenceContext);
  if (ctx === undefined) {
    throw new Error(
      "useAppearancePreference must be used within ColorSchemePreferenceProvider"
    );
  }
  return ctx;
}
