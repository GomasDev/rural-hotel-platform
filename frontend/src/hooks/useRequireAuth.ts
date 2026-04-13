// src/hooks/useRequireAuth.ts
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // tu hook de autenticación

export function useRequireAuth() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const requireAuth = (callback: () => void) => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    callback();
  };

  return { requireAuth };
}