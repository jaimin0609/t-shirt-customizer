/**
 * App Configuration Module
 * 
 * A centralized place for all application configuration with environment variable handling,
 * validation, and fallbacks to ensure consistent configuration across the application.
 */
import { API_URL } from './api';

// Environment detection
export const ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test'
};

// Current environment
export const CURRENT_ENV = import.meta.env.VITE_ENVIRONMENT || 
                         import.meta.env.MODE || 
                         ENV.DEVELOPMENT;

export const IS_DEVELOPMENT = CURRENT_ENV === ENV.DEVELOPMENT;
export const IS_PRODUCTION = CURRENT_ENV === ENV.PRODUCTION;
export const IS_TEST = CURRENT_ENV === ENV.TEST;

// Show warnings for missing or invalid configurations
const warnMissingConfig = (key, fallback) => {
  if (IS_DEVELOPMENT) {
    console.warn(`Missing configuration for ${key}, using fallback: ${fallback}`);
  }
};

// Validate a configuration value
const validateConfig = (key, value, validator, fallback) => {
  if (validator(value)) {
    return value;
  }
  
  warnMissingConfig(key, fallback);
  return fallback;
};

// URL validation helper
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

// API Configuration
export const API_CONFIG = {
  BASE_URL: API_URL,
  
  TIMEOUT: validateConfig(
    'VITE_API_TIMEOUT',
    parseInt(import.meta.env.VITE_API_TIMEOUT),
    (timeout) => !isNaN(timeout) && timeout > 0,
    30000
  ),
  
  RETRY_COUNT: validateConfig(
    'VITE_API_RETRY_COUNT',
    parseInt(import.meta.env.VITE_API_RETRY_COUNT),
    (count) => !isNaN(count) && count >= 0,
    2
  )
};

// Cloudinary Configuration
export const CLOUDINARY_CONFIG = {
  CLOUD_NAME: validateConfig(
    'VITE_CLOUDINARY_CLOUD_NAME',
    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
    (name) => typeof name === 'string' && name.length > 0,
    'demo'
  ),
  
  API_KEY: validateConfig(
    'VITE_CLOUDINARY_API_KEY',
    import.meta.env.VITE_CLOUDINARY_API_KEY,
    (key) => typeof key === 'string' && key.length > 0,
    ''
  ),
  
  UPLOAD_PRESET: validateConfig(
    'VITE_CLOUDINARY_UPLOAD_PRESET',
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
    (preset) => typeof preset === 'string' && preset.length > 0,
    'ml_default'
  ),
  
  URL_PREFIX: validateConfig(
    'VITE_CLOUDINARY_URL_PREFIX',
    import.meta.env.VITE_CLOUDINARY_URL_PREFIX,
    (url) => isValidUrl(url),
    `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo'}`
  ),
  
  // Helper function to construct Cloudinary URLs
  getImageUrl: (publicId, options = {}) => {
    if (!publicId) return null;
    
    const { width, height, crop = 'fill', quality = 'auto' } = options;
    
    // If it's already a full URL, return it
    if (publicId.startsWith('http')) {
      return publicId;
    }
    
    // If it's a relative path with product- prefix, extract the filename
    if (publicId.includes('/product-') || publicId.includes('/images-')) {
      const parts = publicId.split('/');
      publicId = parts[parts.length - 1];
    }
    
    // Build transformation string
    let transformation = `f_auto,q_${quality}`;
    if (width) transformation += `,w_${width}`;
    if (height) transformation += `,h_${height}`;
    if (crop) transformation += `,c_${crop}`;
    
    return `${CLOUDINARY_CONFIG.URL_PREFIX}/image/upload/${transformation}/${publicId}`;
  }
};

// Authentication Configuration
export const AUTH_CONFIG = {
  TOKEN_KEY: 'token',
  USER_KEY: 'user',
  REFRESH_INTERVAL: validateConfig(
    'VITE_AUTH_REFRESH_INTERVAL',
    parseInt(import.meta.env.VITE_AUTH_REFRESH_INTERVAL),
    (interval) => !isNaN(interval) && interval > 0,
    20 * 60 * 1000 // 20 minutes
  ),
  INACTIVITY_TIMEOUT: validateConfig(
    'VITE_AUTH_INACTIVITY_TIMEOUT',
    parseInt(import.meta.env.VITE_AUTH_INACTIVITY_TIMEOUT),
    (timeout) => !isNaN(timeout) && timeout > 0,
    60 * 60 * 1000 // 1 hour
  )
};

// Feature Flags
export const FEATURES = {
  ENABLE_ANALYTICS: validateConfig(
    'VITE_ENABLE_ANALYTICS',
    import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    (value) => typeof value === 'boolean',
    IS_PRODUCTION
  ),
  
  ENABLE_ERROR_REPORTING: validateConfig(
    'VITE_ENABLE_ERROR_REPORTING',
    import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true', 
    (value) => typeof value === 'boolean',
    IS_PRODUCTION
  ),
  
  ENABLE_AI_ASSISTANT: validateConfig(
    'VITE_ENABLE_AI_ASSISTANT',
    import.meta.env.VITE_ENABLE_AI_ASSISTANT === 'true',
    (value) => typeof value === 'boolean',
    true
  )
};

// UI Configuration
export const UI_CONFIG = {
  ANIMATION_SPEED: validateConfig(
    'VITE_ANIMATION_SPEED',
    parseInt(import.meta.env.VITE_ANIMATION_SPEED),
    (speed) => !isNaN(speed) && speed >= 0,
    300 // milliseconds
  ),
  
  TOAST_DURATION: validateConfig(
    'VITE_TOAST_DURATION',
    parseInt(import.meta.env.VITE_TOAST_DURATION),
    (duration) => !isNaN(duration) && duration > 0,
    5000 // milliseconds
  ),
  
  DEFAULT_PAGE_SIZE: validateConfig(
    'VITE_DEFAULT_PAGE_SIZE',
    parseInt(import.meta.env.VITE_DEFAULT_PAGE_SIZE),
    (size) => !isNaN(size) && size > 0,
    10
  )
};

// Combine all configuration into a single export
const appConfig = {
  ENV,
  CURRENT_ENV,
  IS_DEVELOPMENT,
  IS_PRODUCTION,
  IS_TEST,
  API: API_CONFIG,
  CLOUDINARY: CLOUDINARY_CONFIG,
  AUTH: AUTH_CONFIG,
  FEATURES,
  UI: UI_CONFIG
};

// Validate the entire configuration
export const validateConfiguration = () => {
  if (IS_DEVELOPMENT) {
    console.log('Application configuration:', appConfig);
    
    // Check for critical missing configuration
    if (!appConfig.API.BASE_URL) {
      console.error('Critical configuration missing: API_URL');
    }
    
    if (!appConfig.CLOUDINARY.CLOUD_NAME || appConfig.CLOUDINARY.CLOUD_NAME === 'demo') {
      console.warn('Using demo Cloudinary configuration - uploads may not work correctly');
    }
  }
  
  return appConfig;
};

// Export the complete validated configuration
export default validateConfiguration(); 