import { useEffect, useCallback } from 'react';
import monitoring from '../services/monitoring';
import monitoringConfig from '../config/monitoringConfig';

/**
 * Custom hook for using the monitoring service in React components
 * Provides methods for tracking performance, errors, and user behavior
 */
const useMonitoring = (componentName) => {
  // Initialize performance monitoring on mount
  useEffect(() => {
    if (monitoringConfig.FEATURES.ENABLE_PERFORMANCE_MONITORING) {
      monitoring.initPerformanceMonitoring();
    }
  }, []);

  // Track component mount
  useEffect(() => {
    if (monitoringConfig.FEATURES.ENABLE_USER_BEHAVIOR_TRACKING) {
      monitoring.trackUserInteraction('mount', 'component', componentName);
    }
  }, [componentName]);

  // Track component unmount
  useEffect(() => {
    return () => {
      if (monitoringConfig.FEATURES.ENABLE_USER_BEHAVIOR_TRACKING) {
        monitoring.trackUserInteraction('unmount', 'component', componentName);
      }
    };
  }, [componentName]);

  /**
   * Track user interaction
   */
  const trackInteraction = useCallback((action, label = null) => {
    if (monitoringConfig.FEATURES.ENABLE_USER_BEHAVIOR_TRACKING) {
      monitoring.trackUserInteraction(action, componentName, label);
    }
  }, [componentName]);

  /**
   * Track performance mark
   */
  const markPerformance = useCallback((name) => {
    if (monitoringConfig.FEATURES.ENABLE_PERFORMANCE_MONITORING) {
      monitoring.markPerformance(name);
    }
  }, []);

  /**
   * Track performance measure
   */
  const measurePerformance = useCallback((name, startMark, endMark) => {
    if (monitoringConfig.FEATURES.ENABLE_PERFORMANCE_MONITORING) {
      return monitoring.measurePerformance(name, startMark, endMark);
    }
    return null;
  }, []);

  /**
   * Track error
   */
  const trackError = useCallback((error, context = {}) => {
    if (monitoringConfig.FEATURES.ENABLE_ERROR_TRACKING) {
      monitoring.trackError(error, {
        component: componentName,
        ...context
      });
    }
  }, [componentName]);

  /**
   * Track page view
   */
  const trackPageView = useCallback((path, title) => {
    if (monitoringConfig.FEATURES.ENABLE_USER_BEHAVIOR_TRACKING) {
      monitoring.trackPageView(path, title);
    }
  }, []);

  return {
    trackInteraction,
    markPerformance,
    measurePerformance,
    trackError,
    trackPageView
  };
};

export default useMonitoring; 