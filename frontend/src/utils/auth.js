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

// Decode phan payload cua JWT (khong xac thuc chu ky - chi doc claim "exp" de tu kiem tra
// het han o Frontend, xac thuc that van do Backend lam qua JwtUtil.isValid). JWT dung base64url
// (khac base64 thuong o cho "-"/"_" thay vi "+"/"/" va khong co padding "=").
function decodeJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// True neu token khong doc duoc hoac claim "exp" (giay, chuan JWT) da qua thoi diem hien tai.
export function isTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
}
