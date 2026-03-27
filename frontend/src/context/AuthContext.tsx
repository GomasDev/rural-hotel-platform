// AuthContext.tsx ← COPIA COMPLETO (solo +3 líneas)
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface User {  // ← NUEVO: Define tu User
  id: string;
  name: string;
  email: string;
  role: string;  // admin, user, hotel_owner...
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;     // ← NUEVO
  logout: () => void;
  checkAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);  // ← NUEVO

  const checkAuth = () => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');  // ← NUEVO
    if (token) {
      setIsAuthenticated(true);
      if (userData) setUser(JSON.parse(userData));  // ← NUEVO
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');  // ← NUEVO
    setIsAuthenticated(false);
    setUser(null);  // ← NUEVO
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}