import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { api, ApiError } from '@/lib/api';
import { useStorageState } from '@/hooks/use-storage-state';

type AuthUser = {
  id: number;
  name: string;
  email: string;
  roles: string[];
  client_id?: number | null;
  barber_id?: number | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken, tokenReady] = useStorageState<string | null>('urbanblade.token', null);
  const [user, setUser, userReady] = useStorageState<AuthUser | null>('urbanblade.user', null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenReady || !userReady || !token) {
      return;
    }

    if (user) {
      return;
    }

    void refreshSession();
  }, [token, tokenReady, user, userReady]);

  async function refreshSession() {
    if (!token) {
      return;
    }

    try {
      const response = await api.me(token);
      setUser(response.user as AuthUser);
    } catch {
      setToken(null);
      setUser(null);
    }
  }

  async function signIn(email: string, password: string) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.login({
        email,
        password,
        device_name: 'UrbanBlade Mobile',
      });

      setToken(response.token);
      setUser(response.user as AuthUser);
    } catch (exception) {
      const message = exception instanceof ApiError ? exception.message : 'No se pudo iniciar sesión.';
      setError(message);
      throw exception;
    } finally {
      setIsLoading(false);
    }
  }

  async function signOut() {
    if (token) {
      try {
        await api.request('/auth/logout', { method: 'POST', token });
      } catch {
        // Ignore logout errors and clear session locally.
      }
    }

    setToken(null);
    setUser(null);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isReady: tokenReady && userReady,
      isLoading,
      error,
      signIn,
      signOut,
      refreshSession,
    }),
    [error, isLoading, refreshSession, signIn, signOut, token, tokenReady, user, userReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}