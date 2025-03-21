// Simple static config to avoid import issues
const config = {
  plugins: [
    // React plugin (simplified)
    {
      name: 'vite:react',
      config: () => ({
        jsx: {
          runtime: 'automatic'
        }
      }),
      transform(code, id) {
        // Basic pass-through transformer
        return code;
      }
    }
  ],
  
  build: {
    outDir: 'dist',
    minify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            'react',
            'react-dom',
            'react-router-dom'
          ]
        }
      }
    }
  },
  
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  
  server: {
    port: 3000,
    cors: true
  }
};

// Export the config directly
export default config;
