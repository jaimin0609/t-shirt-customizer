import { defineConfig } from 'vite'
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
    // Improved CSS extraction for better compatibility
    cssCodeSplit: true,
    // Ensure source maps for better debugging
    sourcemap: process.env.NODE_ENV !== 'production',
    // Improve asset handling
    assetsInlineLimit: 4096,
    // Use the default CSS minifier (removed lightningcss)
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // Place CSS files in a dedicated directory
          if (assetInfo.name.endsWith('.css')) {
            return 'assets/css/[name].[hash].[ext]'
          }
          return 'assets/[name].[hash].[ext]'
        },
        chunkFileNames: 'assets/js/[name].[hash].js',
        entryFileNames: 'assets/js/[name].[hash].js',
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Group common dependencies
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react'
            }
            if (id.includes('three') || id.includes('@react-three')) {
              return 'vendor-three'
            }
            return 'vendor'
          }
        }
      }
    },
    // Explicitly copy public directory contents to output directory
    copyPublicDir: true,
    emptyOutDir: true
  },
  css: {
    // Improved PostCSS configuration
    postcss: './postcss.config.js',
    // Enable sourcemaps in development
    devSourcemap: true,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@fortawesome/fontawesome-svg-core',
      '@fortawesome/free-solid-svg-icons',
      '@fortawesome/free-regular-svg-icons',
      '@fortawesome/free-brands-svg-icons',
      '@fortawesome/react-fontawesome'
    ],
    esbuildOptions: {
      // Fix specific issues with dependencies
      define: {
        global: 'globalThis'
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    }
  },
  // Custom configuration to ensure public CSS files are properly handled
  publicDir: resolve(__dirname, 'public'),
})
