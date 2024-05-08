import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  resolve: {
    alias: {
      src: '/src',
    },
  },
  assetsInclude: ['**/*.csv', '**/*.fnt'],
  build: {
    assetsInlineLimit: 0,
  },
  server: {
    open: true,
    port: 3000,
    host: true,
  },
  base: '/aladdin',
});
