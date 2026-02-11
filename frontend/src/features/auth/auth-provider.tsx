import { client } from "@/client/client.gen";
import type { User } from "./types";
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
      const response = await client.get<User>({
        url: "/auth/me",
      });

      setUser(response.data ?? null);
      setIsLoading(false);
    };
    void fetchUser();
  }, []);

  const login = () => {
    window.location.href = `${import.meta.env.VITE_backend_url}/auth/google`;
  };

  const logout = async () => {
    await client.post({ url: "/auth/logout" });
    setUser(null);
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
