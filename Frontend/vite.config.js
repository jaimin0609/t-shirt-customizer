import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// Ensure critical CSS file exists
const criticalCssPath = path.resolve(__dirname, 'public/critical.css')
if (!fs.existsSync(criticalCssPath)) {
  try {
    // If missing, create a simple version
    const basicCSS = `
      /* Minimal critical CSS for initial render */
      body{margin:0;font-family:'Roboto','Montserrat',sans-serif;}
      .flex{display:flex}.items-center{align-items:center}.justify-center{justify-center}
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
  const env = loadEnv(mode, process.cwd(), '')
  const isProd = mode === 'production'

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
      rollupOptions: {
        // Make React and ReactDOM externals in production when using CDN links
        external: isProd ? ['react', 'react-dom'] : [],
        output: {
          manualChunks: (id) => {
            // Only create chunks for non-externalized modules
            if (!isProd) {
              // In development, chunk React libraries
              if (id.includes('node_modules/react') || 
                  id.includes('node_modules/react-dom')) {
                return 'vendor-react'
              }
              if (id.includes('node_modules/react-router') ||
                  id.includes('node_modules/react-toastify')) {
                return 'vendor-ui'
              }
            }
            
            // Always chunk our context files
            if (id.includes('/contexts/')) {
              return 'app-contexts'
            }
            
            // Other node_modules go in vendor
            if (id.includes('node_modules')) {
              return 'vendor'
            }
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
      sourcemap: !isProd,
      // Ensure CSS is processed correctly
      cssCodeSplit: true,
      // Configure minification
      minify: isProd ? 'esbuild' : false,
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
      // Pre-bundle dependencies for faster development
      include: ['react', 'react-dom', 'react-router-dom', 'react-toastify'],
      // Force optimization in development
      force: !isProd,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // Custom configuration to ensure public CSS files are properly handled
    publicDir: path.resolve(__dirname, 'public'),
  }
})
