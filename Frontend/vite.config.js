import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Security: Only allow connections from localhost
    host: 'localhost',
    hmr: {
      // Only allow websocket connections from same origin
      clientPort: 5173,
      host: 'localhost'
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      // Explicitly mark FontAwesome modules as external if they can't be resolved
      external: [
        // Add these only if they can't be resolved during build
        ...(process.env.NODE_ENV === 'production' ? [
          '@fortawesome/react-fontawesome',
          '@fortawesome/fontawesome-svg-core',
          '@fortawesome/free-solid-svg-icons',
          '@fortawesome/free-regular-svg-icons',
          '@fortawesome/free-brands-svg-icons'
        ] : [])
      ]
    }
  },
  resolve: {
    alias: {
      // Add any necessary aliases here
    }
  }
})
