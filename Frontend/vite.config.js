import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import { resolve } from 'path'

// Get current directory using ES modules pattern
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isProd = process.env.NODE_ENV === 'production'
const analyze = process.env.ANALYZE === 'true'

// Create output directories if they don't exist
const createOutputDirs = () => {
  const dirs = ['dist']
  dirs.forEach(dir => {
    const dirPath = path.resolve(__dirname, dir)
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
  })
}

// Critical CSS configuration for production
const configureCriticalCSS = () => {
  if (isProd) {
    // Ensure the critical CSS file exists in public directory
    const criticalCSSPath = path.resolve(__dirname, 'public/critical.css')
    const fallbackCSSPath = path.resolve(__dirname, 'public/fallback.css')
    
    // Create empty files if they don't exist
    if (!fs.existsSync(criticalCSSPath)) {
      fs.writeFileSync(criticalCSSPath, '/* Critical CSS will be generated during build */')
    }
    
    if (!fs.existsSync(fallbackCSSPath)) {
      fs.writeFileSync(fallbackCSSPath, '/* Fallback CSS in case main bundle fails to load */')
    }
  }
}

// Make sure output directories exist
createOutputDirs()

// Configure critical CSS
configureCriticalCSS()

// Main Vite configuration
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  const env = Object.assign({}, process.env)
  const isProd = mode === 'production'
  
  // Client build configuration
  const buildConfig = {
    outDir: 'dist',
    minify: isProd,
    sourcemap: !isProd,
    // Ensure React is included in the main bundle
    rollupOptions: {
      output: {
        entryFileNames: isProd ? 'assets/[name].[hash].js' : 'assets/[name].js',
        chunkFileNames: isProd ? 'assets/[name].[hash].js' : 'assets/[name].js',
        assetFileNames: isProd ? 'assets/[name].[hash].[ext]' : 'assets/[name].[ext]',
        // Disable code splitting for React packages by including them in the main bundle
        manualChunks: (id) => {
          // Critical React dependencies must be in the main bundle to avoid context errors
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/scheduler') ||
              id.includes('node_modules/prop-types')) {
            return 'index'; // "index" is the main entry chunk
          }
          
          // Other dependencies can be in the vendor chunk
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          
          return undefined; // default to automatic chunk naming
        }
      },
      preserveEntrySignatures: "strict"
    },
    // Generate compressed chunks for modern browsers
    target: 'esnext'
  }
  
  // Combine with main configuration
  return {
    plugins: [
      react({
        // Optimize React rendering
        jsxRuntime: 'automatic',
        // Disable React Fast Refresh which can interfere with context
        fastRefresh: false
      }),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['favicon.ico', 'logo.png', 'icons/*.png'],
        manifest: false, // Use our custom manifest.json in public directory
        workbox: {
          globPatterns: [
            '**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}'
          ],
          navigateFallback: 'index.html',
          navigateFallbackDenylist: [/^\/api/, /^\/admin/]
        }
      }),
      analyze && visualizer({
        filename: path.resolve(__dirname, 'dist/stats.html'),
        open: true,
        gzipSize: true
      })
    ].filter(Boolean),
    
    build: buildConfig,
    
    optimizeDeps: {
      // Force inclusion of React dependencies to ensure they're processed correctly
      include: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react-router-dom',
        'react-toastify',
        'scheduler',
        'prop-types'
      ],
      esbuildOptions: {
        target: 'es2020'
      }
    },
    
    css: {
      devSourcemap: !isProd,
      modules: {
        // Hashed class names in production for better cacheability
        generateScopedName: isProd ? 
          '[hash:base64:8]' : 
          '[name]__[local]'
      }
    },
    
    server: {
      port: 3000,
      strictPort: true,
      host: true,
      cors: true,
      proxy: {
        '/api': {
          target: 'https://t-shirt-customizer-backend.onrender.com',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '/api'),
        },
      }
    },
    
    preview: {
      port: 3000,
      strictPort: true,
      host: true,
      cors: true,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      },
      // Ensure .jsx extensions are handled properly
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
    },
    
    // Custom configuration to ensure public CSS files are properly handled
    publicDir: path.resolve(__dirname, 'public'),
    
    // Define environment variables for proper React detection
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.REACT_APP_VERSION': JSON.stringify(process.env.npm_package_version || '1.0.0'),
      'process.env.BASE_URL': JSON.stringify('/')
    }
  };
});
