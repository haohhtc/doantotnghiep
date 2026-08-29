import { Navigate, Outlet } from 'react-router-dom';

// Chan truy cap cac route con khi chua co token dang nhap trong localStorage (xem pages/Login).
export default function ProtectedRoute() {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
