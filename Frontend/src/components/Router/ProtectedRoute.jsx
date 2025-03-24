import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingPlaceholder from '../UI/LoadingPlaceholder';

/**
 * ProtectedRoute component
 * 
 * Secures routes that require authentication by redirecting to login if user is not authenticated
 * Also handles loading state while auth status is being determined
 */
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, user, isLoading } = useAuth();
    const location = useLocation();

    // Show loading state while determining authentication
    if (isLoading) {
        return <LoadingPlaceholder type="auth" />;
    }

    // If not authenticated, redirect to login with return path
    if (!isAuthenticated || !user) {
        return (
            <Navigate
                to="/login"
                state={{ returnTo: location.pathname + location.search }}
                replace
            />
        );
    }

    // User is authenticated, render children
    return children;
};

export default ProtectedRoute; 