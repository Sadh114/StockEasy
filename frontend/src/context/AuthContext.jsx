import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import apiClient from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    setAuthLoading(true);
    try {
      const { data } = await apiClient.get("/api/me");
      if (data?.success) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (_error) {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = useCallback(async (payload) => {
    const { data } = await apiClient.post("/auth/login", payload);
    if (data?.success) {
      setUser(data.user);
    }
    return data;
  }, []);

  const signup = useCallback(async (payload) => {
    const { data } = await apiClient.post("/auth/signup", payload);
    if (data?.success) {
      setUser(data.user);
    }
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/api/logout");
    } catch (_error) {
      // Session might already be invalid.
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      authLoading,
      login,
      signup,
      logout,
      refreshSession,
    }),
    [authLoading, login, logout, refreshSession, signup, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
