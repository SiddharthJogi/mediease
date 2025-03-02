import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), // Enables React support with fast refresh
  ],
  server: {
    port: 5173, // Default port for your app
    host: true, // Allows access from network (e.g., localhost:5173)
    mimeTypes: {
      'application/javascript': ['js'], // Ensures .js files (like firebase-messaging-sw.js) are served correctly
    },
  },
  build: {
    outDir: 'dist', // Output directory for production build
    sourcemap: true, // Generate sourcemaps for easier debugging
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'axios'], // Split vendor libs for optimization
          firebase: ['firebase/app', 'firebase/messaging'], // Separate Firebase libs
        },
      },
    },
  },
});