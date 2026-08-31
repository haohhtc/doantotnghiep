import { Navigate, Outlet } from 'react-router-dom';
import { getCurrentRole } from '../utils/auth';
import ForbiddenPage from './ForbiddenPage';

// Chan truy cap cac route con khi chua co token dang nhap trong localStorage (xem pages/Login).
// Truyen `allowedRoles` de gioi han them theo role (vd: /users, /roles chi ADMIN) - neu role
// hien tai khong nam trong danh sach, hien man 403 thay vi render route con.
export default function ProtectedRoute({ allowedRoles }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(getCurrentRole())) {
    return <ForbiddenPage />;
  }
  return <Outlet />;
}
