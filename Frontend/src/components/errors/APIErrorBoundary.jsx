import React from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '../ErrorBoundary';
import { ERROR_TYPES } from '../../services/errorHandler';
import { useNotification } from '../../contexts/NotificationContext';

/**
 * APIErrorBoundary is a specialized error boundary for handling API-related errors
 * It wraps the generic ErrorBoundary with API-specific behavior
 */
const APIErrorBoundary = ({ children, showReloadButton = true, showHomeButton = true, fallbackMessage }) => {
    const { showWarning } = useNotification();

    // Custom reset handler that shows a notification
    const handleReset = () => {
        showWarning('Retrying the operation. Please wait...', {
            duration: 3000
        });
    };

    return (
        <ErrorBoundary
            fallback={fallbackMessage || "We couldn't connect to our servers. Please check your connection and try again."}
            showReset={true}
            showHome={showHomeButton}
            name="APIErrorBoundary"
            onReset={handleReset}
        >
            {children}
        </ErrorBoundary>
    );
};

APIErrorBoundary.propTypes = {
    children: PropTypes.node.isRequired,
    fallbackMessage: PropTypes.string,
    showReloadButton: PropTypes.bool,
    showHomeButton: PropTypes.bool
};

export default APIErrorBoundary; 