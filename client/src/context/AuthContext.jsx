import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const data = await api.get('/auth/me');
      if (data?.user) {
        setUser(data.user);
        setMustChangePassword(Boolean(data.user.must_change_password));
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
      localStorage.removeItem('nexbyte_token');
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const data = await api.post('/auth/login', { email, password });
    if (data.token) {
      localStorage.setItem('nexbyte_token', data.token);
    }
    setUser(data.user);
    setMustChangePassword(Boolean(data.user.must_change_password));
    return data;
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch {}
    localStorage.removeItem('nexbyte_token');
    setUser(null);
    setMustChangePassword(false);
  }

  async function changePassword(currentPassword, newPassword) {
    const res = await api.post('/auth/change-password', { currentPassword, newPassword });
    setUser(res.user);
    setMustChangePassword(false);
    return res;
  }

  return (
    <AuthContext.Provider value={{ user, loading, mustChangePassword, login, logout, changePassword, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de AuthProvider');
  }
  return context;
}
