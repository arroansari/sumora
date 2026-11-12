import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/models.types';
import { authApi, setAuthToken } from '../services/api';

const STORAGE_KEYS = {
  TOKEN: '@sumora_auth_token',
  USER: '@sumora_auth_user',
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRestoring: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const [savedToken, savedUserJson] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.USER),
        ]);

        if (!savedToken) {
          return;
        }

        setAuthToken(savedToken);
        const parsedUser: User | null = savedUserJson ? JSON.parse(savedUserJson) : null;

        if (isMounted) {
          setToken(savedToken);
          if (parsedUser) {
            setUser(parsedUser);
          }
        }

        // Verify token is still valid on backend and refresh profile
        try {
          const freshUser = await authApi.getMe();
          if (isMounted) {
            setUser(freshUser);
            await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(freshUser));
          }
        } catch (err: any) {
          const msg = (err?.message || '').toLowerCase();
          if (msg.includes('unauthorized') || msg.includes('401') || msg.includes('token') || msg.includes('not found')) {
            setAuthToken(null);
            await Promise.all([
              AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
              AsyncStorage.removeItem(STORAGE_KEYS.USER),
            ]);
            if (isMounted) {
              setToken(null);
              setUser(null);
            }
          }
        }
      } catch (err) {
        console.warn('[AuthContext] Failed to restore session:', err);
      } finally {
        if (isMounted) {
          setIsRestoring(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const persistSession = async (nextUser: User, nextToken: string) => {
    setAuthToken(nextToken);
    setUser(nextUser);
    setToken(nextToken);
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.TOKEN, nextToken),
      AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(nextUser)),
    ]);
  };

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const data = await authApi.login(credentials);
      await persistSession(data.user, data.token);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const data = await authApi.register(credentials);
      await persistSession(data.user, data.token);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch (err) {
      // Ignore network errors on logout
    } finally {
      setAuthToken(null);
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER),
      ]).catch(() => {});
      setUser(null);
      setToken(null);
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token),
        isLoading,
        isRestoring,
        login,
        register,
        logout,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
