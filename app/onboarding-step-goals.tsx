import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  saveProfileGoals,
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
        style={styles.scroll}
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
                onPress={() => !isSubmitting && toggleGoal(goal.id)}
                style={({ pressed }) => [
                  styles.cardHit,
                  pressed && !isSubmitting && styles.cardPressed,
                ]}
              >
                <View
                  style={[
                    styles.cardFace,
                    isSelected && styles.cardFaceSelected,
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
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerButtonRow}>
          <View style={styles.footerButtonSlot}>
            <Pressable
              onPress={onBack}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.footerButtonPressable,
                (isSubmitting || pressed) && styles.buttonPressed,
              ]}
            >
              <View
                style={[
                  styles.buttonOutlineFace,
                  isSubmitting && styles.buttonOutlineFaceDisabled,
                ]}
              >
                <Text style={styles.buttonOutlineText}>Back</Text>
              </View>
            </Pressable>
          </View>
          <View style={styles.footerButtonSlot}>
            <Pressable
              onPress={handleNext}
              disabled={primaryDisabled || isSubmitting}
              style={({ pressed }) => [
                styles.footerButtonPressable,
                pressed &&
                  hasSelection &&
                  !isSubmitting &&
                  !primaryDisabled &&
                  styles.buttonPressed,
              ]}
            >
              <View
                style={[
                  styles.buttonPrimaryFace,
                  primaryDisabled && styles.buttonPrimaryFaceDisabled,
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
              </View>
            </Pressable>
          </View>
        </View>
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
      onNext={(goals) => {
        void (async () => {
          setIsSubmitting(true);
          try {
            await saveProfileGoals(goals);
            try {
              await completeOnboarding();
            } catch (e) {
              if (__DEV__) {
                console.warn(
                  "[onboarding] completeOnboarding failed, continuing home",
                  e,
                );
              }
            }
            await clearOnboardingFlowStep();
            markOnboardingCompleted();
            router.replace("/(tabs)");
          } catch (e) {
            const message =
              e instanceof Error
                ? e.message
                : typeof e === "object" &&
                    e !== null &&
                    "message" in e &&
                    typeof (e as { message: unknown }).message === "string"
                  ? (e as { message: string }).message
                  : "We couldn't save your goals.";
            Alert.alert("Error", message);
          } finally {
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
    backgroundColor: "#F3F4F6",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
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
  cardHit: {
    borderRadius: 16,
  },
  cardFace: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardFaceSelected: {
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
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  footerButtonRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
  },
  footerButtonSlot: {
    flex: 1,
    minWidth: 0,
  },
  footerButtonPressable: {
    flex: 1,
    alignSelf: "stretch",
  },
  buttonOutlineFace: {
    width: "100%",
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  buttonOutlineFaceDisabled: {
    opacity: 0.45,
  },
  buttonOutlineText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  buttonPrimaryFace: {
    width: "100%",
    minHeight: 52,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
  },
  buttonPrimaryFaceDisabled: {
    backgroundColor: "#E5E7EB",
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  buttonPrimaryTextDisabled: {
    color: "#6B7280",
    fontWeight: "600",
  },
  buttonPressed: {
    opacity: 0.9,
  },
});
