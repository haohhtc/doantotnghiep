import axios from 'axios';

// Instance dung chung cho moi call den Backend. Tu gan interceptor gan JWT token,
// xu ly refresh/redirect khi 401 tai day.
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
});

export default axiosClient;
