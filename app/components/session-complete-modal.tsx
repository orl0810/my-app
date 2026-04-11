import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  type SessionDifficulty,
  type SessionRate,
  useSessionHistory,
} from "@/src/hooks/useSessionHistory";

const OPTIONS: {
  value: SessionDifficulty;
  label: string;
  emoji: string;
}[] = [
  { value: "hard", label: "Hard", emoji: "😅" },
  { value: "good", label: "Perfect", emoji: "💪" },
  { value: "easy", label: "Easy", emoji: "😎" },
];

export interface SessionCompleteModalSession {
  id: string;
  title: string;
}

export interface SessionCompleteModalProps {
  session: SessionCompleteModalSession;
  durationMinutes?: number | null;
  /** Close without saving (e.g. Android back). */
  onClose: () => void;
  /**
   * After a successful write to `session_history`. If omitted, `onClose` runs after save instead.
   */
  onSaved?: () => void | Promise<void>;
  /** When false, the modal is not shown (useful with a single parent that toggles visibility). */
  visible?: boolean;
}

export function SessionCompleteModal({
  session,
  durationMinutes,
  onClose,
  onSaved,
  visible = true,
}: SessionCompleteModalProps) {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  const [selected, setSelected] = useState<SessionDifficulty | null>(null);
  const [rate, setRate] = useState<SessionRate | null>(null);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { completeSession } = useSessionHistory();

  useEffect(() => {
    if (!visible) return;
    setSelected(null);
    setRate(null);
    setComment("");
    setSaveError(null);
    setSaving(false);
  }, [visible]);

  async function handleSave() {
    if (!selected || rate === null) return;
    setSaveError(null);
    setSaving(true);
    try {
      const trimmed = comment.trim();
      const { error } = await completeSession({
        sessionId: session.id,
        sessionTitle: session.title,
        difficulty: selected,
        durationMinutes: durationMinutes ?? null,
        rate,
        comments: trimmed.length > 0 ? trimmed : null,
      });

      if (error) {
        const message =
          "message" in error && typeof error.message === "string"
            ? error.message
            : error instanceof Error
              ? error.message
              : "No se pudo guardar. Inténtalo de nuevo.";
        setSaveError(message);
        return;
      }

      if (onSaved) {
        await onSaved();
      } else {
        onClose();
      }
    } finally {
      setSaving(false);
    }
  }

  const palette = isDark
    ? {
        overlay: "rgba(0,0,0,0.65)",
        card: "#1e293b",
        cardBorder: "rgba(255,255,255,0.08)",
        title: "#f8fafc",
        sub: "#94a3b8",
        optionBg: "rgba(255,255,255,0.06)",
        optionBorder: "rgba(255,255,255,0.1)",
        optionSelectedBg: "rgba(34,197,94,0.2)",
        optionSelectedBorder: "#22c55e",
        label: "#e2e8f0",
        sectionLabel: "#cbd5e1",
        starOn: "#fbbf24",
        starOff: "rgba(248,250,252,0.28)",
        inputBg: "rgba(255,255,255,0.06)",
        inputBorder: "rgba(255,255,255,0.12)",
        inputText: "#f8fafc",
        inputPlaceholder: "#64748b",
        btn: "#22c55e",
        btnDisabled: "rgba(255,255,255,0.12)",
        btnText: "#0f172a",
        btnTextDisabled: "rgba(248,250,252,0.45)",
      }
    : {
        overlay: "rgba(15,23,42,0.45)",
        card: "#ffffff",
        cardBorder: "rgba(15,23,42,0.08)",
        title: "#0f172a",
        sub: "#64748b",
        optionBg: "#f1f5f9",
        optionBorder: "transparent",
        optionSelectedBg: "rgba(34,197,94,0.12)",
        optionSelectedBorder: "#22c55e",
        label: "#334155",
        sectionLabel: "#475569",
        starOn: "#ca8a04",
        starOff: "#cbd5e1",
        inputBg: "#f8fafc",
        inputBorder: "rgba(15,23,42,0.12)",
        inputText: "#0f172a",
        inputPlaceholder: "#94a3b8",
        btn: "#16a34a",
        btnDisabled: "#e2e8f0",
        btnText: "#ffffff",
        btnTextDisabled: "#94a3b8",
      };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: palette.overlay }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardAvoid}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View
              style={[
                styles.card,
                {
                  backgroundColor: palette.card,
                  borderColor: palette.cardBorder,
                },
              ]}
            >
              <Text style={[styles.title, { color: palette.title }]}>
                Session completed!
              </Text>
              <Text style={[styles.sub, { color: palette.sub }]}>
                How was the level?
              </Text>

              <View style={styles.options}>
                {OPTIONS.map((opt) => {
                  const isSelected = selected === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      style={[
                        styles.option,
                        {
                          backgroundColor: isSelected
                            ? palette.optionSelectedBg
                            : palette.optionBg,
                          borderColor: isSelected
                            ? palette.optionSelectedBorder
                            : palette.optionBorder,
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                      onPress={() => {
                        setSaveError(null);
                        setSelected(opt.value);
                      }}
                    >
                      <Text style={styles.emoji}>{opt.emoji}</Text>
                      <Text style={[styles.optLabel, { color: palette.label }]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text
                style={[styles.sectionLabel, { color: palette.sectionLabel }]}
              >
                How would you rate the session?
              </Text>
              <View style={styles.starsRow}>
                {([1, 2, 3] as const).map((n) => {
                  const filled = rate != null && n <= rate;
                  return (
                    <Pressable
                      key={n}
                      onPress={() => {
                        setSaveError(null);
                        setRate(n);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`${n} de 3 estrellas`}
                      hitSlop={8}
                    >
                      <MaterialIcons
                        name={filled ? "star" : "star-border"}
                        size={40}
                        color={filled ? palette.starOn : palette.starOff}
                      />
                    </Pressable>
                  );
                })}
              </View>

              <Text
                style={[styles.sectionLabel, { color: palette.sectionLabel }]}
              >
                Comments{" "}
                <Text style={{ fontWeight: "400", fontSize: 13 }}>(optional)</Text>
              </Text>
              <TextInput
                style={[
                  styles.commentInput,
                  {
                    backgroundColor: palette.inputBg,
                    borderColor: palette.inputBorder,
                    color: palette.inputText,
                  },
                ]}
                placeholder="Anything you'd like to highlight?"
                placeholderTextColor={palette.inputPlaceholder}
                value={comment}
                onChangeText={(t) => {
                  setSaveError(null);
                  setComment(t);
                }}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />

              <Pressable
                style={[
                  styles.btn,
                  {
                    backgroundColor:
                      selected && rate != null
                        ? palette.btn
                        : palette.btnDisabled,
                  },
                ]}
                onPress={handleSave}
                disabled={!selected || rate === null || saving}
              >
                <Text
                  style={[
                    styles.btnText,
                    {
                      color:
                        selected && rate != null
                          ? palette.btnText
                          : palette.btnTextDisabled,
                    },
                  ]}
                >
                  {saving ? "Saving..." : "Save"}
                </Text>
              </Pressable>

              {saveError ? (
                <Text
                  style={[
                    styles.errorText,
                    { color: isDark ? "#f87171" : "#dc2626" },
                  ]}
                  accessibilityLiveRegion="polite"
                >
                  {saveError}
                </Text>
              ) : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  keyboardAvoid: {
    width: "100%",
    maxWidth: 360,
    maxHeight: "92%",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 8,
  },
  card: {
    width: "100%",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  sub: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 20,
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginBottom: 22,
  },
  option: {
    minWidth: 96,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  emoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  optLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
    marginTop: 4,
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  commentInput: {
    minHeight: 88,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  btn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  btnText: {
    fontSize: 16,
    fontWeight: "700",
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
