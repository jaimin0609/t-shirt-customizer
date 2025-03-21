/**
 * Deployment Configuration
 * Central configuration for deployment settings across different environments
 */

const config = {
  // Common settings
  common: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5002,
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  },

  // Environment-specific settings
  environments: {
    development: {
      assetUrl: 'http://localhost:5002',
      apiUrl: 'http://localhost:5002/api',
      database: {
        ssl: false,
        logging: true
      },
      storageType: process.env.STORAGE_TYPE || 'local'
    },
    
    test: {
      assetUrl: 'http://localhost:5002',
      apiUrl: 'http://localhost:5002/api',
      database: {
        ssl: false,
        logging: false
      },
      storageType: 'local'
    },
    
    production: {
      assetUrl: process.env.ASSET_URL || 'https://t-shirt-customizer-backend.onrender.com',
      apiUrl: process.env.API_URL || 'https://t-shirt-customizer-backend.onrender.com/api',
      database: {
        ssl: {
          require: true,
          rejectUnauthorized: process.env.DB_REJECT_UNAUTHORIZED !== 'false'
        },
        logging: false
      },
      storageType: process.env.STORAGE_TYPE || 'cloudinary'
    }
  },

  // Deployment platforms configurations
  platforms: {
    render: {
      buildCommand: './scripts/deployment/render-build.sh',
      startCommand: 'node server.js',
      healthCheckPath: '/api/health',
      buildWithMigration: './scripts/deployment/render-build-with-migration.sh'
    },
    
    heroku: {
      buildCommand: 'npm install && npm run build',
      startCommand: 'node server.js',
      setupPostgres: true
    },
    
    railway: {
      buildCommand: 'npm install && npm run build',
      startCommand: 'node server.js',
      healthCheckPath: '/api/health'
    }
  },

  // Build configuration
  build: {
    installCommands: {
      standard: 'npm install --no-audit --no-fund --legacy-peer-deps',
      sharp: 'npm install --unsafe-perm --build-from-source --foreground-scripts sharp'
    },
    migrations: {
      runAutomatically: true,
      safeMode: true,
      script: 'node manual-migration.cjs'
    }
  }
};

/**
 * Get the current environment configuration
 * @returns {Object} The environment-specific configuration
 */
export const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return {
    ...config.common,
    ...config.environments[env] || config.environments.development
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