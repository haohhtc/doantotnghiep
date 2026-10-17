import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// expo-secure-store CHI ho tro Android/iOS, khong co tren web (xem docs.expo.dev/versions/.../sdk/securestore)
// - goi thang tren web se loi. Dung localStorage thay the khi chay web, giong pattern o useStorageState.js.
const TOKEN_KEY = 'token';

export async function getToken() {
  if (Platform.OS === 'web') {
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(value) {
  if (Platform.OS === 'web') {
    try {
      window.localStorage.setItem(TOKEN_KEY, value);
    } catch {
      // ignore
    }
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, value);
}

export async function clearToken() {
  if (Platform.OS === 'web') {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
