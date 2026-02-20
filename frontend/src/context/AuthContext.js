import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasProcessedHash = useRef(false);

  useEffect(() => {
    const initAuth = async () => {
      // 1. Check for session_id in URL hash (OAuth callback)
      const hash = window.location.hash;
      if (hash && hash.includes('session_id=')) {
        if (hasProcessedHash.current) return;
        hasProcessedHash.current = true;

        const sessionId = new URLSearchParams(hash.substring(1)).get('session_id');
        // Clear hash to clean up URL
        window.history.replaceState(null, '', window.location.pathname);

        try {
          const res = await axios.post(`${API}/auth/callback`, { session_id: sessionId }, { withCredentials: true });
          setUser(res.data.user);
          toast.success(`Welcome back, ${res.data.user.name.split(' ')[0]}!`);
        } catch (error) {
          console.error("Auth callback failed", error);
          toast.error("Login failed. Please try again.");
        } finally {
          setLoading(false);
        }
      } else {
        // 2. Check existing session
        try {
          const res = await axios.get(`${API}/auth/me`, { withCredentials: true });
          setUser(res.data);
        } catch (error) {
          // Not logged in, which is fine
          setUser(null);
        } finally {
          setLoading(false);
        }
      }
    };

    initAuth();
  }, []);

  const login = () => {
    const redirectUrl = window.location.origin; // Redirect back to home
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      setUser(null);
      toast.success("Logged out successfully");
      window.location.href = "/"; // Force refresh/redirect
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
