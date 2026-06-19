import React, { createContext, useCallback, useContext, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function loadUserFromStorage(): User | null {
  try {
    const stored = localStorage.getItem('user');
    return stored ? (JSON.parse(stored) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(loadUserFromStorage);
  const queryClient = useQueryClient();

  const login = useCallback(
    async (username: string, password: string) => {
      const { data } = await authApi.login(username, password);
      localStorage.setItem('access', data.access);
      localStorage.setItem('refresh', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
      // Drop any cache left by a previous user so we never show their data
      // (e.g. another account's private recipes) under the new session.
      queryClient.clear();
      setUser(data.user);
    },
    [queryClient],
  );

  const logout = useCallback(() => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    // Clear cached queries so the next user can't see this user's data.
    queryClient.clear();
    setUser(null);
  }, [queryClient]);

  const updateUser = useCallback((updated: User) => {
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
