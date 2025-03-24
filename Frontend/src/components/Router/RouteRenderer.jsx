import React, { Suspense, useEffect } from 'react';
import { Routes, Route, useLocation, matchPath } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { routes, errorComponent, loadingComponent } from '../../routes';
import ProtectedRoute from './ProtectedRoute';

/**
 * RouteRenderer component 
 * 
 * Renders routes with optimized loading, code splitting, and route-based prefetching
 * Uses the centralized route configuration for consistency
 */
const RouteRenderer = () => {
    const { pathname } = useLocation();
    const auth = useAuth();

    // Prefetch related routes when a route is accessed
    useEffect(() => {
        const currentRoute = routes.find(route =>
            matchPath(route.path, pathname)
        );

        if (currentRoute) {
            // Find routes with the same chunk and prefetch them
            const relatedRoutes = routes.filter(route =>
                route.chunk === currentRoute.chunk &&
                route.path !== currentRoute.path &&
                !route.preload // Don't prefetch routes that are already preloaded
            );

            // Queue prefetching of related routes
            if (relatedRoutes.length > 0) {
                const timer = setTimeout(() => {
                    relatedRoutes.forEach(route => {
                        const importFunc = route.component.type?._payload?._result || (() => { });
                        // Check if it's a function before calling it
                        if (typeof importFunc === 'function') {
                            importFunc();
                        }
                    });
                }, 1000); // Wait 1 second after route load to start prefetching

                return () => clearTimeout(timer);
            }
        }
    }, [pathname]);

    return (
        <Suspense fallback={loadingComponent}>
            <Routes>
                {routes.map(route => {
                    const { path, component: Component, exact, auth: authRequirement } = route;

                    // Protected routes (require login)
                    if (authRequirement === 'required') {
                        return (
                            <Route
                                key={path}
                                path={path}
                                exact={exact}
                                element={
                                    <ProtectedRoute>
                                        <ErrorBoundary>
                                            <Component />
                                        </ErrorBoundary>
                                    </ProtectedRoute>
                                }
                            />
                        );
                    }

                    // Public routes
                    return (
                        <Route
                            key={path}
                            path={path}
                            exact={exact}
                            element={
                                <ErrorBoundary>
                                    <Component />
                                </ErrorBoundary>
                            }
                        />
                    );
                })}
            </Routes>
        </Suspense>
    );
};

/**
 * ErrorBoundary component for catching errors in routes
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Route error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return errorComponent({ error: this.state.error });
        }

        return this.props.children;
    }
}

export default RouteRenderer; 