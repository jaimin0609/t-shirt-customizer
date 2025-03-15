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

// Ensure fallback CSS file exists
const fallbackCssPath = path.resolve(__dirname, 'public/fallback.css')
if (!fs.existsSync(fallbackCssPath)) {
  try {
    // If missing, create a simple version
    const fallbackCSS = `
      /* Fallback CSS for use when main CSS fails to load */
      body{margin:0;font-family:sans-serif;line-height:1.5;color:#333;}
      .container{width:90%;max-width:1200px;margin:0 auto;padding:1rem;}
      .error{color:#e53e3e;background:#fee2e2;padding:1rem;border-radius:0.25rem;margin:1rem 0;}
      button{background:#4a6cf7;color:white;border:none;padding:0.5rem 1rem;border-radius:0.25rem;cursor:pointer;}
      button:hover{background:#3755d1;}
    `
    fs.writeFileSync(fallbackCssPath, fallbackCSS)
    console.log('Created fallback.css file')
  } catch (err) {
    console.error('Failed to create fallback.css file:', err)
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  const env = loadEnv(mode, process.cwd(), '')
  const isProd = mode === 'production'

  return {
    plugins: [
      react({
        // Improve React refresh reliability
        fastRefresh: true,
        // Add React import source so it's consistent
        jsxImportSource: 'react'
      })
    ],
    
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
        external: isProd ? ['react', 'react-dom', 'react-dom/client'] : [],
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
            
            // Separate our context files to improve caching
            if (id.includes('/contexts/')) {
              // Split contexts into separate chunks for better loading
              if (id.includes('AuthContext')) {
                return 'context-auth'
              }
              if (id.includes('CartContext')) {
                return 'context-cart'
              }
              if (id.includes('WishlistContext')) {
                return 'context-wishlist'
              }
              if (id.includes('NotificationContext')) {
                return 'context-notification'
              }
              return 'app-contexts'
            }
            
            // Other node_modules go in vendor
            if (id.includes('node_modules')) {
              return 'vendor'
            }
          },
          // Properly resolve external imports
          globals: {
            'react': 'React',
            'react-dom': 'ReactDOM',
            'react-dom/client': 'ReactDOM',
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
      // Configure minification - preserving React globals
      minify: isProd ? 'esbuild' : false,
      terserOptions: isProd ? {
        // Don't mangle React global variable name
        mangle: {
          reserved: ['React', 'ReactDOM']
        },
        compress: {
          // Keep React variable names intact
          keep_fnames: /^React|ReactDOM|useState|useContext|createContext/
        }
      } : undefined,
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
      include: [
        'react', 
        'react-dom', 
        'react-router-dom', 
        'react-toastify'
      ],
      // Force optimization in development
      force: !isProd,
      // Exclude certain files from optimization to avoid issues
      exclude: [
        'src/contexts/*.jsx'
      ],
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
      // Indicate to code that we're using CDN React in production
      'process.env.USE_REACT_CDN': JSON.stringify(isProd ? 'true' : 'false')
    }
  }
})
