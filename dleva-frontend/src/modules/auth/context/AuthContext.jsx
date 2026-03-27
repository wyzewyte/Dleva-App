import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../../../services/axios';
import buyerProfile from '../../../services/buyerProfile';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('buyer_access_token'));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dleva_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(Boolean(token));

  // Initialize: if token exists fetch the current profile
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const profile = await buyerProfile.getProfile();
        if (!mounted) return;
        setUser(profile);
        localStorage.setItem('dleva_user', JSON.stringify(profile));
      } catch (err) {
        // token invalid or fetch failed -> clear auth
        localStorage.removeItem('buyer_access_token');
        localStorage.removeItem('buyer_refresh_token');
        setToken(null);
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    init();
    return () => { mounted = false; };
  }, [token]);

  // login(email, password) -> store tokens, fetch profile, update state
  const login = async (email, password) => {
    const res = await api.post('/buyer/login/', { username: email, password });
    const access = res.data.access || res.data.access_token;
    const refresh = res.data.refresh || res.data.refresh_token;
    if (!access) throw new Error('No access token from server');

    localStorage.setItem('buyer_access_token', access);
    if (refresh) localStorage.setItem('buyer_refresh_token', refresh);
    api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
    setToken(access);

    // fetch canonical profile from backend
    const profile = await buyerProfile.getProfile();
    setUser(profile);
    localStorage.setItem('dleva_user', JSON.stringify(profile));

    // remove guest state if any
    localStorage.removeItem('guest_location');
    return profile;
  };

  const logout = () => {
    localStorage.removeItem('buyer_access_token');
    localStorage.removeItem('buyer_refresh_token');
    localStorage.removeItem('dleva_user');
    localStorage.removeItem('dleva_cart');
    localStorage.removeItem('guest_location');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    // navigate or let caller handle redirect
  };

  return (
    <AuthContext.Provider value={{ token, user, setUser, loading, login, logout, isAuthenticated: Boolean(token && user) }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
