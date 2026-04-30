import type {
  AuthSession,
  AuthSessionUser,
  AuthTokens,
} from "@/services/auth-service";
import { setAuthTokens, setTokensRefreshedHandler, setUnauthenticatedHandler } from "@/utils/api-client";
import { logger } from "@/utils/logger";
import * as SecureStore from "expo-secure-store";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const SESSION_KEY = "auth.user";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAuthSessionUser(value: unknown): value is AuthSessionUser {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.email === "string"
  );
}

function isAuthTokens(value: unknown): value is AuthTokens {
  return (
    isRecord(value) &&
    typeof value.accessToken === "string" &&
    typeof value.refreshToken === "string" &&
    typeof value.tokenType === "string"
  );
}

function isAuthSession(value: unknown): value is AuthSession {
  return (
    isRecord(value) &&
    isAuthSessionUser(Reflect.get(value, "user")) &&
    isAuthTokens(Reflect.get(value, "tokens"))
  );
}

type AuthContextValue = {
  user: AuthSessionUser | null;
  isHydrated: boolean;
  signIn: (session: AuthSession) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const userRef = useRef(user);
  userRef.current = user;

  const signOut = useCallback(async () => {
    setUser(null);
    setAuthTokens(null);
    await SecureStore.deleteItemAsync(SESSION_KEY);
  }, []);

  useEffect(() => {
    setUnauthenticatedHandler(() => {
      void signOut();
    });
  }, [signOut]);

  useEffect(() => {
    setTokensRefreshedHandler((tokens) => {
      const currentUser = userRef.current;
      if (!currentUser) return;
      void SecureStore.setItemAsync(
        SESSION_KEY,
        JSON.stringify({ user: currentUser, tokens } satisfies AuthSession),
      );
    });
  }, []);

  useEffect(() => {
    const hydrateSession = async () => {
      try {
        const rawValue = await SecureStore.getItemAsync(SESSION_KEY);
        if (!rawValue) return;

        const parsed = JSON.parse(rawValue) as unknown;

        if (isAuthSession(parsed)) {
          setUser(parsed.user);
          setAuthTokens(parsed.tokens);
        }
      } catch (error: unknown) {
        logger.error("Unable to restore auth session", error);
      } finally {
        setIsHydrated(true);
      }
    };

    void hydrateSession();
  }, []);

  const signIn = useCallback(async (session: AuthSession) => {
    setUser(session.user);
    setAuthTokens(session.tokens);
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isHydrated, signIn, signOut }),
    [isHydrated, signIn, signOut, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
