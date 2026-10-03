import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { apiJson, getToken, setToken, AUTH_EXPIRED_EVENT } from '@/lib/api';

export interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  designation: string | null;
  department: string | null;
  location: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface SignupData {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  designation?: string;
  department?: string;
  location?: string;
}

export interface ProfileUpdate {
  fullName: string;
  phone?: string;
  designation?: string;
  department?: string;
  location?: string;
  bio?: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: ProfileUpdate) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  // Restore session: a stored token is only trusted after the backend confirms it
  useEffect(() => {
    try {
      // Leftovers from the old demo login
      localStorage.removeItem('user');
      localStorage.removeItem('userSession');
    } catch {
      // storage unavailable
    }
    if (!getToken()) {
      setIsLoading(false);
      return;
    }
    apiJson<User>('/api/auth/me')
      .then(setUser)
      .catch(() => logout())
      .finally(() => setIsLoading(false));
  }, [logout]);

  useEffect(() => {
    window.addEventListener(AUTH_EXPIRED_EVENT, logout);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, logout);
  }, [logout]);

  const startSession = ({ token, user }: AuthResponse) => {
    setToken(token);
    setUser(user);
  };

  const login = async (email: string, password: string) => {
    startSession(await apiJson<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }));
  };

  const signup = async (data: SignupData) => {
    startSession(await apiJson<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data)
    }));
  };

  const updateProfile = async (data: ProfileUpdate) => {
    setUser(await apiJson<User>('/api/auth/me', { method: 'PUT', body: JSON.stringify(data) }));
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await apiJson('/api/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout, updateProfile, changePassword }}
    >
      {children}
    </AuthContext.Provider>
  );
};
