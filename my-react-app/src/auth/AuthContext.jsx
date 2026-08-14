import { createContext, useContext, useEffect, useState } from "react";
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

  // On mount, re-validate the stored session against the backend (or the mock).
  useEffect(() => {
    let cancelled = false;
    apiClient
      .get("/auth/user/me")
      .then((res) => {
        if (cancelled) return;
        setUser(res.user || null);
      })
      .catch(() => {
        // No valid session — clear any stale stored user.
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

  const persist = (nextUser) => {
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  };

  const login = async (email, password) => {
    const res = await apiClient.post("/auth/user/login", { email, password });
    persist(res.user);
    return res.user;
  };

  const register = async (name, email, password) => {
    const res = await apiClient.post("/auth/user/register", {
      name,
      email,
      password,
    });
    persist(res.user);
    return res.user;
  };

  const logout = async () => {
    try {
      await apiClient.post("/auth/user/logout");
    } finally {
      persist(null);
    }
  };

  const updateProfile = async (updates) => {
    const res = await apiClient.put("/auth/user/profile", updates);
    persist(res.user);
    return res.user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
