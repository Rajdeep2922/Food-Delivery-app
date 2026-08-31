import { createContext, useContext, useState, useEffect } from 'react';
import { adminAuthAPI } from '../services/api';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('adminUser');
    const token = localStorage.getItem('adminToken');
    if (stored && token) {
      const u = JSON.parse(stored);
      if (u.role === 'admin') setAdmin(u);
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const { data } = await adminAuthAPI.login(credentials);
    if (data.user.role !== 'admin') {
      throw new Error('Access denied: Admin accounts only');
    }
    localStorage.setItem('adminToken', data.token);
    localStorage.setItem('adminUser', JSON.stringify(data.user));
    setAdmin(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, isAuthenticated: !!admin, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
};
