import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

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
    // Ensure CSS gets properly extracted and loaded
    cssCodeSplit: false,
    // Improve asset handling
    assetsInlineLimit: 4096,
    // Ensure source maps for better debugging
    sourcemap: true,
    // Use the default CSS minifier (removed lightningcss)
    rollupOptions: {
      output: {
        // Ensure assets are properly hashed for cache control
        assetFileNames: 'assets/[name].[hash].[ext]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
        // Manually chunk the CSS to ensure it loads correctly
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
    // Explicitly copy public directory contents to output directory
    copyPublicDir: true
  },
  css: {
    // PostCSS options explicitly defined here
    postcss: {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
        process.env.NODE_ENV === 'production' ? require('cssnano')({ preset: 'default' }) : null
      ].filter(Boolean)
    }
  },
  optimizeDeps: {
    include: [
      '@fortawesome/fontawesome-svg-core',
      '@fortawesome/free-solid-svg-icons',
      '@fortawesome/free-regular-svg-icons',
      '@fortawesome/free-brands-svg-icons',
      '@fortawesome/react-fontawesome'
    ]
  },
  resolve: {
    alias: {
      // Add any necessary aliases here
    }
  },
  // Custom configuration to ensure public CSS files are properly handled
  publicDir: resolve(__dirname, 'public'),
})
