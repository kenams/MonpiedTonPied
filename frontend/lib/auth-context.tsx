"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { api } from "./api";

export type UserRole = "consumer" | "creator" | "admin";

export type AuthUser = {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  role: UserRole;
  bio?: string;
  verifiedCreator?: boolean;
  subscriptionActive?: boolean;
  accessPassActive?: boolean;
  stripeConnectAccountId?: string;
  stripeConnectChargesEnabled?: boolean;
  stripeConnectPayoutsEnabled?: boolean;
};

type AuthCtx = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  isPremium: boolean;
  isCreator: boolean;
  isAdmin: boolean;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const t = localStorage.getItem("token");
    if (!t) { setLoading(false); return; }
    try {
      const data = await api.get<{ user: AuthUser }>("/api/auth/me", t);
      setUser(data.user);
      setToken(t);
    } catch {
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (email: string, password: string) => {
    const data = await api.post<{ token: string; user: AuthUser }>("/api/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const isPremium = !!(user?.subscriptionActive || user?.accessPassActive);
  const isCreator = user?.role === "creator" || user?.role === "admin";
  const isAdmin = user?.role === "admin";

  return (
    <Ctx.Provider value={{ user, token, loading, login, logout, refresh, isPremium, isCreator, isAdmin }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
