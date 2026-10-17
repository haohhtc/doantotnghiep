import { createContext, useContext } from 'react';
import { useStorageState } from './useStorageState';
import { apiClient } from '../api/client';
import { setToken, clearToken } from '../api/tokenStorage';

const SessionContext = createContext(null);

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession phai dung trong SessionProvider');
  return value;
}

export function SessionProvider({ children }) {
  const [[isLoading, sessionRaw], setSessionRaw] = useStorageState('session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;

  async function signIn(username, password) {
    const res = await apiClient.post('/api/auth/login', { username, password });
    const { token, fullName, role } = res.data.data;
    // Luu token truoc, de apiClient (interceptor doc token) dinh kem dung token cho cau goi
    // /me ngay sau day.
    await setToken(token);

    let employee = null;
    try {
      const meRes = await apiClient.get('/api/employees/me');
      employee = meRes.data.data;
    } catch {
      // Tai khoan khong gan Nhan vien nao (vd tai khoan quan tri xem thu) - van cho dang nhap,
      // cac man hinh can Nhan vien (Kho NV, Ung/Tra hang, Ban hang Van Sale) se tu bao loi rieng.
      employee = null;
    }
    setSessionRaw(JSON.stringify({ username, fullName, role, employee }));
  }

  async function signOut() {
    await clearToken();
    setSessionRaw(null);
  }

  return (
    <SessionContext.Provider value={{ session, isLoading, signIn, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}
