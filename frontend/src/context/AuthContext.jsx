import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null);

  const storeToken = (token) => {
    window.__accessToken = token;
    setAccessToken(token);
  };

  // On mount: try to restore session via refresh token cookie
  useEffect(() => {
    const restore = async () => {
      try {
        const { data } = await api.post('/auth/refresh');
        storeToken(data.data.accessToken);
        setUser(data.data.user);
      } catch {
        // No valid session
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  // Listen for forced logout event (from interceptor)
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      storeToken(null);
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    storeToken(data.data.accessToken);
    setUser(data.data.user);
    return data;
  }, []);

  const register = useCallback(async (email, password, displayName) => {
    const { data } = await api.post('/auth/register', { email, password, displayName });
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      storeToken(null);
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await api.get('/auth/me');
    setUser(data.data.user);
    return data.data.user;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, accessToken, login, register, logout, refreshUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
