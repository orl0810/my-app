import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useMemo, useState } from "react";
import {
    FlatList,
    SafeAreaView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SessionCard } from "../components/SessionCard";
import { useSessionState } from "../hooks/useSessionState";
import { Level, RootStackParamList, TrainingSession } from "../types";

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList, "Home">;

type FilterType = "all" | "favorites" | "completed" | Level;

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "favorites", label: "❤️ Favoritas" },
  { key: "completed", label: "✅ Completadas" },
  { key: "beginner", label: "Principiante" },
  { key: "intermediate", label: "Intermedio" },
  { key: "advanced", label: "Avanzado" },
];

export function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProp>();
  const {
    sessions,
    completedCount,
    favoriteCount,
    toggleFavorite,
    isCompleted,
    isFavorite,
  } = useSessionState();

  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  // Filtrado reactivo según el filtro activo
  const filteredSessions = useMemo<TrainingSession[]>(() => {
    switch (activeFilter) {
      case "favorites":
        return sessions.filter((s) => isFavorite(s.id));
      case "completed":
        return sessions.filter((s) => isCompleted(s.id));
      case "beginner":
      case "intermediate":
      case "advanced":
        return sessions.filter((s) => s.level === activeFilter);
      default:
        return sessions;
    }
  }, [activeFilter, sessions, isFavorite, isCompleted]);

  const handleSessionPress = (sessionId: string) => {
    navigation.navigate("Detail", { sessionId });
  };

  const renderHeader = () => (
    <View>
      {/* Header principal */}
      <View className="px-4 pt-4 pb-6">
        <Text className="text-slate-400 text-sm font-medium mb-1">
          🎾 TennisPro
        </Text>
        <Text className="text-white text-3xl font-bold mb-1">
          Entrenamientos
        </Text>
        <Text className="text-slate-400 text-sm">
          {sessions.length} sesiones disponibles
        </Text>

        {/* Stats rápidas */}
        <View className="flex-row mt-5 gap-3">
          <View className="flex-1 bg-tennis-green/10 border border-tennis-green/20 rounded-2xl p-4">
            <Text className="text-tennis-green text-2xl font-bold">
              {completedCount}
            </Text>
            <Text className="text-slate-400 text-xs mt-1">Completadas</Text>
          </View>
          <View className="flex-1 bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
            <Text className="text-red-400 text-2xl font-bold">
              {favoriteCount}
            </Text>
            <Text className="text-slate-400 text-xs mt-1">Favoritas</Text>
          </View>
          <View className="flex-1 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
            <Text className="text-blue-400 text-2xl font-bold">
              {Math.round((completedCount / sessions.length) * 100)}%
            </Text>
            <Text className="text-slate-400 text-xs mt-1">Progreso</Text>
          </View>
        </View>
      </View>

      {/* Filtros horizontales */}
      <View className="mb-4">
        <FlatList
          data={FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setActiveFilter(item.key)}
              className={`px-4 py-2 rounded-full border ${
                activeFilter === item.key
                  ? "bg-tennis-yellow border-tennis-yellow"
                  : "bg-slate-800 border-slate-700"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  activeFilter === item.key
                    ? "text-slate-900"
                    : "text-slate-300"
                }`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Contador de resultados */}
      <Text className="text-slate-500 text-xs px-4 mb-3">
        {filteredSessions.length} sesión
        {filteredSessions.length !== 1 ? "es" : ""}
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center py-20">
      <Text className="text-4xl mb-3">🎾</Text>
      <Text className="text-white font-semibold text-lg mb-1">
        Sin resultados
      </Text>
      <Text className="text-slate-500 text-sm text-center px-8">
        No hay sesiones en esta categoría todavía.
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-court-bg">
      <StatusBar barStyle="light-content" backgroundColor="#0A0F1E" />
      <FlatList
        data={filteredSessions}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        renderItem={({ item }) => (
          <SessionCard
            session={item}
            isCompleted={isCompleted(item.id)}
            isFavorite={isFavorite(item.id)}
            onPress={() => handleSessionPress(item.id)}
            onToggleFavorite={() => toggleFavorite(item.id)}
          />
        )}
      />
    </SafeAreaView>
  );
}
