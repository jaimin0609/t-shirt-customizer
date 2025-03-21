/**
 * Deployment Configuration
 * Central configuration for frontend deployment settings across different environments
 */

// Handle running outside of Vite context (direct Node.js execution)
const getEnv = () => {
  try {
    return import.meta.env || {};
  } catch (e) {
    return { MODE: process.env.NODE_ENV || 'development' };
  }
};

// Get environment variables safely
const env = getEnv();

const config = {
  // Common settings
  common: {
    nodeEnv: env.MODE || 'development',
    appName: 'T-Shirt Customizer',
    buildPath: 'dist',
  },

  // Environment-specific settings
  environments: {
    development: {
      apiUrl: env.VITE_API_URL || 'http://localhost:5002/api',
      assetUrl: env.VITE_ASSET_URL || 'http://localhost:5002',
      devServer: {
        port: 5173,
        host: 'localhost',
        https: false
      },
      features: {
        devTools: true,
        mockApi: false,
        analytics: false
      }
    },
    
    test: {
      apiUrl: env.VITE_API_URL || 'http://localhost:5002/api',
      assetUrl: env.VITE_ASSET_URL || 'http://localhost:5002',
      features: {
        devTools: false,
        mockApi: true,
        analytics: false
      }
    },
    
    production: {
      apiUrl: env.VITE_API_URL || 'https://t-shirt-customizer-backend.onrender.com/api',
      assetUrl: env.VITE_ASSET_URL || 'https://t-shirt-customizer-backend.onrender.com',
      features: {
        devTools: false,
        mockApi: false,
        analytics: true
      }
    }
  },

  // Deployment platforms configurations
  platforms: {
    vercel: {
      buildCommand: './scripts/deployment/frontend-vercel-build.sh',
      outputDirectory: 'dist',
      rewrites: [
        {
          source: '/api/:path*',
          destination: 'https://t-shirt-customizer-backend.onrender.com/api/:path*'
        }
      ],
      redirects: [],
      spa: true
    },
    
    github: {
      buildCommand: './scripts/deployment/frontend-github-pages-build.sh',
      baseHref: '/t-shirt-customizer/',
      cname: '',
      spa: true
    }
  },

  // Build configuration
  build: {
    optimization: {
      minify: true,
      splitChunks: true,
      treeshaking: true,
      cssExtraction: true,
      imageOptimization: true
    },
    includeDependencies: [
      'react',
      'react-dom',
      'react-router-dom',
      'tailwindcss'
    ],
    spa: {
      generateFallbacks: true
    }
  }
};

/**
 * Get the current environment configuration
 * @returns {Object} The environment-specific configuration
 */
export const getEnvironmentConfig = () => {
  const currentEnv = env.MODE || 'development';
  return {
    ...config.common,
    ...config.environments[currentEnv] || config.environments.development
  };
};

/**
 * Get the platform-specific configuration
 * @param {string} platform - The deployment platform name
 * @returns {Object} The platform-specific configuration
 */
export const getPlatformConfig = (platform) => {
  return config.platforms[platform] || {};
};

/**
 * Get the build configuration
 * @returns {Object} The build configuration
 */
export const getBuildConfig = () => {
  return config.build;
};

export default {
  getEnvironmentConfig,
  getPlatformConfig, 
  getBuildConfig
}; 