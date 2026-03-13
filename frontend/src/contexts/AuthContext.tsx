import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import type { User, UserRole } from "@/lib/types";
import { login as apiLogin } from "@/lib/api";
import { set } from "date-fns";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (phone: string, role: UserRole, name?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "agrichain_auth";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // 🔐 Load saved login from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      setUser(parsed.user);
      setToken(parsed.token);
      localStorage.setItem("agrichain_token", parsed.token); // Ensure apiClient can read it
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // 🔑 REAL LOGIN (calls backend)
 const login = async (phone: string, role: UserRole, name?: string) => {
  try {
    const res = await apiLogin(phone, role, name || "Unnamed User");
    // ✅ update state
    const user=res.user;
    const token=res.token;
    setUser(user);
    setToken(token);

    // ✅ persist properly
    localStorage.setItem("agrichain_token",res.token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }));
  } catch (err) {
    console.error("Auth login failed:", err);
    throw err;
  }
};

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        login,
        logout: () => {
          setUser(null);
          setToken(null);
          localStorage.removeItem("agrichain_token");
          localStorage.removeItem(STORAGE_KEY);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
