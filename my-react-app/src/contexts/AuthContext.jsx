import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiClient } from "../api/client";

const AuthContext = createContext(null);

const USER_KEY = "sudoku_arena_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // On mount, re-validate the stored session against the backend.
  useEffect(() => {
    let cancelled = false;
    apiClient
      .get("/auth/user/me")
      .then((res) => {
        if (cancelled) return;
        setUser(res.user || null);
      })
      .catch(() => {
        if (cancelled) return;
        localStorage.removeItem(USER_KEY);
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((nextUser) => {
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await apiClient.post("/auth/user/login", { email, password });
    persist(res.user);
    return res.user;
  }, [persist]);

  const register = useCallback(async (name, email, password) => {
    const res = await apiClient.post("/auth/user/register", {
      name,
      email,
      password,
    });
    persist(res.user);
    return res.user;
  }, [persist]);

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/auth/user/logout");
    } finally {
      persist(null);
    }
  }, [persist]);

  const updateProfile = useCallback(async (updates) => {
    const res = await apiClient.put("/auth/user/profile", updates);
    persist(res.user);
    return res.user;
  }, [persist]);

  const forgotPassword = useCallback(async (email) => {
    const res = await apiClient.post("/auth/user/forgot-password", { email });
    return res;
  }, []);

  const resetPassword = useCallback(async (token, password) => {
    const res = await apiClient.post("/auth/user/reset-password", {
      token,
      password,
    });
    return res;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
