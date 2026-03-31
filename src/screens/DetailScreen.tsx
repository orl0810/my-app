import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Easing,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { BadgeLevel } from "../components/BadgeLevel";
import { CompletionButton } from "../components/CompletionButton";
import { ExerciseItem } from "../components/ExerciseItem";
import { TRAINING_SESSIONS } from "../data/sessions";
import { useSessionState } from "../hooks/useSessionState";
import { RootStackParamList } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Detail">;

export function DetailScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const { toggleComplete, toggleFavorite, isCompleted, isFavorite } =
    useSessionState();

  // Buscar la sesión por ID
  const session = TRAINING_SESSIONS.find((s) => s.id === sessionId);

  // Animación de entrada del contenido
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Guard: sesión no encontrada
  if (!session) {
    return (
      <SafeAreaView className="flex-1 bg-court-bg items-center justify-center">
        <Text className="text-white text-lg">Sesión no encontrada</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4">
          <Text className="text-tennis-yellow">← Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const completed = isCompleted(session.id);
  const favorite = isFavorite(session.id);

  return (
    <SafeAreaView className="flex-1 bg-court-bg">
      <StatusBar barStyle="light-content" backgroundColor="#0A0F1E" />

      {/* Barra de navegación personalizada */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-800">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="flex-row items-center"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text className="text-tennis-yellow text-sm font-semibold">
            ← Volver
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => toggleFavorite(session.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text className="text-2xl">{favorite ? "❤️" : "🤍"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Hero de la sesión */}
          <View
            className="mx-4 mt-4 rounded-2xl p-6 overflow-hidden"
            style={{
              backgroundColor: "#111827",
              borderWidth: 1,
              borderColor: completed ? "#00C896" : "#1F2A3C",
            }}
          >
            {/* Barra de color superior */}
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                backgroundColor: session.imageColor,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
              }}
            />

            {/* Categoría */}
            <Text
              className="text-xs font-bold mb-2 mt-1"
              style={{ color: session.imageColor }}
            >
              {session.category.toUpperCase()}
            </Text>

            {/* Título */}
            <Text className="text-white text-2xl font-bold mb-3 leading-8">
              {session.title}
            </Text>

            {/* Meta badges */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              <BadgeLevel level={session.level} />
              <View className="bg-slate-700 px-3 py-1 rounded-full">
                <Text className="text-slate-300 text-xs">
                  ⏱ {session.duration}
                </Text>
              </View>
              <View className="bg-slate-700 px-3 py-1 rounded-full">
                <Text className="text-slate-300 text-xs">
                  🏋️ {session.exercises.length} ejercicios
                </Text>
              </View>
            </View>

            {/* Descripción completa */}
            <Text className="text-slate-300 text-sm leading-6">
              {session.fullDescription}
            </Text>

            {/* Indicador de completado */}
            {completed && (
              <View className="flex-row items-center mt-4 pt-4 border-t border-tennis-green/20">
                <View className="w-2 h-2 rounded-full bg-tennis-green mr-2" />
                <Text className="text-tennis-green text-sm font-semibold">
                  ¡Ya completaste esta sesión!
                </Text>
              </View>
            )}
          </View>

          {/* Sección de ejercicios */}
          <View className="mx-4 mt-5">
            <Text className="text-white text-lg font-bold mb-4">
              Ejercicios
            </Text>
            <View
              className="rounded-2xl p-4"
              style={{
                backgroundColor: "#111827",
                borderWidth: 1,
                borderColor: "#1F2A3C",
              }}
            >
              {session.exercises.map((exercise, index) => (
                <ExerciseItem
                  key={exercise.id}
                  exercise={exercise}
                  index={index}
                />
              ))}
            </View>
          </View>

          {/* Botón de completar */}
          <View className="mx-4 mt-6">
            <CompletionButton
              isCompleted={completed}
              onPress={() => toggleComplete(session.id)}
            />
          </View>

          {/* Nota de desfavoritar */}
          {completed && (
            <TouchableOpacity
              onPress={() => toggleComplete(session.id)}
              className="items-center mt-3"
            >
              <Text className="text-slate-500 text-xs">
                Toca para marcar como no completada
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
