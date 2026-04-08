import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Platform, StyleSheet, Text, View } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";

export type MotivationalMessageVariant = "card" | "fullBleed";

interface MotivationalMessageProps {
  message: string;
  author: string;
  authorImage: string;
  /** `fullBleed`: no card chrome; stretches to fill the parent (e.g. parallax header). */
  variant?: MotivationalMessageVariant;
}

export function MotivationalMessage({
  message,
  author,
  authorImage,
  variant = "card",
}: MotivationalMessageProps) {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  if (variant === "fullBleed") {
    const quoteTint = isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.1)";
    return (
      <View style={styles.fullBleed}>
        <View style={styles.overlayContainer} pointerEvents="none">
          <View style={styles.quoteIconContainerFullBleed}>
            <MaterialIcons
              name="format-quote"
              size={Platform.OS === "web" ? 140 : 120}
              color={quoteTint}
            />
          </View>
        </View>

        <View style={styles.contentFullBleed}>
          <View style={styles.headerRow}>
            <View
              style={[
                styles.avatarWrapper,
                isDark ? styles.avatarRingDark : styles.avatarRingLight,
              ]}
            >
              <Image
                source={{ uri: authorImage }}
                placeholder={require("@/assets/images/partial-react-logo.png")}
                style={styles.avatar}
                contentFit="cover"
              />
            </View>
            <View style={styles.authorInfo}>
              <Text style={[styles.authorNameFullBleed, isDark && styles.authorNameDark]}>
                {author}
              </Text>
              <Text style={[styles.authorTitleFullBleed, isDark && styles.authorTitleDark]}>
                Tu entrenador
              </Text>
            </View>
          </View>

          <Text style={[styles.messageTextFullBleed, isDark && styles.messageTextDark]}>
            “{message}”
          </Text>

          <View style={[styles.dividerFullBleed, isDark ? styles.dividerDark : styles.dividerLight]} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.overlayContainer}>
        <View style={styles.quoteIconContainer}>
          <MaterialIcons
            name="format-quote"
            size={Platform.OS === "web" ? 120 : 100}
            color="rgba(255,255,255,0.5)"
          />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: authorImage }}
              placeholder={require("@/assets/images/partial-react-logo.png")}
              style={styles.avatar}
              contentFit="cover"
            />
          </View>
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{author}</Text>
            <Text style={styles.authorTitle}>Tu entrenador</Text>
          </View>
        </View>

        <Text style={styles.messageText}>“{message}”</Text>

        <View style={styles.divider} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullBleed: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  contentFullBleed: {
    position: "relative",
    zIndex: 1,
    flexDirection: "column",
    gap: 14,
    flex: 1,
    justifyContent: "center",
  },
  quoteIconContainerFullBleed: {
    position: "absolute",
    top: 8,
    right: 8,
    opacity: 1,
  },
  authorNameFullBleed: {
    color: "#0f172a",
    fontSize: 17,
    fontWeight: "700",
  },
  authorNameDark: {
    color: "#fff",
  },
  authorTitleFullBleed: {
    marginTop: 2,
    color: "rgba(15,23,42,0.65)",
    fontSize: 13,
  },
  authorTitleDark: {
    color: "rgba(255,255,255,0.82)",
  },
  messageTextFullBleed: {
    color: "#0f172a",
    fontSize: 17,
    lineHeight: 26,
    fontWeight: "600",
  },
  messageTextDark: {
    color: "#fff",
  },
  dividerFullBleed: {
    marginTop: 6,
    width: 56,
    height: 2,
    borderRadius: 1,
  },
  dividerLight: {
    backgroundColor: "rgba(15,23,42,0.2)",
  },
  dividerDark: {
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  avatarRingLight: {
    borderColor: "rgba(15,23,42,0.35)",
    backgroundColor: "rgba(15,23,42,0.08)",
  },
  avatarRingDark: {
    borderColor: "rgba(255,255,255,0.85)",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  card: {
    overflow: "hidden",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    padding: 16,
    backgroundColor: "#3B82F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  quoteIconContainer: {
    position: "absolute",
    top: 12,
    right: 12,
    opacity: 0.3,
  },
  content: {
    position: "relative",
    zIndex: 1,
    flexDirection: "column",
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarWrapper: {
    width: 56,
    height: 56,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.8)",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  authorTitle: {
    marginTop: 2,
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
  },
  messageText: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
  divider: {
    marginTop: 4,
    width: 48,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
});
