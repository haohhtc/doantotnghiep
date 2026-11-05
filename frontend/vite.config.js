import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  // sockjs-client (dung cho Realtime WebSocket - xem pages/inventory/Inventories/index.jsx) doc
  // bien "global" cua Node.js, khong co san o trinh duyet. Vite (khac Webpack) khong tu polyfill,
  // thieu dong nay se lam ca trang trang/den vi loi JS xay ra truoc khi React kip render.
  define: {
    global: 'globalThis',
  },
});
