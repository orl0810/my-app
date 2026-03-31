import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useState,
  ReactNode,
  JSX,
} from 'react';
import { SessionState, SessionAction } from '../types';
import { loadSessionState, saveSessionState } from '../utils/storage';

// ─── Estado inicial ────────────────────────────────────────────────────────────
const initialState: SessionState = {
  completedIds: [],
  favoriteIds: [],
};

// ─── Reducer puro ──────────────────────────────────────────────────────────────
function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'TOGGLE_COMPLETE': {
      const isCompleted = state.completedIds.includes(action.id);
      return {
        ...state,
        completedIds: isCompleted
          ? state.completedIds.filter((id) => id !== action.id)
          : [...state.completedIds, action.id],
      };
    }
    case 'TOGGLE_FAVORITE': {
      const isFavorite = state.favoriteIds.includes(action.id);
      return {
        ...state,
        favoriteIds: isFavorite
          ? state.favoriteIds.filter((id) => id !== action.id)
          : [...state.favoriteIds, action.id],
      };
    }
    case 'LOAD_STATE':
      return action.state;
    default:
      return state;
  }
}

// ─── Tipos del contexto ────────────────────────────────────────────────────────
interface SessionContextValue {
  state: SessionState;
  toggleComplete: (id: string) => void;
  toggleFavorite: (id: string) => void;
  isCompleted: (id: string) => boolean;
  isFavorite: (id: string) => boolean;
  isLoading: boolean;
}

// ─── Creación del contexto ─────────────────────────────────────────────────────
const SessionContext = createContext<SessionContextValue | undefined>(undefined);

// ─── Props del Provider ───────────────────────────────────────────────────────
interface SessionProviderProps {
  children: ReactNode;
}

// ─── Provider — FIX: tipo de retorno explícito JSX.Element ────────────────────
export function SessionProvider({ children }: SessionProviderProps): JSX.Element {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  // Cargar estado persistido al montar
  useEffect(() => {
    const loadState = async (): Promise<void> => {
      const savedState = await loadSessionState();
      if (savedState) {
        dispatch({ type: 'LOAD_STATE', state: savedState });
      }
      setIsLoading(false);
    };
    loadState();
  }, []);

  // Auto-persistir en cada cambio de estado (omitir durante carga inicial)
  useEffect(() => {
    if (!isLoading) {
      saveSessionState(state);
    }
  }, [state, isLoading]);

  const toggleComplete = useCallback((id: string): void => {
    dispatch({ type: 'TOGGLE_COMPLETE', id });
  }, []);

  const toggleFavorite = useCallback((id: string): void => {
    dispatch({ type: 'TOGGLE_FAVORITE', id });
  }, []);

  const isCompleted = useCallback(
    (id: string): boolean => state.completedIds.includes(id),
    [state.completedIds]
  );

  const isFavorite = useCallback(
    (id: string): boolean => state.favoriteIds.includes(id),
    [state.favoriteIds]
  );

  return (
    <SessionContext.Provider
      value={{
        state,
        toggleComplete,
        toggleFavorite,
        isCompleted,
        isFavorite,
        isLoading,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

// ─── Hook de consumo ───────────────────────────────────────────────────────────
export function useSessionContext(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSessionContext must be used within a SessionProvider');
  }
  return context;
}
