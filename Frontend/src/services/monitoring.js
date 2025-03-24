import config from '../config/appConfig';

/**
 * Monitoring service for tracking performance, errors, and user behavior
 */

// Performance monitoring
const performanceMetrics = {
  marks: new Map(),
  measures: new Map(),
  resourceTimings: new Map()
};

// Error tracking
const errorTracking = {
  errors: new Map(),
  maxErrors: 100
};

// User behavior tracking
const userBehavior = {
  pageViews: new Map(),
  interactions: new Map(),
  sessionStart: Date.now()
};

/**
 * Initialize performance monitoring
 */
export const initPerformanceMonitoring = () => {
  if (typeof window !== 'undefined' && window.performance) {
    // Observe resource timing
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
          trackApiPerformance(entry);
        } else if (entry.initiatorType === 'img') {
          trackImagePerformance(entry);
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
  }
};

/**
 * Track API performance
 */
const trackApiPerformance = (entry) => {
  const { name, duration, startTime } = entry;
  const endpoint = new URL(name).pathname;
  
  if (!performanceMetrics.resourceTimings.has(endpoint)) {
    performanceMetrics.resourceTimings.set(endpoint, []);
  }
  
  performanceMetrics.resourceTimings.get(endpoint).push({
    duration,
    startTime,
    timestamp: Date.now()
  });
};

/**
 * Track image performance
 */
const trackImagePerformance = (entry) => {
  const { name, duration, startTime } = entry;
  
  if (!performanceMetrics.resourceTimings.has('images')) {
    performanceMetrics.resourceTimings.set('images', []);
  }
  
  performanceMetrics.resourceTimings.get('images').push({
    name,
    duration,
    startTime,
    timestamp: Date.now()
  });
};

/**
 * Mark a performance point
 */
export const markPerformance = (name) => {
  if (typeof window !== 'undefined' && window.performance) {
    window.performance.mark(name);
    performanceMetrics.marks.set(name, Date.now());
  }
};

/**
 * Measure performance between two marks
 */
export const measurePerformance = (name, startMark, endMark) => {
  if (typeof window !== 'undefined' && window.performance) {
    try {
      window.performance.measure(name, startMark, endMark);
      const measure = window.performance.getEntriesByName(name).pop();
      performanceMetrics.measures.set(name, measure);
      return measure;
    } catch (error) {
      console.error('Error measuring performance:', error);
      return null;
    }
  }
};

/**
 * Track user interaction
 */
export const trackUserInteraction = (action, category, label = null) => {
  const interaction = {
    action,
    category,
    label,
    timestamp: Date.now()
  };

  if (!userBehavior.interactions.has(category)) {
    userBehavior.interactions.set(category, []);
  }

  userBehavior.interactions.get(category).push(interaction);

  // Send to analytics service if configured
  if (config.FEATURES.ENABLE_ANALYTICS) {
    sendToAnalytics(interaction);
  }
};

/**
 * Track page view
 */
export const trackPageView = (path, title) => {
  const pageView = {
    path,
    title,
    timestamp: Date.now()
  };

  userBehavior.pageViews.set(path, pageView);

  // Send to analytics service if configured
  if (config.FEATURES.ENABLE_ANALYTICS) {
    sendToAnalytics(pageView);
  }
};

/**
 * Track error
 */
export const trackError = (error, context = {}) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    type: error.name,
    context,
    timestamp: Date.now()
  };

  // Store error
  if (errorTracking.errors.size >= errorTracking.maxErrors) {
    const oldestKey = errorTracking.errors.keys().next().value;
    errorTracking.errors.delete(oldestKey);
  }
  errorTracking.errors.set(Date.now(), errorData);

  // Send to error tracking service if configured
  if (config.FEATURES.ENABLE_ERROR_TRACKING) {
    sendToErrorTracking(errorData);
  }
};

/**
 * Get performance metrics
 */
export const getPerformanceMetrics = () => {
  return {
    marks: Array.from(performanceMetrics.marks.entries()),
    measures: Array.from(performanceMetrics.measures.entries()),
    resourceTimings: Array.from(performanceMetrics.resourceTimings.entries())
  };
};

/**
 * Get error tracking data
 */
export const getErrorTrackingData = () => {
  return Array.from(errorTracking.errors.values());
};

/**
 * Get user behavior data
 */
export const getUserBehaviorData = () => {
  return {
    pageViews: Array.from(userBehavior.pageViews.values()),
    interactions: Array.from(userBehavior.interactions.entries()),
    sessionDuration: Date.now() - userBehavior.sessionStart
  };
};

/**
 * Send data to analytics service
 */
const sendToAnalytics = (data) => {
  // Implement analytics service integration here
  // Example: Google Analytics, Mixpanel, etc.
  if (config.IS_DEV) {
    console.log('Analytics data:', data);
  }
};

/**
 * Send data to error tracking service
 */
const sendToErrorTracking = (data) => {
  // Implement error tracking service integration here
  // Example: Sentry, LogRocket, etc.
  if (config.IS_DEV) {
    console.log('Error tracking data:', data);
  }
};

export default {
  initPerformanceMonitoring,
  markPerformance,
  measurePerformance,
  trackUserInteraction,
  trackPageView,
  trackError,
  getPerformanceMetrics,
  getErrorTrackingData,
  getUserBehaviorData
}; 