import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // optimizeDeps: {
  //   exclude: ['jsonwebtoken'],
  // },
  // build: {
  //   rollupOptions: {
  //     external: ['jsonwebtoken', 'crypto', 'buffer'],
  //   },
  // },
  plugins: [react()],
});
