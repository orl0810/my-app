import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSessionContext } from "@/src/store/SessionContext";
import { getSessionExerciseCount } from "@/src/utils/session-exercises";

export interface TrainingSession {
  id: number;
  title: string;
  type: "individual" | "group";
  duration: number;
  level: string;
  description?: string;
  objectives: string[];
  equipment: string[];
  /** API may send strings, objects, or omit; see {@link getSessionExerciseCount}. */
  exercises?: unknown;
  exercise_count?: number;
  exerciseCount?: number;
  coach?: string;
}

interface SessionCardProps {
  session: TrainingSession;
}

function sessionFavoriteId(id: number): string {
  return String(id);
}

const sessionCardPalette = {
  light: {
    cardBg: "#FFFFFF",
    cardBorder: "#E5E7EB",
    shadowOpacity: 0.08,
    title: "#111827",
    favoriteBg: "#F3F4F6",
    favoriteActive: "#DC2626",
    favoriteInactive: "#6B7280",
    badgeBg: "#F3F4F6",
    badgeBorder: "#D1D5DB",
    badgeText: "#374151",
    detailMuted: "#6B7280",
    detailText: "#4B5563",
    buttonBorder: "#DBEAFE",
    buttonBg: "#EFF6FF",
    buttonAccent: "#2563EB",
  },
  dark: {
    cardBg: "#1f1f1f",
    cardBorder: "#2e2e2e",
    shadowOpacity: 0.28,
    title: "#ffffff",
    favoriteBg: "#262626",
    favoriteActive: "#f87171",
    favoriteInactive: "#a3a3a3",
    badgeBg: "#262626",
    badgeBorder: "#404040",
    badgeText: "#d4d4d4",
    detailMuted: "#9ca3af",
    detailText: "#a3a3a3",
    buttonBorder: "#1e40af",
    buttonBg: "#172554",
    buttonAccent: "#60a5fa",
  },
} as const;

type SessionCardPalette =
  (typeof sessionCardPalette)["light"] | (typeof sessionCardPalette)["dark"];

function createSessionCardStyles(p: SessionCardPalette) {
  return StyleSheet.create({
    cardContainer: {
      backgroundColor: p.cardBg,
      borderWidth: 1,
      borderColor: p.cardBorder,
      borderRadius: 16,
      padding: 16,
      shadowColor: "#000",
      shadowOpacity: p.shadowOpacity,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    content: {
      gap: 12,
    },
    header: {
      gap: 8,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    title: {
      flex: 1,
      minWidth: 0,
      fontSize: 18,
      fontWeight: "700",
      color: p.title,
    },
    favoriteButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: p.favoriteBg,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    badge: {
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: p.badgeBorder,
      backgroundColor: p.badgeBg,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: "600",
      color: p.badgeText,
    },
    sessionDescription: {
      fontSize: 14,
      lineHeight: 20,
      color: p.detailText,
    },
    details: {
      gap: 8,
    },
    detailRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    detailText: {
      color: p.detailText,
      fontSize: 14,
    },
    button: {
      marginTop: 6,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 9,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: p.buttonBorder,
      backgroundColor: p.buttonBg,
    },
    buttonText: {
      color: p.buttonAccent,
      fontWeight: "700",
      fontSize: 14,
    },
  });
}

export function SessionCard({ session }: SessionCardProps) {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const p =
    colorScheme === "dark"
      ? sessionCardPalette.dark
      : sessionCardPalette.light;
  const styles = useMemo(() => createSessionCardStyles(p), [p]);

  const { toggleFavorite, isFavorite } = useSessionContext();
  const favId = sessionFavoriteId(session.id);
  const favorited = isFavorite(favId);

  return (
    <View style={styles.cardContainer}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {session.title}
            </Text>
            <Pressable
              onPress={() => toggleFavorite(favId)}
              style={styles.favoriteButton}
              accessibilityRole="button"
              accessibilityLabel={
                favorited ? "Quitar de favoritos" : "Marcar como favorita"
              }
              accessibilityState={{ selected: favorited }}
            >
              <MaterialIcons
                name={favorited ? "favorite" : "favorite-border"}
                size={22}
                color={
                  favorited ? p.favoriteActive : p.favoriteInactive
                }
              />
            </Pressable>
          </View>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {session.type === "individual" ? "Individual" : "Grupal"}
              </Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{session.level}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{session.duration} min</Text>
            </View>
          </View>
        </View>

        {typeof session.description === "string" &&
        session.description.trim().length > 0 ? (
          <Text
            style={styles.sessionDescription}
            numberOfLines={3}
            accessibilityRole="text"
          >
            {session.description.trim()}
          </Text>
        ) : null}

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <MaterialIcons name="fitness-center" size={16} color={p.detailMuted} />
            <Text style={styles.detailText}>
              {getSessionExerciseCount(
                session as unknown as Record<string, TrainingSession>
              )}{" "}
              exercises
            </Text>
          </View>
          {session.coach ? (
            <View style={styles.detailRow}>
              <MaterialIcons name="person" size={16} color={p.detailMuted} />
              <Text style={styles.detailText}>Coach: {session.coach}</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            router.push({
              pathname: "/session/[sessionId]",
              params: { sessionId: String(session.id) },
            })
          }
        >
          <Text style={styles.buttonText}>See details</Text>
          <MaterialIcons name="chevron-right" size={18} color={p.buttonAccent} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
