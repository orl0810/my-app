import React from "react";
import { Text, View } from "react-native";
import { Level } from "../types";

interface BadgeLevelProps {
  level: Level;
}

// Mapeo de nivel a estilos de color con clases de NativeWind
const LEVEL_CONFIG: Record<
  Level,
  { label: string; bgClass: string; textClass: string }
> = {
  beginner: {
    label: "Principiante",
    bgClass: "bg-emerald-500/20",
    textClass: "text-emerald-400",
  },
  intermediate: {
    label: "Intermedio",
    bgClass: "bg-yellow-500/20",
    textClass: "text-yellow-400",
  },
  advanced: {
    label: "Avanzado",
    bgClass: "bg-red-500/20",
    textClass: "text-red-400",
  },
};

export function BadgeLevel({ level }: BadgeLevelProps) {
  const config = LEVEL_CONFIG[level];

  return (
    <View className={`px-2 py-0.5 rounded-full ${config.bgClass}`}>
      <Text className={`text-xs font-semibold ${config.textClass}`}>
        {config.label}
      </Text>
    </View>
  );
}
