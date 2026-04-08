import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { getAuthSession } from "../lib/authApi";
import { AuthSession } from "../types/AuthSession";

interface AuthContextType {
  authSession: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshAuthSession: () => Promise<void>;
}

const anonymousSession: AuthSession = {
  isAuthenticated: false,
  username: null,
  email: null,
  roles: [],
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuthSession = useCallback(async () => {
    try {
      const session = await getAuthSession();
      setAuthSession(session);
    } catch {
      setAuthSession(anonymousSession);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuthSession();
  }, [refreshAuthSession]);

  return (
    <AuthContext.Provider
      value={{
        authSession,
        isAuthenticated: authSession?.isAuthenticated ?? false,
        isLoading,
        refreshAuthSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
