import { useState, useEffect, lazy, Suspense } from 'react';
import React from 'react';

/**
 * Custom hook for lazy loading React components with better error handling and fallbacks
 * 
 * @param {Function} importFn - Dynamic import function for the component
 * @param {Object} options - Configuration options
 * @param {React.ComponentType} options.fallback - Fallback component to show while loading
 * @param {React.ComponentType} options.errorComponent - Component to show on error
 * @param {number} options.retryCount - Number of retry attempts (0 = no retry)
 * @param {number} options.retryDelay - Delay between retries in ms
 * @param {boolean} options.preload - Whether to preload the component immediately
 * @returns {Object} Lazy component and loading state
 */
function useLazyComponent(importFn, options = {}) {
  const {
    fallback = null,
    errorComponent = null,
    retryCount = 1,
    retryDelay = 1000,
    preload = false,
  } = options;

  const [state, setState] = useState({
    loading: true,
    error: null,
    component: null,
    retry: 0,
  });

  // Create a wrapped lazy component with retry logic
  const createLazyComponent = (fn, maxRetries) => {
    return lazy(() => {
      return fn()
        .catch((error) => {
          if (state.retry < maxRetries) {
            setState(prev => ({
              ...prev,
              retry: prev.retry + 1,
            }));
            
            // Try again after delay
            return new Promise(resolve => {
              setTimeout(() => {
                resolve(createLazyComponent(fn, maxRetries)());
              }, retryDelay);
            });
          }
          
          // If out of retries, set error state and return error component module
          setState(prev => ({
            ...prev,
            loading: false,
            error,
          }));

          // Return a dummy module that renders the error component
          return {
            default: (props) => {
              return errorComponent ? 
                React.createElement(errorComponent, { ...props, error }) : 
                React.createElement('div', {
                  className: 'error-boundary p-4 bg-red-50 text-red-700 rounded',
                  role: 'alert',
                  'aria-live': 'assertive',
                  children: [
                    React.createElement('h3', { 
                      className: 'font-semibold', 
                      key: 'title' 
                    }, 'Failed to load component'),
                    React.createElement('p', { 
                      className: 'text-sm', 
                      key: 'message' 
                    }, error.message || 'An error occurred while loading this component')
                  ]
                });
            }
          };
        });
    });
  };

  // Create the lazy component with retry support
  const LazyComponent = createLazyComponent(importFn, retryCount);

  // Preload the component if option is enabled
  useEffect(() => {
    let isMounted = true;

    if (preload) {
      importFn()
        .then(module => {
          if (isMounted) {
            setState({
              loading: false,
              error: null,
              component: module.default,
              retry: 0,
            });
          }
        })
        .catch(error => {
          if (isMounted) {
            setState({
              loading: false,
              error,
              component: null,
              retry: 0,
            });
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [preload, importFn]);

  // Create wrapped component with suspense and fallback
  const WrappedComponent = (props) => {
    const FallbackComponent = fallback || (
      <div className="lazy-loading-placeholder p-4 flex items-center justify-center bg-gray-50 rounded">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2.5"></div>
          <div className="h-2 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );

    return (
      <Suspense fallback={typeof fallback === 'function' ? React.createElement(fallback) : FallbackComponent}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };

  // Expose methods to manually trigger component loading
  const preloadComponent = () => {
    importFn()
      .then(module => {
        setState({
          loading: false,
          error: null,
          component: module.default,
          retry: 0,
        });
      })
      .catch(error => {
        setState({
          loading: false,
          error,
          component: null,
          retry: 0,
        });
      });
  };

  return {
    Component: WrappedComponent,
    preload: preloadComponent,
    isLoading: state.loading,
    error: state.error,
    retry: () => {
      setState({
        loading: true,
        error: null,
        component: null,
        retry: 0,
      });
      preloadComponent();
    }
  };
}

export default useLazyComponent; 