/**
 * Authentication Context
 * 
 * React context that manages authentication state across the application.
 * Provides login, logout, and user state management.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, getAuthToken, getStoredUser, removeAuthToken } from './api';

interface User {
  id: number;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = getAuthToken();
    const storedUser = getStoredUser();

    if (token && storedUser) {
      // Verify token is still valid by calling /auth/me
      const result = await authApi.getCurrentUser();
      if (result.success && result.data) {
        setUser(result.data);
      } else {
        // Token invalid, clear storage
        removeAuthToken();
        setUser(null);
      }
    }
    setIsLoading(false);
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const result = await authApi.login(email, password);
    
    if (result.success && result.data) {
      setUser(result.data.user);
      return { success: true };
    }
    
    return { success: false, error: result.error || 'Login failed' };
  };

  const register = async (email: string, password: string, name?: string): Promise<{ success: boolean; error?: string }> => {
    const result = await authApi.register(email, password, name);
    
    if (result.success && result.data) {
      setUser(result.data.user);
      return { success: true };
    }
    
    return { success: false, error: result.error || 'Registration failed' };
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    }
    removeAuthToken();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
