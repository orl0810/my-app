import { MaterialIcons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import { Image } from "expo-image";
import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/use-color-scheme";

export interface Exercise {
  id: string;
  title: string;
  description: string;
  duration: number;
  sets?: number;
  reps?: number;
  videoUrls: string[];
  videoThumbnails?: string[];
  tips: string[];
  completed?: boolean;
}

/** First path segment after /upload/ looks like a Cloudinary transformation token. */
const CLOUDINARY_TRANSFORM_SEGMENT =
  /^(w_|h_|c_|q_|f_|g_|x_|y_|z_|ar_|bo_|br_|cs_|dn_|du_|eo_|fl_|if_|pg_|so_|vc_|vs_|co_|t_|u_|l_|o_|r_|a_|b_|d_|e_)/i;

/**
 * Derives a Cloudinary JPG poster (frame at 0s) from a direct video delivery URL.
 * Handles transformation segments, version tokens (v123…), folders, query strings,
 * and normalizes accidental double slashes after the hostname.
 */
export function buildCloudinaryThumbnail(videoUrl: string): string {
  const trimmed = videoUrl.trim();
  const normalized = trimmed.replace(
    /^(https?:\/\/res\.cloudinary\.com)\/+/i,
    "$1/"
  );

  try {
    const u = new URL(normalized);
    const marker = "/video/upload/";
    const path = u.pathname.replace(/\/{2,}/g, "/");
    const mi = path.indexOf(marker);
    if (mi < 0) {
      return normalized.replace(/\.mp4($|[?#])/i, ".jpg$1");
    }

    const head = path.slice(0, mi + marker.length);
    const segs = path.slice(mi + marker.length).split("/").filter(Boolean);
    if (segs.length === 0) return normalized;

    const last = segs[segs.length - 1];
    if (!/\.mp4$/i.test(last)) {
      return normalized;
    }

    segs[segs.length - 1] = last.replace(/\.mp4$/i, ".jpg");

    const first = segs[0];
    if (first === "so_0" || first.startsWith("so_0,")) {
      u.pathname = head + segs.join("/");
      return u.toString();
    }

    const isTransform =
      first.includes(",") || CLOUDINARY_TRANSFORM_SEGMENT.test(first);

    if (isTransform) {
      segs[0] = `so_0,${first}`;
    } else {
      segs.unshift("so_0");
    }

    u.pathname = head + segs.join("/");
    return u.toString();
  } catch {
    return normalized
      .replace("/video/upload/", "/video/upload/so_0/")
      .replace(/\.mp4($|[?#])/i, ".jpg$1");
  }
}

function thumbnailUriForExercise(
  exercise: Exercise,
  videoIndex: number,
  videoUrl: string
): string {
  const explicit = exercise.videoThumbnails?.[videoIndex]?.trim();
  if (explicit) return explicit;
  return buildCloudinaryThumbnail(videoUrl);
}

interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
  onToggleComplete?: (exerciseId: string) => void;
}

const exerciseCardPalette = {
  light: {
    cardBg: "#FFFFFF",
    cardBorder: "#E5E7EB",
    shadowOpacity: 0.08,
    mediaBg: "#111827",
    iconMuted: "#6B7280",
    primary: "#2563EB",
    indexBadgeBg: "#DBEAFE",
    indexBadgeText: "#2563EB",
    title: "#111827",
    description: "#4B5563",
    descriptionLabel: "#15803D",
    completeDoneBg: "#DCFCE7",
    completeIdleBg: "#F3F4F6",
    checkDone: "#16A34A",
    checkIdle: "#9CA3AF",
    badgeBlueBorder: "#BFDBFE",
    badgeBlueBg: "#EFF6FF",
    badgeBlueText: "#1D4ED8",
    badgeGreenBorder: "#BBF7D0",
    badgeGreenBg: "#F0FDF4",
    badgeGreenText: "#15803D",
    badgePurpleBorder: "#E9D5FF",
    badgePurpleBg: "#FAF5FF",
    badgePurpleText: "#7E22CE",
    tipsBg: "#FFFBEB",
    tipsBorder: "#FDE68A",
    tipsHeading: "#78350F",
    tipsText: "#92400E",
    playCircleBg: "#FFFFFF",
  },
  dark: {
    cardBg: "#1f1f1f",
    cardBorder: "#2e2e2e",
    shadowOpacity: 0.28,
    mediaBg: "#0a0a0a",
    iconMuted: "#9ca3af",
    primary: "#60a5fa",
    indexBadgeBg: "#1e3a5f",
    indexBadgeText: "#60a5fa",
    title: "#ffffff",
    description: "#a3a3a3",
    descriptionLabel: "#86efac",
    completeDoneBg: "#14532d",
    completeIdleBg: "#262626",
    checkDone: "#4ade80",
    checkIdle: "#737373",
    badgeBlueBorder: "#1e40af",
    badgeBlueBg: "#172554",
    badgeBlueText: "#93c5fd",
    badgeGreenBorder: "#166534",
    badgeGreenBg: "#14532d",
    badgeGreenText: "#86efac",
    badgePurpleBorder: "#6b21a8",
    badgePurpleBg: "#3b0764",
    badgePurpleText: "#e9d5ff",
    tipsBg: "#422006",
    tipsBorder: "#b45309",
    tipsHeading: "#fde68a",
    tipsText: "#fcd34d",
    playCircleBg: "#e5e7eb",
  },
} as const;

type ExerciseCardPalette =
  (typeof exerciseCardPalette)["light"] | (typeof exerciseCardPalette)["dark"];

function createExerciseCardStyles(p: ExerciseCardPalette) {
  return StyleSheet.create({
    card: {
      backgroundColor: p.cardBg,
      borderRadius: 16,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOpacity: p.shadowOpacity,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    row: {
      flexDirection: "column",
      gap: 16,
      padding: 20,
    },
    rowWide: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    mediaColumn: {
      width: "100%",
    },
    mediaColumnWide: {
      width: 256,
      flexShrink: 0,
    },
    aspectBox: {
      width: "100%",
      aspectRatio: 16 / 9,
      backgroundColor: p.mediaBg,
      borderRadius: 12,
      overflow: "hidden",
    },
    noVideoPlaceholder: {
      justifyContent: "center",
      alignItems: "center",
    },
    videoScrollContent: {
      flexGrow: 1,
      gap: 12,
      alignItems: "flex-start",
    },
    videoTile: {
      flexShrink: 0,
    },
    videoTileAspect: {
      position: "relative",
      width: "100%",
      aspectRatio: 16 / 9,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: p.mediaBg,
    },
    thumbnailWrap: {
      flex: 1,
      position: "relative",
    },
    thumbnail: {
      ...StyleSheet.absoluteFillObject,
    },
    playOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.4)",
    },
    playCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: p.playCircleBg,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    },
    playIcon: {
      marginLeft: 4,
    },
    body: {
      flex: 1,
      minWidth: 0,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 12,
    },
    titleLeft: {
      flex: 1,
      flexDirection: "row",
      gap: 12,
      minWidth: 0,
    },
    indexBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: p.indexBadgeBg,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 4,
    },
    indexText: {
      fontSize: 14,
      fontWeight: "700",
      color: p.indexBadgeText,
    },
    titleBlock: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: 17,
      fontWeight: "700",
      color: p.title,
      marginBottom: 4,
    },
    descriptionBlock: {
      marginTop: 4,
    },
    descriptionLabel: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.5,
      textTransform: "uppercase",
      color: p.descriptionLabel,
      marginBottom: 6,
    },
    description: {
      fontSize: 14,
      color: p.description,
      lineHeight: 22,
    },
    completeBtn: {
      padding: 8,
      borderRadius: 10,
    },
    completeBtnDone: {
      backgroundColor: p.completeDoneBg,
    },
    completeBtnIdle: {
      backgroundColor: p.completeIdleBg,
    },
    badgeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 12,
    },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 999,
      borderWidth: 1,
    },
    badgeBlue: {
      borderColor: p.badgeBlueBorder,
      backgroundColor: p.badgeBlueBg,
    },
    badgeTextBlue: {
      fontSize: 12,
      fontWeight: "600",
      color: p.badgeBlueText,
    },
    badgeGreen: {
      borderColor: p.badgeGreenBorder,
      backgroundColor: p.badgeGreenBg,
    },
    badgeTextGreen: {
      fontSize: 12,
      fontWeight: "600",
      color: p.badgeGreenText,
    },
    badgePurple: {
      borderColor: p.badgePurpleBorder,
      backgroundColor: p.badgePurpleBg,
    },
    badgeTextPurple: {
      fontSize: 12,
      fontWeight: "600",
      color: p.badgePurpleText,
    },
    tipsBox: {
      backgroundColor: p.tipsBg,
      borderWidth: 1,
      borderColor: p.tipsBorder,
      borderRadius: 12,
      padding: 12,
    },
    tipsHeading: {
      fontSize: 14,
      fontWeight: "600",
      color: p.tipsHeading,
      marginBottom: 8,
    },
    tipLine: {
      fontSize: 14,
      color: p.tipsText,
      lineHeight: 20,
      marginBottom: 4,
    },
    videoModalRoot: {
      flex: 1,
      backgroundColor: "#000",
    },
    videoModalVideo: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "#000",
    },
    videoModalLoading: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#000",
    },
    videoModalClose: {
      position: "absolute",
      zIndex: 2,
      padding: 8,
      borderRadius: 999,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
  });
}

