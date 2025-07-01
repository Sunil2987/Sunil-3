import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Ensures correct asset paths in production
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  define: {
    'process.env': {} // Fix for process.env undefined errors
  }
});
