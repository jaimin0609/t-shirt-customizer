import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'

// Get current directory using ES modules pattern
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const require = createRequire(import.meta.url)

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
    rollupOptions: {
      output: {
        entryFileNames: isProd ? 'assets/[name].[hash].js' : 'assets/[name].js',
        chunkFileNames: isProd ? 'assets/[name].[hash].js' : 'assets/[name].js',
        assetFileNames: isProd ? 'assets/[name].[hash].[ext]' : 'assets/[name].[ext]',
        manualChunks: (id) => {
          // Split vendor code into separate chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('scheduler')) {
              return 'vendor-react'
            } else if (id.includes('router')) {
              return 'vendor-router'
            } else {
              return 'vendor'
            }
          }
          
          // Split app code into logical chunks
          if (id.includes('/components/')) {
            return 'components'
          } else if (id.includes('/pages/')) {
            return 'pages'
          } else if (id.includes('/contexts/')) {
            return 'contexts'
          } else if (id.includes('/utils/') || id.includes('/services/')) {
            return 'utils'
          }
          
          // Default chunk
          return undefined
        }
      }
    },
    // Generate compressed chunks for modern browsers
    target: 'esnext',
    terserOptions: {
      compress: {
        ecma: 2020,
        passes: isProd ? 2 : 1
      }
    }
  }
  
  // Combine with main configuration
  return {
    plugins: [
      react(),
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
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'react-toastify'
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
      },
      preprocessorOptions: {
        // Add any CSS preprocessor options here if needed
      }
    },
    
    server: {
      port: 3000,
      strictPort: true,
      host: true,
      cors: true
    },
    
    preview: {
      port: 3000,
      strictPort: true,
      host: true,
      cors: true
    },
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        // Add aliases for direct imports - ensure paths are correct
        'react': path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom')
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
      // Remove the CDN React flag as it causes confusion
      'process.env.BASE_URL': JSON.stringify('/'),
    }
  };
});
