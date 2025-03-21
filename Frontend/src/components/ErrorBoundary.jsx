import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { ERROR_TYPES, reportError } from '../services/errorHandler';
import config from '../config/appConfig';

/**
 * ErrorBoundary component that catches JavaScript errors in its child component tree
 * and displays a fallback UI instead of crashing the entire app
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            componentStack: null
        };
    }

    /**
     * Update state when an error occurs - React lifecycle method
     */
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    /**
     * Log error details when an error is caught - React lifecycle method
     */
    componentDidCatch(error, errorInfo) {
        // Log error to console in development
        if (config.IS_DEV) {
            console.error('Error caught by ErrorBoundary:', error);
            console.error('Component stack:', errorInfo.componentStack);
        }

        // Store component stack in state
        this.setState({
            errorInfo,
            componentStack: errorInfo.componentStack
        });

        // Report error if enabled
        if (config.FEATURES.ENABLE_ERROR_REPORTING) {
            reportError(error, 'boundary', {
                componentStack: errorInfo.componentStack,
                componentName: this.props.name || 'Unknown'
            });
        }
    }

    /**
     * Reload the page - used as recovery action
     */
    handleReload = () => {
        window.location.reload();
    };

    /**
     * Reset the error state - attempt to recover without page reload
     */
    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            componentStack: null
        });

        if (this.props.onReset && typeof this.props.onReset === 'function') {
            this.props.onReset();
        }
    };

    /**
     * Determine user-friendly error message based on error type
     */
    getFriendlyErrorMessage() {
        const { error } = this.state;

        if (!error) {
            return 'An unexpected error occurred.';
        }

        // Check for known error types
        const errorType = error.type ||
            (error.message && error.message.includes('Network')) ? ERROR_TYPES.NETWORK :
            ERROR_TYPES.UI;

        switch (errorType) {
            case ERROR_TYPES.NETWORK:
                return 'We\'re having trouble connecting to our servers. Please check your internet connection.';
            case ERROR_TYPES.AUTH:
                return 'Your session may have expired. Please try signing in again.';
            case ERROR_TYPES.VALIDATION:
                return 'There was a problem with some of the data in this view.';
            default:
                return this.props.fallback || 'Something went wrong. We\'ve been notified and are working on a fix.';
        }
    }

    render() {
        const { hasError, error, componentStack } = this.state;
        const { children, showReset = true, showHome = true } = this.props;

        if (!hasError) {
            return children;
        }

        // Error details to show in development only
        const errorDetails = config.IS_DEV ? (
            <div className="error-details">
                <h3>Error Details (Development Only)</h3>
                <p className="error-message">{error?.toString()}</p>
                {componentStack && (
                    <details>
                        <summary>Component Stack</summary>
                        <pre>{componentStack}</pre>
                    </details>
                )}
            </div>
        ) : null;

        // Primary error message and actions
        return (
            <div className="error-boundary">
                <div className="error-content">
                    <h2>Oops! Something Went Wrong</h2>
                    <p className="error-message">{this.getFriendlyErrorMessage()}</p>

                    <div className="error-actions">
                        <button
                            className="btn btn-primary"
                            onClick={this.handleReload}
                        >
                            Reload Page
                        </button>

                        {showReset && (
                            <button
                                className="btn btn-secondary"
                                onClick={this.handleReset}
                            >
                                Try Again
                            </button>
                        )}

                        {showHome && (
                            <Link
                                to="/"
                                className="btn btn-link"
                            >
                                Go to Homepage
                            </Link>
                        )}
                    </div>

                    {errorDetails}
                </div>
            </div>
        );
    }
}

ErrorBoundary.propTypes = {
    children: PropTypes.node.isRequired,
    fallback: PropTypes.string,
    showReset: PropTypes.bool,
    showHome: PropTypes.bool,
    name: PropTypes.string,
    onReset: PropTypes.func
};

export default ErrorBoundary; 