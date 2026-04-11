import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/src/context/AuthContext";
import { useOnboardingScreenGuard } from "@/src/hooks/useOnboardingScreenGuard";
import {
  clearOnboardingFlowStep,
  completeOnboarding,
} from "@/src/utils/onboarding";

export interface OnboardingStepGoalsProps {
  onNext: (goals: string[]) => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

type GoalConfig = {
  id: string;
  label: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
};

const goals: GoalConfig[] = [
  {
    id: "technique",
    label: "Improve technique",
    description: "Refine strokes and movement",
    icon: "target",
    color: "#2563EB",
  },
  {
    id: "fitness",
    label: "Improve fitness",
    description: "Build endurance and strength",
    icon: "heart-outline",
    color: "#DC2626",
  },
  {
    id: "competition",
    label: "Compete",
    description: "Play in tournaments and competitions",
    icon: "trophy-outline",
    color: "#CA8A04",
  },
  {
    id: "social",
    label: "Play socially",
    description: "Meet people and have fun",
    icon: "account-group-outline",
    color: "#16A34A",
  },
  {
    id: "speed",
    label: "Speed and agility",
    description: "Sharpen reflexes and quickness",
    icon: "lightning-bolt-outline",
    color: "#9333EA",
  },
  {
    id: "fun",
    label: "Have fun",
    description: "Enjoy the game and unwind",
    icon: "emoticon-happy-outline",
    color: "#EA580C",
  },
];

export function OnboardingStepGoals({
  onNext,
  onBack,
  isSubmitting = false,
}: OnboardingStepGoalsProps) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const toggleGoal = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((id) => id !== goalId)
        : [...prev, goalId],
    );
  };

  const handleNext = () => {
    if (selectedGoals.length > 0 && !isSubmitting) {
      onNext(selectedGoals);
    }
  };

  const hasSelection = selectedGoals.length > 0;
  const primaryDisabled = !hasSelection;

  return (
    <SafeAreaView style={styles.wrapper} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>What are your goals?</Text>
          <Text style={styles.subtitle}>
            Select all that apply (at least one)
          </Text>
        </View>

        <View style={styles.grid}>
          {goals.map((goal) => {
            const isSelected = selectedGoals.includes(goal.id);

            return (
              <Pressable
                key={goal.id}
                onPress={() => toggleGoal(goal.id)}
                style={({ pressed }) => [
                  styles.card,
                  isSelected && styles.cardSelected,
                  pressed && styles.cardPressed,
                ]}
              >
                <View style={styles.cardRow}>
                  <View
                    style={[
                      styles.iconWrap,
                      isSelected && styles.iconWrapSelected,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={goal.icon}
                      size={24}
                      color={isSelected ? "#FFFFFF" : goal.color}
                    />
                  </View>
                  <View style={styles.cardText}>
                    <Text style={styles.cardTitle}>{goal.label}</Text>
                    <Text style={styles.cardDescription}>
                      {goal.description}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={onBack}
          disabled={isSubmitting}
          style={({ pressed }) => [
            styles.buttonOutline,
            (isSubmitting || pressed) && styles.buttonPressed,
            isSubmitting && styles.buttonOutlineDisabled,
          ]}
        >
          <Text style={styles.buttonOutlineText}>Back</Text>
        </Pressable>
        <Pressable
          onPress={handleNext}
          disabled={primaryDisabled || isSubmitting}
          style={({ pressed }) => [
            styles.buttonPrimary,
            primaryDisabled && styles.buttonDisabled,
            pressed && hasSelection && !isSubmitting && styles.buttonPressed,
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              style={[
                styles.buttonPrimaryText,
                primaryDisabled && styles.buttonPrimaryTextDisabled,
              ]}
            >
              Continue
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default function OnboardingStepGoalsScreen() {
  const router = useRouter();
  const { markOnboardingCompleted } = useAuth();
  const { ready } = useOnboardingScreenGuard("goals");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!ready) {
    return (
      <SafeAreaView style={[styles.wrapper, styles.centered]} edges={["top", "bottom"]}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <OnboardingStepGoals
      isSubmitting={isSubmitting}
      onBack={() => router.back()}
      onNext={(_goals) => {
        void (async () => {
          setIsSubmitting(true);
          try {
            await completeOnboarding();
          } catch (e) {
            if (__DEV__) {
              console.warn("[onboarding] completeOnboarding failed, continuing home", e);
            }
          } finally {
            await clearOnboardingFlowStep();
            markOnboardingCompleted();
            router.replace("/(tabs)");
            setIsSubmitting(false);
          }
        })();
      }}
    />
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 340,
  },
  grid: {
    gap: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  iconWrap: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
  },
  iconWrapSelected: {
    backgroundColor: "#2563EB",
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#F8FAFC",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E2E8F0",
  },
  buttonOutline: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#94A3B8",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  buttonOutlineText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
  },
  buttonOutlineDisabled: {
    opacity: 0.5,
  },
  buttonPrimary: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#0F172A",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F172A",
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  buttonDisabled: {
    backgroundColor: "#F1F5F9",
    borderColor: "#94A3B8",
  },
  buttonPrimaryTextDisabled: {
    color: "#475569",
  },
  buttonPressed: {
    opacity: 0.9,
  },
});
