"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "./api";
import type { AuthSession } from "./types";

interface AuthContextValue {
  session: AuthSession | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
  token: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = "edu_session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = localStorage.getItem(SESSION_KEY);
    if (cached) {
      try {
        setSession(JSON.parse(cached));
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!session) return;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }, [session]);

  const login = async (email: string, password: string) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });
      return { ok: true };
    } catch (error: any) {
      return { ok: false, message: error?.response?.data?.message || "Login failed" };
    }
  };

  const logout = async () => {
    if (session?.refreshToken) {
      try {
        await api.post("/auth/logout", { refreshToken: session.refreshToken });
      } catch {
        // no-op: continue local cleanup even if API logout fails
      }
    }

    setSession(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const value = useMemo(
    () => ({ session, loading, login, logout, token: session?.accessToken || null }),
    [session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
