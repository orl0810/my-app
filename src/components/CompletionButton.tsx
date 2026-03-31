import React, { useEffect, useRef } from "react";
import { Animated, Easing, Text, TouchableOpacity } from "react-native";

interface CompletionButtonProps {
  isCompleted: boolean;
  onPress: () => void;
}

/**
 * CompletionButton — Botón con animación de escala y pulso al completar.
 * Usa la Animated API nativa para máxima compatibilidad.
 */
export function CompletionButton({
  isCompleted,
  onPress,
}: CompletionButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const checkScaleAnim = useRef(new Animated.Value(0)).current;

  // Animación de celebración al completar
  useEffect(() => {
    if (isCompleted) {
      // Secuencia: escala + bounce + aparición del check
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.15,
            duration: 150,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 4,
            tension: 100,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(checkScaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset inmediato al descompletar
      Animated.parallel([
        Animated.timing(checkScaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isCompleted, scaleAnim, checkScaleAnim, opacityAnim]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View
        style={{ transform: [{ scale: scaleAnim }] }}
        className={`flex-row items-center justify-center py-4 rounded-2xl ${
          isCompleted
            ? "bg-tennis-green"
            : "bg-slate-700 border border-slate-600"
        }`}
      >
        {isCompleted ? (
          <>
            <Animated.Text
              style={{ transform: [{ scale: checkScaleAnim }] }}
              className="text-xl mr-2"
            >
              ✓
            </Animated.Text>
            <Text className="text-slate-900 font-bold text-base">
              ¡Sesión Completada!
            </Text>
          </>
        ) : (
          <>
            <Text className="text-white text-xl mr-2">🎾</Text>
            <Text className="text-white font-bold text-base">
              Marcar como Completada
            </Text>
          </>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}
