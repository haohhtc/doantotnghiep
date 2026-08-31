// Tien ich doc thong tin dang nhap tu localStorage (xem pages/Login - luu { username, fullName, role }
// sau khi goi /api/auth/login). Dung chung cho AppLayout (an menu) va cac trang danh muc (an nut).
export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

export function getCurrentRole() {
  return getCurrentUser()?.role || null;
}

export function hasAnyRole(...roles) {
  const role = getCurrentRole();
  return role != null && roles.includes(role);
}
