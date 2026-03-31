// Niveles de dificultad disponibles
export type Level = "beginner" | "intermediate" | "advanced";

// Estructura de un ejercicio individual dentro de una sesión
export interface Exercise {
  id: string;
  name: string;
  duration: string; // e.g. "5 min"
  reps?: string; // e.g. "3 series x 10"
  description: string;
}

// Estructura completa de una sesión de entrenamiento
export interface TrainingSession {
  id: string;
  duration: string; // e.g. "45 min"
  level: Level;
  description: string;
  fullDescription: string;
  category: string; // e.g. "Técnica", "Física", "Mental"
  exercises: Exercise[];
  imageColor: string; // Color de acento para la tarjeta
}

// Estado global de la app
export interface SessionState {
  completedIds: string[];
  favoriteIds: string[];
}

// Acciones del contexto
export type SessionAction =
  | { type: "TOGGLE_COMPLETE"; id: string }
  | { type: "TOGGLE_FAVORITE"; id: string }
  | { type: "LOAD_STATE"; state: SessionState };

// Props de navegación (tipado fuerte para React Navigation)
export type RootStackParamList = {
  Home: undefined;
  Detail: { sessionId: string };
};
