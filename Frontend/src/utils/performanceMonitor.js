import config from '../config/appConfig';

/**
 * A utility module for measuring and tracking performance metrics in the application.
 * Includes functions for timing operations, reporting metrics, and logging performance data.
 */

/**
 * Store for collected performance metrics
 */
const metrics = {
  componentRenderTimes: {},
  apiCallTimes: {},
  resourceLoadTimes: {},
  interactionTimes: {},
  marks: {}
};

/**
 * Start timing an operation
 * 
 * @param {string} operation - The name of the operation being timed
 * @param {string} category - The category of the operation (component, api, resource, interaction)
 * @returns {Function} A function to call when the operation is complete
 */
export const startTiming = (operation, category = 'misc') => {
  const start = performance.now();
  
  return (metadata = {}) => {
    const end = performance.now();
    const duration = end - start;
    
    recordMetric(operation, duration, category, metadata);
    return duration;
  };
};

/**
 * Record a performance metric
 * 
 * @param {string} name - The name of the metric
 * @param {number} duration - The duration in milliseconds
 * @param {string} category - The category of the metric
 * @param {Object} metadata - Additional data to record with the metric
 */
export const recordMetric = (name, duration, category = 'misc', metadata = {}) => {
  if (!name || typeof duration !== 'number') {
    return;
  }
  
  // Store metric in appropriate category
  if (!metrics[category]) {
    metrics[category] = {};
  }
  
  if (!metrics[category][name]) {
    metrics[category][name] = [];
  }
  
  metrics[category][name].push({
    value: duration,
    timestamp: Date.now(),
    ...metadata
  });
  
  // Log in development mode
  if (config.IS_DEV) {
    console.debug(`[Performance] ${category}:${name} - ${duration.toFixed(2)}ms`, metadata);
  }
  
  // Report to monitoring service if enabled
  if (config.FEATURES.ENABLE_PERFORMANCE_MONITORING && window.performanceReporter) {
    try {
      window.performanceReporter.report({
        metric: name,
        value: duration,
        category,
        metadata
      });
    } catch (err) {
      console.error('Error reporting performance metric:', err);
    }
  }
};

/**
 * Add a performance mark for a key moment in the application
 * 
 * @param {string} name - Name of the mark
 * @param {Object} data - Additional data to associate with the mark
 */
export const mark = (name, data = {}) => {
  if (!name) return;
  
  // Use the Performance API if available
  if (window.performance && window.performance.mark) {
    window.performance.mark(name);
  }
  
  // Store the mark
  metrics.marks[name] = {
    timestamp: Date.now(),
    data
  };
  
  // Log in development
  if (config.IS_DEV) {
    console.debug(`[Performance Mark] ${name}`, data);
  }
};

/**
 * Measure time between two marks
 * 
 * @param {string} name - Name for the measurement
 * @param {string} startMark - Name of the starting mark
 * @param {string} endMark - Name of the ending mark
 * @returns {number|null} The duration between marks in ms, or null if marks not found
 */
export const measure = (name, startMark, endMark) => {
  // Use the Performance API if available
  if (window.performance && window.performance.measure) {
    try {
      window.performance.measure(name, startMark, endMark);
      const entry = window.performance.getEntriesByName(name).pop();
      return entry ? entry.duration : null;
    } catch (e) {
      console.error('Error measuring performance:', e);
    }
  }
  
  // Fallback to our stored marks
  if (metrics.marks[startMark] && metrics.marks[endMark]) {
    const duration = metrics.marks[endMark].timestamp - metrics.marks[startMark].timestamp;
    recordMetric(name, duration, 'measures');
    return duration;
  }
  
  return null;
};

/**
 * Get all collected metrics
 * 
 * @returns {Object} All collected metrics
 */
export const getMetrics = () => {
  return { ...metrics };
};

/**
 * Clear all collected metrics
 */
export const clearMetrics = () => {
  Object.keys(metrics).forEach(key => {
    metrics[key] = {};
  });
};

/**
 * React hook for measuring component render times
 * 
 * @param {string} componentName - Name of the component
 * @returns {Object} Performance tracking functions
 */
export const useComponentPerformance = (componentName) => {
  if (!componentName) {
    console.warn('Component name is required for performance tracking');
    return { 
      trackRender: () => {}, 
      trackOperation: () => () => {} 
    };
  }
  
  return {
    /**
     * Track component render time (call at start of component body)
     */
    trackRender: () => {
      const endTiming = startTiming(`${componentName}.render`, 'componentRenderTimes');
      
      // Schedule the timing to end after render completes
      setTimeout(() => {
        endTiming();
      }, 0);
    },
    
    /**
     * Track a specific operation within the component
     * 
     * @param {string} operationName - Name of the operation
     * @returns {Function} Function to call when operation completes
     */
    trackOperation: (operationName) => {
      return startTiming(`${componentName}.${operationName}`, 'componentOperations');
    }
  };
};

export default {
  startTiming,
  recordMetric,
  mark,
  measure,
  getMetrics,
  clearMetrics,
  useComponentPerformance
}; 