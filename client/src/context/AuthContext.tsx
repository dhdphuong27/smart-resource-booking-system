import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from "react";

import axiosClient from '../api/axiosClient';

// Define the shape of the Context
interface AuthContextType {
  user: any;
  token: string | null;
  login: (token: string, userData: any) => void;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserLoggedIn = async () => {
      if (token) {
        try {
          // Verify token by fetching profile
          const { data } = await axiosClient.get('/auth/profile');
          setUser(data);
        } catch (error) {
          console.error("Token invalid");
          logout();
        }
      }
      setIsLoading(false);
    };

    checkUserLoggedIn();
  }, [token]);

  const login = (newToken: string, userData: any) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};