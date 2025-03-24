/**
 * Monitoring configuration
 */

const monitoringConfig = {
  // Feature flags
  FEATURES: {
    ENABLE_ANALYTICS: process.env.VITE_ENABLE_ANALYTICS === 'true',
    ENABLE_ERROR_TRACKING: process.env.VITE_ENABLE_ERROR_TRACKING === 'true',
    ENABLE_PERFORMANCE_MONITORING: process.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true',
    ENABLE_USER_BEHAVIOR_TRACKING: process.env.VITE_ENABLE_USER_BEHAVIOR_TRACKING === 'true'
  },

  // Analytics service configuration
  ANALYTICS: {
    PROVIDER: process.env.VITE_ANALYTICS_PROVIDER || 'google', // 'google', 'mixpanel', etc.
    TRACKING_ID: process.env.VITE_ANALYTICS_TRACKING_ID,
    SAMPLE_RATE: parseFloat(process.env.VITE_ANALYTICS_SAMPLE_RATE) || 1.0,
    DEBUG: process.env.VITE_ANALYTICS_DEBUG === 'true'
  },

  // Error tracking service configuration
  ERROR_TRACKING: {
    PROVIDER: process.env.VITE_ERROR_TRACKING_PROVIDER || 'sentry', // 'sentry', 'logrocket', etc.
    DSN: process.env.VITE_ERROR_TRACKING_DSN,
    ENVIRONMENT: process.env.VITE_ERROR_TRACKING_ENVIRONMENT || process.env.NODE_ENV,
    SAMPLE_RATE: parseFloat(process.env.VITE_ERROR_TRACKING_SAMPLE_RATE) || 1.0,
    MAX_ERRORS: parseInt(process.env.VITE_ERROR_TRACKING_MAX_ERRORS) || 100
  },

  // Performance monitoring configuration
  PERFORMANCE: {
    ENABLE_RESOURCE_TIMING: process.env.VITE_PERFORMANCE_ENABLE_RESOURCE_TIMING === 'true',
    ENABLE_NAVIGATION_TIMING: process.env.VITE_PERFORMANCE_ENABLE_NAVIGATION_TIMING === 'true',
    ENABLE_USER_TIMING: process.env.VITE_PERFORMANCE_ENABLE_USER_TIMING === 'true',
    SAMPLE_RATE: parseFloat(process.env.VITE_PERFORMANCE_SAMPLE_RATE) || 1.0,
    MAX_ENTRIES: parseInt(process.env.VITE_PERFORMANCE_MAX_ENTRIES) || 1000
  },

  // User behavior tracking configuration
  USER_BEHAVIOR: {
    ENABLE_PAGE_VIEWS: process.env.VITE_USER_BEHAVIOR_ENABLE_PAGE_VIEWS === 'true',
    ENABLE_INTERACTIONS: process.env.VITE_USER_BEHAVIOR_ENABLE_INTERACTIONS === 'true',
    ENABLE_SESSION_TRACKING: process.env.VITE_USER_BEHAVIOR_ENABLE_SESSION_TRACKING === 'true',
    SAMPLE_RATE: parseFloat(process.env.VITE_USER_BEHAVIOR_SAMPLE_RATE) || 1.0,
    MAX_INTERACTIONS: parseInt(process.env.VITE_USER_BEHAVIOR_MAX_INTERACTIONS) || 1000
  },

  // Development mode settings
  DEVELOPMENT: {
    LOG_ANALYTICS: process.env.VITE_DEV_LOG_ANALYTICS === 'true',
    LOG_ERRORS: process.env.VITE_DEV_LOG_ERRORS === 'true',
    LOG_PERFORMANCE: process.env.VITE_DEV_LOG_PERFORMANCE === 'true',
    LOG_USER_BEHAVIOR: process.env.VITE_DEV_LOG_USER_BEHAVIOR === 'true'
  }
};

export default monitoringConfig; 