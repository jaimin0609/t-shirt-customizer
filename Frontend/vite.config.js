import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'

// Ensure critical CSS file exists
const criticalCssPath = resolve(__dirname, 'public/critical.css')
if (!fs.existsSync(criticalCssPath)) {
  try {
    // If missing, create a simple version
    const basicCSS = `
      /* Minimal critical CSS for initial render */
      body{margin:0;font-family:'Roboto','Montserrat',sans-serif;}
      .flex{display:flex}.items-center{align-items:center}.justify-center{justify-content:center}
      .w-full{width:100%}.text-center{text-align:center}.bg-white{background-color:white}
    `
    fs.writeFileSync(criticalCssPath, basicCSS)
    console.log('Created basic critical.css file')
  } catch (err) {
    console.error('Failed to create critical.css file:', err)
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
      },
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
      // Set React as external to ensure proper loading
      rollupOptions: {
        // Make React and ReactDOM externals when using CDN links
        external: mode === 'production' ? ['react', 'react-dom'] : [],
        output: {
          manualChunks: {
            // Group React and related libraries in a vendor chunk
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            // Group UI components in their own chunk
            'vendor-ui': ['react-toastify'],
            // Group context-related code
            'app-contexts': [
              './src/contexts/AuthContext.jsx',
              './src/contexts/CartContext.jsx', 
              './src/contexts/WishlistContext.jsx',
              './src/contexts/NotificationContext.jsx'
            ],
          },
          // Properly resolve external imports
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
          },
          assetFileNames: (assetInfo) => {
            // Place CSS files in a dedicated directory
            if (assetInfo.name.endsWith('.css')) {
              return 'assets/css/[name].[hash].[ext]'
            }
            return 'assets/[name].[hash].[ext]'
          },
          chunkFileNames: 'assets/js/[name].[hash].js',
          entryFileNames: 'assets/js/[name].[hash].js',
        },
      },
      // Enable source maps for debugging in development
      sourcemap: mode !== 'production',
      // Ensure CSS is processed correctly
      cssCodeSplit: true,
      // Configure minification to preserve React global references
      minify: mode === 'production' ? 'esbuild' : false,
      // Handle dynamic imports gracefully
      dynamicImportVarsOptions: {
        warnOnError: true,
      },
      // Explicitly copy public directory contents to output directory
      copyPublicDir: true,
      emptyOutDir: true,
    },
    css: {
      // Improved PostCSS configuration
      postcss: './postcss.config.js',
      // Enable sourcemaps in development
      devSourcemap: true,
    },
    optimizeDeps: {
      // Make sure React is properly pre-bundled
      include: ['react', 'react-dom', 'react-router-dom', 'react-toastify'],
      // Ensure dependencies aren't optimized multiple times
      force: mode === 'development',
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    // Custom configuration to ensure public CSS files are properly handled
    publicDir: resolve(__dirname, 'public'),
  }
})
