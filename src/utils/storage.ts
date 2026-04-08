import AsyncStorage from "@react-native-async-storage/async-storage";
import { SessionState } from "../types";

// Clave única para el namespace de la app
const STORAGE_KEY = "@tennisPro:sessionState";

/**
 * Persist the complete session state in AsyncStorage.
 * Llamar después de cada mutación del estado.
 */
export const saveSessionState = async (state: SessionState): Promise<void> => {
  try {
    const json = JSON.stringify(state);
    await AsyncStorage.setItem(STORAGE_KEY, json);
  } catch (error) {
    console.error("[Storage] Error saving state:", error);
  }
};

/**
 * Carga el estado persistido al iniciar la app.
 * Retorna null si no hay datos previos (primer arranque).
 */
export const loadSessionState = async (): Promise<SessionState | null> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json === null) return null;
    return JSON.parse(json) as SessionState;
  } catch (error) {
    console.error("[Storage] Error loading state:", error);
    return null;
  }
};
