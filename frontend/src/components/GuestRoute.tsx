import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Props {
  children: React.ReactNode;
}

export default function GuestRoute({ children }: Props) {
  const { isAuthenticated } = useAuth();

  // Autenticado → siempre al dashboard, sin importar el rol
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}