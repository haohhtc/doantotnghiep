import { useEffect, useCallback, useReducer } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Luu tru 1 cap [isLoading, value] cho 1 key - dung expo-secure-store tren thiet bi thuc, localStorage
// tren web (SecureStore khong ho tro web). Theo pattern chinh thuc cua Expo Router cho SessionProvider.
function useAsyncState(initialValue = [true, null]) {
  return useReducer(
    (state, action) => [false, action],
    initialValue
  );
}

async function setStorageItemAsync(key, value) {
  if (Platform.OS === 'web') {
    try {
      if (value === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, value);
    } catch (e) {
      console.error('Loi luu localStorage', e);
    }
  } else if (value === null) {
    await SecureStore.deleteItemAsync(key);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

export function useStorageState(key) {
  const [state, setState] = useAsyncState();

  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        setState(window.localStorage.getItem(key));
      } catch {
        setState(null);
      }
    } else {
      SecureStore.getItemAsync(key).then((value) => setState(value));
    }
  }, [key]);

  const setValue = useCallback(
    (value) => {
      setState(value);
      setStorageItemAsync(key, value);
    },
    [key]
  );

  return [state, setValue];
}
