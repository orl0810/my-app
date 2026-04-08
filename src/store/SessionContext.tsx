import React, {
  createContext,
  JSX,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useState,
} from 'react';
import { Alert } from 'react-native';

import { useAuth } from '@/src/context/AuthContext';

import { SessionAction, SessionState } from '../types';
import { getFavorites, toggleFavorite as toggleFavoriteRemote } from '../utils/sessions';
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
    case 'SET_FAVORITE': {
      const has = state.favoriteIds.includes(action.id);
      if (action.favorited && !has) {
        return { ...state, favoriteIds: [...state.favoriteIds, action.id] };
      }
      if (!action.favorited && has) {
        return {
          ...state,
          favoriteIds: state.favoriteIds.filter((id) => id !== action.id),
        };
      }
      return state;
    }
    case 'SET_FAVORITE_IDS':
      return { ...state, favoriteIds: action.ids };
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
  const { session, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    void (async () => {
      setIsLoading(true);
      try {
        const savedState = await loadSessionState();
        if (savedState) {
          dispatch({ type: 'LOAD_STATE', state: savedState });
        }
        if (session?.user) {
          try {
            const ids = await getFavorites();
            dispatch({ type: 'SET_FAVORITE_IDS', ids });
          } catch {
            // Mantener favoritos locales si falla la red o RLS
          }
        } else {
          dispatch({ type: 'SET_FAVORITE_IDS', ids: [] });
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, [session, authLoading]);

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
    void (async () => {
      try {
        const added = await toggleFavoriteRemote(id);
        dispatch({ type: 'SET_FAVORITE', id, favorited: added });
      } catch (e) {
        const message =
          e instanceof Error && e.message === 'Not authenticated'
            ? 'Sign in to save favorites.'
            : 'Could not update favorites.';
        Alert.alert('Error', message);
      }
    })();
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
