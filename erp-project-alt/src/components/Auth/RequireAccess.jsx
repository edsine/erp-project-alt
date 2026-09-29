import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Client-side route guard. Renders children only when the `check` predicate
 * passes for the current user; otherwise redirects away from the protected area.
 */
const RequireAccess = ({ check, children, redirectTo = '/dashboard' }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (typeof check === 'function' && !check(user)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default RequireAccess;
