import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { client } from "../client/client.gen";
import type { User } from "../types/user";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const response = await client.get<User>({
        url: "/auth/me",
      });

      if (response.data) {
        setUser(response.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(() => {
    // Redirect to backend Google OAuth endpoint
    const backendUrl = import.meta.env.VITE_backend_url;
    window.location.href = `${backendUrl}/auth/google`;
  }, []);

  const logout = useCallback(async () => {
    try {
      await client.post({
        url: "/auth/logout",
      });
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, []);

  const refetchUser = useCallback(async () => {
    setIsLoading(true);
    await fetchUser();
  }, [fetchUser]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
