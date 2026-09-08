import { Navigate, Outlet } from 'react-router-dom';
import { getCurrentRole, isTokenExpired } from '../utils/auth';
import ForbiddenPage from './ForbiddenPage';

// Chan truy cap cac route con khi chua co token dang nhap, hoac token da het han (tu doc claim
// "exp" trong JWT - xem utils/auth.js) - xoa luon token/user khoi storage va ve /login ngay,
// khong doi goi API roi bi 401 moi bi vang ra nhu truoc.
// Truyen `allowedRoles` de gioi han them theo role (vd: /users, /roles chi ADMIN) - neu role
// hien tai khong nam trong danh sach, hien man 403 thay vi render route con.
export default function ProtectedRoute({ allowedRoles }) {
  const token = localStorage.getItem('token');

  if (!token || isTokenExpired(token)) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(getCurrentRole())) {
    return <ForbiddenPage />;
  }
  return <Outlet />;
}