export function ExerciseCard({
  exercise,
  index,
  onToggleComplete,
}: ExerciseCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const p =
    colorScheme === "dark"
      ? exerciseCardPalette.dark
      : exerciseCardPalette.light;
  const styles = useMemo(() => createExerciseCardStyles(p), [p]);

  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, {
        duration: 2600,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );
  }, [pulse]);

  const borderPulse = useMemo(
    () =>
      colorScheme === "dark"
        ? (["rgba(74, 222, 128, 0.42)", "rgba(45, 212, 191, 0.95)"] as const)
        : (["rgba(34, 197, 94, 0.38)", "rgba(21, 128, 61, 0.92)"] as const),
    [colorScheme]
  );
  const glowColor = colorScheme === "dark" ? "#4ade80" : "#22c55e";

  const animatedOutlineStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      pulse.value,
      [0, 1],
      [borderPulse[0], borderPulse[1]]
    );
    return {
      borderWidth: 2,
      borderColor,
      shadowColor: glowColor,
      shadowOpacity: 0.18 + pulse.value * 0.22,
      shadowRadius: 8 + pulse.value * 10,
      shadowOffset: { width: 0, height: 2 + pulse.value * 4 },
    };
  }, [borderPulse, glowColor]);

  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const { width } = useWindowDimensions();
  const isWideLayout = width >= 768;
  const insets = useSafeAreaInsets();
  const videoRef = useRef<InstanceType<typeof Video> | null>(null);
  const webVideoRef = useRef<HTMLVideoElement | null>(null);

  const videoUrls = useMemo(
    () =>
      (exercise.videoUrls ?? []).filter(
        (u): u is string => typeof u === "string" && u.trim().length > 0
      ),
    [exercise.videoUrls]
  );

  const safeActiveIndex =
    videoUrls.length > 0
      ? Math.min(activeVideoIndex, videoUrls.length - 1)
      : 0;
  const activeVideoUri = videoUrls[safeActiveIndex] ?? "";

  const closeVideoModal = useCallback(async () => {
    if (Platform.OS === "web") {
      webVideoRef.current?.pause();
    } else {
      await videoRef.current?.pauseAsync();
    }
    setVideoModalVisible(false);
    setVideoLoading(false);
  }, []);

  const openVideoAt = useCallback((videoIndex: number) => {
    setActiveVideoIndex(videoIndex);
    setVideoModalVisible(true);
  }, []);

  const tileWidth = Math.min(width * 0.72, 280);

  const webModalVideoStyle = useMemo(
    () => ({
      position: "absolute" as const,
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      width: "100%" as const,
      height: "100%" as const,
      objectFit: "contain" as const,
      backgroundColor: "#000",
    }),
    []
  );

  return (
    <Animated.View style={[styles.card]}>
      <View style={[styles.row, isWideLayout && styles.rowWide]}>
        <View style={[styles.mediaColumn, isWideLayout && styles.mediaColumnWide]}>
          {videoUrls.length === 0 ? (
            <View style={[styles.aspectBox, styles.noVideoPlaceholder]}>
              <MaterialIcons name="videocam-off" size={40} color={p.iconMuted} />
            </View>
          ) : videoUrls.length === 1 ? (
            <View style={styles.aspectBox}>
              <View style={styles.thumbnailWrap}>
                <Image
                  source={{
                    uri: thumbnailUriForExercise(exercise, 0, videoUrls[0]),
                  }}
                  style={styles.thumbnail}
                  contentFit="cover"
                  accessibilityLabel={exercise.title}
                />
                <Pressable
                  style={styles.playOverlay}
                  onPress={() => {
                    openVideoAt(0);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Reproducir video"
                >
                  <View style={styles.playCircle}>
                    <MaterialIcons
                      name="play-arrow"
                      size={32}
                      color={p.primary}
                      style={styles.playIcon}
                    />
                  </View>
                </Pressable>
              </View>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.videoScrollContent}
            >
              {videoUrls.map((url, i) => {
                const thumbUri = thumbnailUriForExercise(exercise, i, url);
                return (
                  <View
                    key={`${exercise.id}-video-${i}`}
                    style={[styles.videoTile, { width: tileWidth }]}
                  >
                    <View style={styles.videoTileAspect}>
                      <View style={styles.thumbnailWrap}>
                        <Image
                          source={{ uri: thumbUri }}
                          style={styles.thumbnail}
                          contentFit="cover"
                          accessibilityLabel={`${exercise.title} — vista ${i + 1}`}
                        />
                        <Pressable
                          style={styles.playOverlay}
                          onPress={() => {
                            openVideoAt(i);
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={`Reproducir video ${i + 1} de ${videoUrls.length}`}
                        >
                          <View style={styles.playCircle}>
                            <MaterialIcons
                              name="play-arrow"
                              size={32}
                              color={p.primary}
                              style={styles.playIcon}
                            />
                          </View>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View style={styles.titleLeft}>
              <View style={styles.indexBadge}>
                <Text style={styles.indexText}>{index + 1}</Text>
              </View>
              <View style={styles.titleBlock}>
                <Text style={styles.title}>{exercise.title}</Text>
                {exercise.description.trim().length > 0 ? (
                  <View style={styles.descriptionBlock}>
                    <Text style={styles.descriptionLabel}>Description</Text>
                    <Text style={styles.description}>
                      {exercise.description}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
            {onToggleComplete ? (
              <Pressable
                onPress={() => onToggleComplete(exercise.id)}
                style={[
                  styles.completeBtn,
                  exercise.completed
                    ? styles.completeBtnDone
                    : styles.completeBtnIdle,
                ]}
                accessibilityRole="button"
                accessibilityLabel={
                  exercise.completed
                    ? "Marcar como no completado"
                    : "Marcar como completado"
                }
              >
                <MaterialIcons
                  name="check-circle"
                  size={22}
                  color={
                    exercise.completed ? p.checkDone : p.checkIdle
                  }
                />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.badgeRow}>
            <View style={[styles.badge, styles.badgeBlue]}>
              <MaterialIcons name="schedule" size={14} color={p.primary} />
              <Text style={styles.badgeTextBlue}>
                {exercise.duration} min
              </Text>
            </View>
            {exercise.sets != null ? (
              <View style={[styles.badge, styles.badgeGreen]}>
                <Text style={styles.badgeTextGreen}>
                  {exercise.sets} series
                </Text>
              </View>
            ) : null}
            {exercise.reps != null ? (
              <View style={[styles.badge, styles.badgePurple]}>
                <Text style={styles.badgeTextPurple}>
                  {exercise.reps} reps
                </Text>
              </View>
            ) : null}
          </View>

          {exercise.tips.length > 0 ? (
            <View style={styles.tipsBox}>
              <Text style={styles.tipsHeading}>💡 Important advices:</Text>
              {exercise.tips.map((tip, idx) => (
                <Text key={idx} style={styles.tipLine}>
                  • {tip}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      <Modal
        visible={videoModalVisible}
        animationType="fade"
        transparent={false}
        onRequestClose={() => {
          void closeVideoModal();
        }}
      >
        <View style={styles.videoModalRoot}>
          {videoModalVisible && activeVideoUri ? (
            Platform.OS === "web" ? (
              createElement("video", {
                key: safeActiveIndex,
                ref: (el: HTMLVideoElement | null) => {
                  webVideoRef.current = el;
                },
                src: activeVideoUri,
                controls: true,
                controlsList: "nodownload",
                playsInline: true,
                autoPlay: true,
                style: webModalVideoStyle,
                onLoadStart: () => {
                  setVideoLoading(true);
                },
                onCanPlay: () => {
                  setVideoLoading(false);
                },
                onError: () => {
                  setVideoLoading(false);
                },
              })
            ) : (
              <Video
                key={safeActiveIndex}
                ref={videoRef}
                source={{ uri: activeVideoUri }}
                style={styles.videoModalVideo}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
                useNativeControls
                onLoadStart={() => {
                  setVideoLoading(true);
                }}
                onReadyForDisplay={() => {
                  setVideoLoading(false);
                }}
              />
            )
          ) : null}
          {videoLoading ? (
            <View style={styles.videoModalLoading} pointerEvents="none">
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
          ) : null}
          <Pressable
            style={[
              styles.videoModalClose,
              { top: insets.top + 8, right: insets.right + 8 },
            ]}
            onPress={() => {
              void closeVideoModal();
            }}
            accessibilityRole="button"
            accessibilityLabel="Cerrar video"
          >
            <MaterialIcons name="close" size={28} color="#FFFFFF" />
          </Pressable>
        </View>
      </Modal>
    </Animated.View>
  );
}
