import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "../types";
import { api, getToken, removeToken } from "../services/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, expectedRole?: UserRole) => Promise<void>;
  register: (name: string, email: string, password: string, role?: UserRole) => Promise<void>;
  logout: () => void;
  updateUser: (updatedData: { name?: string; email?: string }) => Promise<void>;
  quickLoginDemo: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate existing token on boot
  useEffect(() => {
    async function loadUser() {
      const storedToken = getToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }
      try {
        const userData = await api.getMe();
        setUser(userData);
        setTokenState(storedToken);
      } catch (err) {
        console.warn("Session expired or invalid token:", err);
        removeToken();
        setUser(null);
        setTokenState(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (email: string, password: string, expectedRole?: UserRole) => {
    setIsLoading(true);
    try {
      const response = await api.login({ email, password });
      if (expectedRole && response.user.role !== expectedRole) {
        removeToken();
        throw new Error(
          `This account is registered under the ${response.user.role} role. Please sign in with a ${expectedRole} account.`
        );
      }
      setUser(response.user);
      setTokenState(response.access_token);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole = "USER") => {
    setIsLoading(true);
    try {
      const response = await api.register({ name, email, password, role });
      setUser(response.user);
      setTokenState(response.access_token);
    } finally {
      setIsLoading(false);
    }
  };

  const quickLoginDemo = async (role: UserRole) => {
    const emailMap: Record<UserRole, string> = {
      USER: "user@example.com",
      DERMATOLOGIST: "derm@example.com",
      ADMIN: "admin@example.com",
    };
    const email = emailMap[role] || "user@example.com";
    await login(email, "password123", role);
  };

  const logout = () => {
    removeToken();
    setUser(null);
    setTokenState(null);
  };

  const updateUser = async (data: { name?: string; email?: string }) => {
    const updated = await api.updateUserProfile(data);
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        quickLoginDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
