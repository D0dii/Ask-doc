import { authControllerLogout, authControllerMe, authControllerRefresh } from "@/client";
import type { User } from "./types/user";
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        let { data, response } = await authControllerMe({ throwOnError: false });

        if (response.status === 401) {
          const refresh = await authControllerRefresh({ throwOnError: false });
          if (refresh.response.ok) {
            ({ data, response } = await authControllerMe({ throwOnError: false }));
          }
        }

        setUser(response.ok && data ? (data as User) : null);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchUser();
  }, []);

  const login = () => {
    window.location.href = `${import.meta.env.VITE_backend_url}/auth/google`;
  };

  const logout = async () => {
    try {
      await authControllerLogout({ throwOnError: false });
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
