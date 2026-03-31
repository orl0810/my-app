import { useMemo } from "react";
import { TRAINING_SESSIONS } from "../data/sessions";
import { useSessionContext } from "../store/SessionContext";
import { TrainingSession } from "../types";

interface UseSessionStateReturn {
  sessions: TrainingSession[];
  completedCount: number;
  favoriteCount: number;
  toggleComplete: (id: string) => void;
  toggleFavorite: (id: string) => void;
  isCompleted: (id: string) => boolean;
  isFavorite: (id: string) => boolean;
}

/**
 * useSessionState — Combina los datos mock con el estado global.
 * Expone funciones helpers y estadísticas derivadas.
 */
export function useSessionState(): UseSessionStateReturn {
  const { state, toggleComplete, toggleFavorite, isCompleted, isFavorite } =
    useSessionContext();

  const completedCount = useMemo(
    () => state.completedIds.length,
    [state.completedIds],
  );

  const favoriteCount = useMemo(
    () => state.favoriteIds.length,
    [state.favoriteIds],
  );

  return {
    sessions: TRAINING_SESSIONS,
    completedCount,
    favoriteCount,
    toggleComplete,
    toggleFavorite,
    isCompleted,
    isFavorite,
  };
}
