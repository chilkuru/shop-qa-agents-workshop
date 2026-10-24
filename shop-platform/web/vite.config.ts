import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// API base URL is injected at build time from VITE_API_BASE_URL (12-factor III).
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
  },
});
