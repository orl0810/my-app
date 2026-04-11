import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/src/context/AuthContext";
import {
  type AppearancePreference,
  useAppearancePreference,
} from "@/src/context/ColorSchemePreferenceContext";
import { useSessionContext } from "@/src/store/SessionContext";
import { supabase } from "@/src/utils/supabase";

const NOTIFICATIONS_KEY = "@ttcoach:notifications";

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  professional: "Professional",
};

function formatProfileLevel(level: string | null): string {
  if (!level) return "—";
  return LEVEL_LABELS[level] ?? level;
}

function initialsFromDisplayName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (
    (parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")
  ).toUpperCase();
}

export default function AccountScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";
  const { user, signOut } = useAuth();
  const { state } = useSessionContext();
  const { preference, setPreference } = useAppearancePreference();

  const [notificationsOn, setNotificationsOn] = useState(true);
  const [profileLevel, setProfileLevel] = useState<string | null>(null);
  const [sessionHistoryCount, setSessionHistoryCount] = useState(0);

  const loadProfileLevel = useCallback(async () => {
    if (!user?.id) {
      setProfileLevel(null);
      return;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("level")
      .eq("id", user.id)
      .maybeSingle();
    if (error) {
      setProfileLevel(null);
      return;
    }
    const raw = data?.level;
    setProfileLevel(
      typeof raw === "string" && raw.trim() ? raw.trim() : null,
    );
  }, [user?.id]);

  const loadSessionHistoryCount = useCallback(async () => {
    if (!user?.id) {
      setSessionHistoryCount(0);
      return;
    }
    const { count, error } = await supabase
      .from("session_history")
      .select("*", { count: "exact", head: true });

    if (error) {
      setSessionHistoryCount(0);
      return;
    }
    setSessionHistoryCount(count ?? 0);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      void loadProfileLevel();
      void loadSessionHistoryCount();
    }, [loadProfileLevel, loadSessionHistoryCount]),
  );

  useEffect(() => {
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
        if (raw === "0") setNotificationsOn(false);
        else if (raw === "1") setNotificationsOn(true);
      } catch {
        // keep default
      }
    })();
  }, []);

  const onToggleNotifications = useCallback((value: boolean) => {
    setNotificationsOn(value);
    void AsyncStorage.setItem(NOTIFICATIONS_KEY, value ? "1" : "0");
  }, []);

  const meta = user?.user_metadata as Record<string, unknown> | undefined;
  const fullName = useMemo(() => {
    const n = meta?.full_name ?? meta?.name;
    if (typeof n === "string" && n.trim()) return n.trim();
    if (user?.email) return user.email.split("@")[0] ?? "Usuario";
    return "Usuario";
  }, [meta, user?.email]);

  const username = useMemo(() => {
    const u = meta?.username ?? meta?.user_name ?? meta?.preferred_username;
    if (typeof u === "string" && u.trim()) {
      return u.startsWith("@") ? u : `@${u}`;
    }
    if (user?.email) {
      const local = user.email.split("@")[0] ?? "user";
      return `@${local}`;
    }
    return "@—";
  }, [meta, user?.email]);

  const email = user?.email ?? "—";

  const initials = initialsFromDisplayName(fullName);

  const sessionsDone = sessionHistoryCount;
  const favouritesSaved = state.favoriteIds.length;

  const c = useMemo(
    () =>
      isDark
        ? {
            bg: "#0d0d0d",
            card: "#1f1f1f",
            cardBorder: "#2e2e2e",
            text: "#ffffff",
            textMuted: "#a3a3a3",
            sectionLabel: "#737373",
            divider: "#333333",
            avatarBg: "#1e3a5f",
            signOut: "#f87171",
            segmentBg: "#262626",
            segmentActiveBorder: "#525252",
            segmentInactive: "#737373",
          }
        : {
            bg: "#f2f2f7",
            card: "#ffffff",
            cardBorder: "#e5e5ea",
            text: "#111111",
            textMuted: "#636366",
            sectionLabel: "#8e8e93",
            divider: "#e5e5ea",
            avatarBg: "#2563eb",
            signOut: "#dc2626",
            segmentBg: "#e5e5ea",
            segmentActiveBorder: "#0a7ea4",
            segmentInactive: "#636366",
          },
    [isDark]
  );

  const handleSignOut = useCallback(async () => {
    await signOut();
    router.replace("/");
  }, [router, signOut]);

  const appearanceOptions: AppearancePreference[] = ["light", "system", "dark"];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={[styles.avatar, { backgroundColor: c.avatarBg }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.headerTextCol}>
            <Text style={[styles.name, { color: c.text }]}>{fullName}</Text>
            <Text style={[styles.emailHeader, { color: c.textMuted }]}>
              {email}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: c.card, borderColor: c.cardBorder },
            ]}
          >
            <Text style={[styles.statLabel, { color: c.textMuted }]}>
              Sessions done
            </Text>
            <Text style={[styles.statValue, { color: c.text }]}>
              {sessionsDone}
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: c.card, borderColor: c.cardBorder },
            ]}
          >
            <Text style={[styles.statLabel, { color: c.textMuted }]}>
              Favourites saved
            </Text>
            <Text style={[styles.statValue, { color: c.text }]}>
              {favouritesSaved}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.group,
            { backgroundColor: c.card, borderColor: c.cardBorder },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: c.sectionLabel }]}>
            PROFILE
          </Text>
          <ProfileRow
            label="Full name"
            value={fullName}
            textColor={c.text}
            mutedColor={c.textMuted}
            dividerColor={c.divider}
          />
          <ProfileRow
            label="Username"
            value={username}
            textColor={c.text}
            mutedColor={c.textMuted}
            dividerColor={c.divider}
          />
          <ProfileRow
            label="Level"
            value={formatProfileLevel(profileLevel)}
            textColor={c.text}
            mutedColor={c.textMuted}
            dividerColor={c.divider}
          />
          <ProfileRow
            label="Email"
            value={email}
            textColor={c.text}
            mutedColor={c.textMuted}
            dividerColor={c.divider}
            showDivider={false}
          />
        </View>

        <View
          style={[
            styles.group,
            { backgroundColor: c.card, borderColor: c.cardBorder },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: c.sectionLabel }]}>APP</Text>
          <View
            style={[
              styles.row,
              styles.appRow,
              {
                borderBottomColor: c.divider,
                borderBottomWidth: StyleSheet.hairlineWidth,
              },
            ]}
          >
            <Text style={[styles.rowLabel, { color: c.text }]}>Notifications</Text>
            <Switch
              value={notificationsOn}
              onValueChange={onToggleNotifications}
              trackColor={{ false: "#3f3f46", true: "#22c55e" }}
              thumbColor="#f4f4f5"
            />
          </View>
          <View style={styles.appearanceRow}>
            <Text style={[styles.rowLabel, { color: c.text, flexShrink: 0 }]}>
              Appearance
            </Text>
            <View
              style={[
                styles.segment,
                { backgroundColor: c.segmentBg, flex: 1, marginLeft: 12, minWidth: 0 },
              ]}
            >
              {appearanceOptions.map((opt) => {
                const labels: Record<AppearancePreference, string> = {
                  light: "Light",
                  system: "System",
                  dark: "Dark",
                };
                const selected = preference === opt;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => setPreference(opt)}
                    style={[
                      styles.segmentItem,
                      selected && {
                        borderColor: c.segmentActiveBorder,
                        borderWidth: 1,
                        backgroundColor: isDark ? "#333333" : "#ffffff",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        {
                          color: selected ? c.text : c.segmentInactive,
                          fontWeight: selected ? "600" : "400",
                        },
                      ]}
                    >
                      {labels[opt]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => [
            styles.signOutCard,
            {
              backgroundColor: c.card,
              borderColor: c.cardBorder,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text style={[styles.signOutText, { color: c.signOut }]}>Sign out</Text>
          <Text style={[styles.chevron, { color: c.signOut }]}>›</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileRow({
  label,
  value,
  textColor,
  mutedColor,
  dividerColor,
  showDivider = true,
}: {
  label: string;
  value: string;
  textColor: string;
  mutedColor: string;
  dividerColor: string;
  showDivider?: boolean;
}) {
  return (
    <View>
      <Pressable style={styles.profileRowInner}>
        <Text style={[styles.profileLabel, { color: textColor }]}>{label}</Text>
        <View style={styles.profileValueRow}>
          <Text
            style={[styles.profileValue, { color: textColor }]}
            numberOfLines={1}
          >
            {value}
          </Text>
          <Text style={[styles.chevron, { color: mutedColor }]}>›</Text>
        </View>
      </Pressable>
      {showDivider ? (
        <View style={[styles.hairline, { backgroundColor: dividerColor }]} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "600",
  },
  headerTextCol: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
  },
  emailHeader: {
    fontSize: 15,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    minHeight: 88,
    justifyContent: "center",
  },
  statLabel: {
    fontSize: 13,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
  },
  group: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  profileRowInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    gap: 12,
  },
  profileLabel: {
    fontSize: 16,
    flexShrink: 0,
  },
  profileValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    justifyContent: "flex-end",
  },
  profileValue: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "right",
    flexShrink: 1,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  appRow: {
    paddingVertical: 12,
    marginBottom: 4,
  },
  appearanceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
  },
  rowLabel: {
    fontSize: 16,
  },
  segment: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  segmentText: {
    fontSize: 12,
  },
  chevron: {
    fontSize: 22,
    fontWeight: "300",
  },
  signOutCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
