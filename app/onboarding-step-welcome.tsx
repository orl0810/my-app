import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useOnboardingScreenGuard } from "@/src/hooks/useOnboardingScreenGuard";
import {
  ONBOARDING_STEP_AFTER_WELCOME,
  setOnboardingFlowStep,
} from "@/src/utils/onboarding";

export default function OnboardingStepWelcome() {
  const router = useRouter();
  const { ready } = useOnboardingScreenGuard("welcome");

  if (!ready) {
    return (
      <View style={[styles.wrapper, styles.centered]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <Image
          style={styles.heroImage}
          source={{
            uri: "https://images.unsplash.com/photo-1646978567314-32cfd5a8854e?q=80&w=1555&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
          }}
          resizeMode="cover"
        />

        <View style={styles.textBlock}>
          <Text style={styles.title}>Welcome to TTCoach</Text>
          <Text style={styles.subtitle}>
            Your personal tennis coach. Improve your game with
            personalized sessions and professional tracking.
          </Text>
        </View>

        <View style={styles.featuresGrid}>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons
              name="trophy-outline"
              size={28}
              color="#16A34A"
              style={styles.featureIcon}
            />
            <Text style={styles.featureText}>Personalized training</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons
              name="target"
              size={28}
              color="#2563EB"
              style={styles.featureIcon}
            />
            <Text style={styles.featureText}>Achievable goals</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons
              name="calendar-month"
              size={28}
              color="#8B5CF6"
              style={styles.featureIcon}
            />
            <Text style={styles.featureText}>Flexible scheduling</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons
              name="account-group-outline"
              size={28}
              color="#F59E0B"
              style={styles.featureIcon}
            />
            <Text style={styles.featureText}>Expert coaches</Text>
          </View>
        </View>

        <Pressable
          style={styles.ctaButton}
          onPress={() => {
            void (async () => {
              await setOnboardingFlowStep(ONBOARDING_STEP_AFTER_WELCOME);
              router.push("/onboarding-step-level");
            })();
          }}
        >
          <Text style={styles.ctaText}>Get started</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    padding: 16,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
  heroImage: {
    width: "100%",
    height: 220,
  },
  textBlock: {
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 8,
    color: "#111827",
    textAlign: "center",
  },
  subtitle: {
    color: "#334155",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  featureItem: {
    width: "48%",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  featureIcon: {
    marginBottom: 8,
  },
  featureText: {
    color: "#334155",
    fontSize: 12,
    textAlign: "center",
  },
  ctaButton: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    marginTop: 10,
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
});
