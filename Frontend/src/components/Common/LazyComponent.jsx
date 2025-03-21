import React, { Suspense, lazy } from 'react';
import PropTypes from 'prop-types';
import { ErrorBoundary } from '../errors';
import { useNotification } from '../../contexts/NotificationContext';
import { mark } from '../../utils/performanceMonitor';

/**
 * Default loading component shown while the lazy component is loading
 */
const DefaultLoadingComponent = () => (
    <div className="lazy-loading">
        <div className="loader"></div>
    </div>
);

/**
 * Default error component shown if the lazy component fails to load
 */
const DefaultErrorComponent = () => (
    <div className="lazy-error">
        <p>Failed to load component</p>
    </div>
);

/**
 * A wrapper for React.lazy that provides consistent error handling and loading states
 * 
 * @param {Function} importFn - Dynamic import function that returns a Promise
 * @param {Object} options - Configuration options
 * @param {string} options.name - Component name for error tracking
 * @param {React.Component} options.LoadingComponent - Custom loading component
 * @param {React.Component} options.ErrorComponent - Custom error component
 * @param {Object} options.suspenseProps - Props to pass to Suspense component
 * @param {Object} options.errorBoundaryProps - Props to pass to ErrorBoundary
 * @returns {React.Component} Wrapped lazy-loaded component
 */
export const createLazyComponent = (
    importFn,
    {
        name = 'LazyComponent',
        LoadingComponent = DefaultLoadingComponent,
        ErrorComponent = DefaultErrorComponent,
        suspenseProps = {},
        errorBoundaryProps = {}
    } = {}
) => {
    if (typeof importFn !== 'function') {
        console.error('createLazyComponent requires an import function');
        return ErrorComponent;
    }

    // Create a wrapped lazy component that marks performance
    const LazyComponentWithMarker = (props) => {
        mark(`lazy-load-start:${name}`);

        // Create the lazy component
        const Component = lazy(() =>
            importFn()
                .then(module => {
                    mark(`lazy-load-end:${name}`);
                    return module;
                })
                .catch(err => {
                    console.error(`Failed to load lazy component ${name}:`, err);
                    throw err;
                })
        );

        return <Component {...props} />;
    };

    // Return a wrapper component that handles loading and errors
    const WrappedLazyComponent = (props) => {
        const { showError } = useNotification();

        const handleError = (error) => {
            showError(`Failed to load ${name} component`, {
                duration: 5000
            });
            console.error(`Error loading ${name}:`, error);
        };

        return (
            <ErrorBoundary
                fallback={`Problem loading "${name}"`}
                onError={handleError}
                {...errorBoundaryProps}
            >
                <Suspense fallback={<LoadingComponent />} {...suspenseProps}>
                    <LazyComponentWithMarker {...props} />
                </Suspense>
            </ErrorBoundary>
        );
    };

    WrappedLazyComponent.displayName = `Lazy(${name})`;
    return WrappedLazyComponent;
};

/**
 * LazyComponent is a wrapper around a dynamic import that provides
 * consistent error handling and loading states.
 * 
 * @example
 * <LazyComponent
 *   importFn={() => import('./ExpensiveComponent')}
 *   name="ExpensiveComponent" 
 * />
 */
const LazyComponent = ({
    importFn,
    name,
    LoadingComponent,
    ErrorComponent,
    suspenseProps,
    errorBoundaryProps,
    ...props
}) => {
    const Component = React.useMemo(
        () => createLazyComponent(importFn, {
            name,
            LoadingComponent,
            ErrorComponent,
            suspenseProps,
            errorBoundaryProps
        }),
        [importFn, name, LoadingComponent, ErrorComponent, suspenseProps, errorBoundaryProps]
    );

    return <Component {...props} />;
};

LazyComponent.propTypes = {
    importFn: PropTypes.func.isRequired,
    name: PropTypes.string.isRequired,
    LoadingComponent: PropTypes.elementType,
    ErrorComponent: PropTypes.elementType,
    suspenseProps: PropTypes.object,
    errorBoundaryProps: PropTypes.object
};

export default LazyComponent; 