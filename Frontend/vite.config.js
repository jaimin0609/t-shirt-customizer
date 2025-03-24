import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  build: {
    outDir: 'dist',
    minify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            'react',
            'react-dom',
            'react-router-dom',
            'react-toastify'
          ]
        }
      }
    },
    commonjsOptions: {
      include: [/react-toastify/, /node_modules/]
    }
  },
  
  optimizeDeps: {
    include: ['react-toastify']
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'react-toastify': path.resolve(__dirname, 'node_modules/react-toastify')
    }
  },
  
  server: {
    port: 3000,
    cors: true
  }
});
