import { Redirect } from "expo-router";
import type { ReactElement } from "react";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/src/context/AuthContext";

export default function Index(): ReactElement {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/auth" />;
}
