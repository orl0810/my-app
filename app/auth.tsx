import { useRouter } from "expo-router";
import { useState, type ReactElement } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { supabase } from "@/src/utils/supabase";

type PendingAction = "signIn" | "signUp";

export default function AuthScreen(): ReactElement {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [pending, setPending] = useState<PendingAction | null>(null);

  const handleSignIn = (): void => {
    void (async () => {
      setPending("signIn");
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      setPending(null);
      if (error) {
        Alert.alert("Error", error.message);
        return;
      }
      router.replace("/(tabs)");
    })();
  };

  const handleSignUp = (): void => {
    void (async () => {
      setPending("signUp");
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      setPending(null);
      if (error) {
        Alert.alert("Error", error.message);
        return;
      }
      if (data.session) {
        router.replace("/(tabs)");
      } else {
        Alert.alert(
          "Check your email",
          "Confirm your address to finish creating your account."
        );
      }
    })();
  };

  const busy = pending !== null;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Sign in</Text>
            <Text style={styles.subtitle}>
              Use your email and password to continue.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.inputGap]}
              placeholder="you@example.com"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={!busy}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Your password"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!busy}
            />

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                busy && pending !== "signIn" && styles.btnMuted,
              ]}
              onPress={handleSignIn}
              disabled={busy}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
            >
              {pending === "signIn" ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryBtn,
                busy && pending !== "signUp" && styles.btnMuted,
              ]}
              onPress={handleSignUp}
              disabled={busy}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Sign up"
            >
              {pending === "signUp" ? (
                <ActivityIndicator color="#1d4ed8" />
              ) : (
                <Text style={styles.secondaryBtnText}>Sign Up</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    justifyContent: "center",
  },
  header: {
    marginBottom: 28,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: "#6b7280",
    textAlign: "center",
    maxWidth: 320,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#f9fafb",
  },
  inputGap: {
    marginBottom: 18,
  },
  primaryBtn: {
    width: "100%",
    minHeight: 52,
    marginTop: 22,
    borderRadius: 12,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtn: {
    width: "100%",
    minHeight: 52,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#2563eb",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  btnMuted: {
    opacity: 0.55,
  },
  primaryBtnText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "600",
  },
  secondaryBtnText: {
    color: "#1d4ed8",
    fontSize: 17,
    fontWeight: "600",
  },
});
