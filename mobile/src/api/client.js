import axios from 'axios';
import { getToken } from './tokenStorage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

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
