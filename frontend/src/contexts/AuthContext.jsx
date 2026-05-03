import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '@/api/auth.api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  // Validate token and refresh user on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }

    authApi.getMe()
      .then(({ data }) => {
        setUser(data.data.user);
        localStorage.setItem('user', JSON.stringify(data.data.user));
      })
      .catch(() => {
        clearAuthStorage();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const { data } = await authApi.login(credentials);
    const { user, accessToken, refreshToken } = data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    return user;
  }, []);

  const signup = useCallback(async (credentials) => {
    const { data } = await authApi.signup(credentials);
    const { user, accessToken, refreshToken } = data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch (_) {}
    clearAuthStorage();
    setUser(null);
    toast.success('Logged out successfully');
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isAdmin = user?.role === 'admin';
  const isMember = user?.role === 'member';

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser, isAdmin, isMember }}>
      {children}
    </AuthContext.Provider>
  );
};

function clearAuthStorage() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
