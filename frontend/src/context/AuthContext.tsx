'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchApi } from '@/utils/api';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  reputation_score: number;
  level: string;
  profile_image: string | null;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, first_name: string, last_name: string, password: string, passwordConfirm: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await fetchApi('/users/me/');
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      refreshUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await fetchApi('/users/login/', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        await refreshUser();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  const register = async (
    username: string,
    email: string,
    first_name: string,
    last_name: string,
    password: string,
    passwordConfirm: string
  ): Promise<boolean> => {
    try {
      const res = await fetchApi('/users/register/', {
        method: 'POST',
        body: JSON.stringify({
          username,
          email,
          first_name,
          last_name,
          password,
          password_confirm: passwordConfirm,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('access_token', data.tokens.access);
        localStorage.setItem('refresh_token', data.tokens.refresh);
        setUser(data.user);
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
