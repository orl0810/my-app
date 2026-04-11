import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "@/src/utils/supabase";
import {
  clearOnboardingFlowStep,
  getOnboardingStatus,
} from "@/src/utils/onboarding";

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  onboardingCompleted: boolean;
  markOnboardingCompleted: () => void;
  refreshOnboardingStatus: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): ReactElement {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(false);
  const [onboardingReady, setOnboardingReady] = useState<boolean>(false);

  const isLoading = !authReady || (!!session?.user && !onboardingReady);

  useEffect(() => {
    let cancelled = false;

    void supabase.auth.getSession().then(({ data: { session: next } }) => {
      if (!cancelled) {
        setSession(next);
        setAuthReady(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!session?.user) {
      setOnboardingCompleted(false);
      setOnboardingReady(true);
      return () => {
        cancelled = true;
      };
    }

    setOnboardingReady(false);
    void getOnboardingStatus().then((done) => {
      if (!cancelled) {
        setOnboardingCompleted(done);
        setOnboardingReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [session?.user]);

  const markOnboardingCompleted = useCallback((): void => {
    setOnboardingCompleted(true);
  }, []);

  const refreshOnboardingStatus = useCallback(async (): Promise<void> => {
    if (!session?.user) {
      setOnboardingCompleted(false);
      return;
    }
    const done = await getOnboardingStatus();
    setOnboardingCompleted(done);
  }, [session?.user]);

  const signOut = useCallback(async (): Promise<void> => {
    await clearOnboardingFlowStep();
    await supabase.auth.signOut();
  }, []);

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    isLoading,
    onboardingCompleted,
    markOnboardingCompleted,
    refreshOnboardingStatus,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
