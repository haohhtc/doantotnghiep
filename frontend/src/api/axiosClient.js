import axios from 'axios';

// Instance dung chung cho moi call den Backend.
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
});

// Tu gan JWT token (luu tu luc dang nhap that - xem pages/Login) vao moi request.
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Token het han/khong hop le -> xoa phien va dua ve trang login.
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// --- Cache nhe cho GET: tranh goi lai API moi lan quay lai 1 trang/mo lai modal trong thoi
// gian ngan (vd chuyen tab roi quay lai). TTL ngan + tu xoa cache khi co POST/PUT/DELETE/PATCH
// len cung "resource goc" (vd PUT /sales-orders/5 se xoa cache cua GET /sales-orders?...).
// Dung axiosClient.get(url, { skipCache: true }) de bo qua cache cho 1 call cu the.
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 phut
const cacheStore = new Map(); // key (url+params) -> { response, expiry }

function cacheKey(url, params) {
  const path = url.startsWith('/') ? url : `/${url}`;
  return params ? `${path}?${JSON.stringify(params)}` : path;
}

// "Resource goc" cua 1 url - dung lam tien to de xoa cache lien quan khi co mutation. Vd:
// '/sales-orders/5/confirm' -> '/sales-orders' (dung lai o segment so, khop quy uoc REST cua BE).
function resourceRoot(url) {
  const path = (url.startsWith('/') ? url : `/${url}`).split('?')[0];
  const segments = path.split('/').filter(Boolean);
  const rootSegments = [];
  for (const seg of segments) {
    if (/^\d+$/.test(seg)) break;
    rootSegments.push(seg);
  }
  return `/${rootSegments.join('/')}`;
}

function invalidateByRoot(root) {
  for (const key of cacheStore.keys()) {
    if (key.startsWith(root)) cacheStore.delete(key);
  }
}

const originalGet = axiosClient.get.bind(axiosClient);
axiosClient.get = (url, config = {}) => {
  const { skipCache, ...rest } = config;
  if (skipCache) return originalGet(url, rest);

  const key = cacheKey(url, rest.params);
  const hit = cacheStore.get(key);
  if (hit && hit.expiry > Date.now()) {
    return Promise.resolve(hit.response);
  }
  return originalGet(url, rest).then((response) => {
    cacheStore.set(key, { response, expiry: Date.now() + CACHE_TTL_MS });
    return response;
  });
};

axiosClient.interceptors.response.use((response) => {
  const method = response.config.method?.toLowerCase();
  if (method && method !== 'get') {
    invalidateByRoot(resourceRoot(response.config.url || ''));
  }
  return response;
});

export default axiosClient;
