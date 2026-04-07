"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AxiosRequestConfig } from "axios";
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

  useEffect(() => {
    if (session?.accessToken) {
      api.defaults.headers.common.Authorization = `Bearer ${session.accessToken}`;
      return;
    }

    delete api.defaults.headers.common.Authorization;
  }, [session?.accessToken]);

  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use((config) => {
      if (session?.accessToken) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${session.accessToken}`;
      }
      return config;
    });

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = (error?.config || {}) as AxiosRequestConfig & { _retry?: boolean };
        const isUnauthorized = error?.response?.status === 401;
        const isAuthRoute =
          typeof originalRequest.url === "string" &&
          (originalRequest.url.includes("/auth/login") || originalRequest.url.includes("/auth/refresh"));

        if (!isUnauthorized || !session?.refreshToken || originalRequest._retry || isAuthRoute) {
          return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
          const { data } = await api.post("/auth/refresh", { refreshToken: session.refreshToken });
          const newAccessToken = data?.accessToken as string;

          if (!newAccessToken) {
            throw new Error("Refresh token flow returned no access token");
          }

          setSession((previous) => (previous ? { ...previous, accessToken: newAccessToken } : previous));

          originalRequest.headers = originalRequest.headers || {};
          (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${newAccessToken}`;

          return api(originalRequest);
        } catch (refreshError) {
          setSession(null);
          localStorage.removeItem(SESSION_KEY);
          return Promise.reject(refreshError);
        }
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [session?.accessToken, session?.refreshToken]);

  const login = async (email: string, password: string) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
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
    delete api.defaults.headers.common.Authorization;
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
