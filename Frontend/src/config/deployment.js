/**
 * Deployment Configuration
 * Central configuration for frontend deployment settings across different environments
 */
import { API_URL } from './api';

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

// Extract base URL from API_URL (remove '/api' suffix)
const getBaseUrl = (apiUrl) => {
  return apiUrl.replace(/\/api$/, '');
};

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
      apiUrl: API_URL,
      assetUrl: getBaseUrl(API_URL),
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
      apiUrl: API_URL,
      assetUrl: getBaseUrl(API_URL),
      features: {
        devTools: false,
        mockApi: true,
        analytics: false
      }
    },
    
    production: {
      apiUrl: API_URL,
      assetUrl: getBaseUrl(API_URL),
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
          destination: `${API_URL}/:path*`
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