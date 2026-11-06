import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getToken } from './tokenStorage';

const BACKEND_PORT = 8080;

// Tu nhan dien IP may chay backend, KHONG can sua .env moi lan doi mang Wi-Fi (truong/nha...).
// - Web preview: lay thang hostname tu URL dang mo (dung ca khi mo bang IP LAN tu dien thoai khac).
// - App that (Expo Go/dev build): Constants.expoConfig.hostUri la "LAN_IP:metroPort" Expo tu dien
//   ra moi lan chay "npx expo start" - luon khop dung IP hien tai cua may, bat ke mang nao.
// EXPO_PUBLIC_API_URL trong .env (neu co) van duoc uu tien - dung khi muon tro toi backend khac
// (vd da trien khai that), chi mat tac dung khi de trong.
function resolveBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `http://${window.location.hostname}:${BACKEND_PORT}`;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  const lanIp = hostUri?.split(':')?.[0];
  if (lanIp) return `http://${lanIp}:${BACKEND_PORT}`;

  return `http://localhost:${BACKEND_PORT}`;
}

const BASE_URL = resolveBaseUrl();

export const apiClient = axios.create({ baseURL: BASE_URL });

apiClient.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Backend luon tra ve {success, message, data} (xem ApiResponse) - loi cung vay (success=false).
// Lay thang message tieng Viet co san de hien thi, khong can tu dung message khac.
export function errorMessage(error) {
  return error.response?.data?.message || 'Loi khong xac dinh, kiem tra lai ket noi mang';
}
