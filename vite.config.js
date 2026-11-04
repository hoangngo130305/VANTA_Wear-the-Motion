import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' + HashRouter => the build works from any sub-path (GitHub Pages, a folder, file hosting)
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 800 }
});
