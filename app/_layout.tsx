import type { ReactElement } from "react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider } from "@/src/context/AuthContext";
import { ColorSchemePreferenceProvider } from "@/src/context/ColorSchemePreferenceContext";
import { SessionProvider } from "@/src/store/SessionContext";

export const unstable_settings = {
  // anchor: "(tabs)",
};

export default function RootLayout(): ReactElement {
  return (
    <AuthProvider>
      <ColorSchemePreferenceProvider>
        <RootLayoutInner />
      </ColorSchemePreferenceProvider>
    </AuthProvider>
  );
}

function RootLayoutInner(): ReactElement {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <SessionProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="onboarding-step-welcome" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="session/[sessionId]" />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "Modal" }}
          />
        </Stack>
        <StatusBar style="auto" />
      </SessionProvider>
    </ThemeProvider>
  );

  /* return (
    <SessionProvider>
      <RootNavigator />
    </SessionProvider>
  ); */
}
