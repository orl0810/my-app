import React from "react";
import { Text, View } from "react-native";
import { Exercise } from "../types";

interface ExerciseItemProps {
  exercise: Exercise;
  index: number;
}

export function ExerciseItem({ exercise, index }: ExerciseItemProps) {
  return (
    <View className="flex-row mb-4">
      {/* Número de orden */}
      <View className="w-8 h-8 rounded-full bg-tennis-yellow/20 items-center justify-center mr-3 mt-0.5 flex-shrink-0">
        <Text className="text-tennis-yellow text-xs font-bold">
          {index + 1}
        </Text>
      </View>

      {/* Contenido */}
      <View className="flex-1">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-white font-semibold text-sm flex-1 mr-2">
            {exercise.name}
          </Text>
          <Text className="text-slate-400 text-xs">{exercise.duration}</Text>
        </View>

        {exercise.reps && (
          <Text className="text-tennis-green text-xs font-medium mb-1">
            {exercise.reps}
          </Text>
        )}

        <Text className="text-slate-400 text-xs leading-5">
          {exercise.description}
        </Text>
      </View>
    </View>
  );
}
