import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingPlaceholder from '../UI/LoadingPlaceholder';
import api from '../../services/apiClient';

/**
 * ProtectedRoute component
 * 
 * Secures routes that require authentication by redirecting to login if user is not authenticated
 * Also handles loading state while auth status is being determined
 */
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, user, loading: authLoading, refreshToken } = useAuth();
    const location = useLocation();
    const [isVerifying, setIsVerifying] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const verifyAuthentication = async () => {
            setIsVerifying(true);

            try {
                // If already authenticated, check if token is still valid
                if (isAuthenticated && user) {
                    // Try to refresh token if needed
                    await api.checkAuthentication();
                    setIsAuthorized(true);
                } else {
                    setIsAuthorized(false);
                }
            } catch (error) {
                console.error('Authentication verification failed:', error);
                setIsAuthorized(false);
            } finally {
                setIsVerifying(false);
            }
        };

        verifyAuthentication();
    }, [isAuthenticated, user, refreshToken]);

    // Show loading state while determining authentication
    if (authLoading || isVerifying) {
        return <LoadingPlaceholder type="auth" />;
    }

    // If not authenticated, redirect to login with return path
    if (!isAuthorized) {
        const currentPath = location.pathname + location.search;
        const returnUrl = encodeURIComponent(currentPath);

        return (
            <Navigate
                to={`/login?returnUrl=${returnUrl}`}
                replace
            />
        );
    }

    // User is authenticated, render children
    return children;
};

export default ProtectedRoute; 