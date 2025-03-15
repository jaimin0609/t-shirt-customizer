import React, { Component } from 'react';
import PropTypes from 'prop-types';

/**
 * ErrorBoundary component to catch JavaScript errors anywhere in the child component tree
 * and display a fallback UI instead of crashing the whole app
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorSource: 'component' // Default error source
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        console.error('Error caught in ErrorBoundary.getDerivedStateFromError:', error);

        // Try to classify the error
        let errorSource = 'component';
        if (error && error.toString) {
            const errorString = error.toString();
            if (errorString.includes('createContext') ||
                errorString.includes('useContext')) {
                errorSource = 'context';
            } else if (errorString.includes('useState') ||
                errorString.includes('useEffect') ||
                errorString.includes('useReducer')) {
                errorSource = 'hooks';
            } else if (errorString.includes('Suspense') ||
                errorString.includes('lazy')) {
                errorSource = 'suspense';
            } else if (errorString.includes('null') ||
                errorString.includes('undefined') ||
                errorString.includes('is not a function')) {
                errorSource = 'null-reference';
            }
        }

        return {
            hasError: true,
            error,
            errorSource
        };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error to the console
        console.error('Error caught by ErrorBoundary.componentDidCatch:', error);
        console.error('Component stack:', errorInfo?.componentStack);

        this.setState({ errorInfo });

        // You could also log to an error reporting service here
        // logErrorToService(error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    }

    handleGoHome = () => {
        window.location.href = '/';
    }

    renderErrorDetails() {
        const { error, errorInfo, errorSource } = this.state;

        // Different error types get different helper messages
        let errorDescription = "We're sorry, but an error occurred while rendering this page.";
        let suggestedAction = "Try reloading the page or clearing your browser cache.";

        if (errorSource === 'context') {
            errorDescription = "There was a problem with React context initialization.";
            suggestedAction = "This may be due to an issue with how components are loaded. Try clearing your browser cache and reloading.";
        } else if (errorSource === 'hooks') {
            errorDescription = "There was a problem with React hooks in a component.";
            suggestedAction = "This might be caused by a state management issue.";
        } else if (errorSource === 'suspense') {
            errorDescription = "There was a problem loading a component.";
            suggestedAction = "This might be caused by a network issue. Check your connection and try again.";
        } else if (errorSource === 'null-reference') {
            errorDescription = "A component tried to access a property or method that doesn't exist.";
            suggestedAction = "This might be caused by missing data or a timing issue.";
        }

        return (
            <div className="bg-red-50 p-4 rounded-md mb-4">
                <p className="text-red-700 mb-2">{errorDescription}</p>
                <p className="text-gray-700 mb-4">{suggestedAction}</p>
                <details className="text-left mb-4">
                    <summary className="cursor-pointer text-gray-700 font-medium">Technical Details</summary>
                    <pre className="mt-2 text-sm text-gray-600 overflow-auto p-2 bg-gray-100 rounded">
                        {error && error.toString()}
                    </pre>
                    {errorInfo && (
                        <pre className="mt-2 text-sm text-gray-600 overflow-auto p-2 bg-gray-100 rounded max-h-60">
                            {errorInfo.componentStack}
                        </pre>
                    )}
                </details>
            </div>
        );
    }

    render() {
        const { hasError } = this.state;
        const { fallback, fallbackRender, children } = this.props;

        if (hasError) {
            // If a fallback component is provided, use it
            if (fallback) {
                return fallback;
            }

            // If a custom fallback renderer is provided, use that
            if (fallbackRender) {
                return fallbackRender({
                    error: this.state.error,
                    errorInfo: this.state.errorInfo,
                    errorSource: this.state.errorSource,
                    reset: this.handleReload
                });
            }

            // Otherwise use the default fallback UI
            return (
                <div className="error-boundary-container flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
                    <div className="error-card bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Something went wrong</h2>
                        {this.renderErrorDetails()}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={this.handleReload}
                                className="btn bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Reload Page
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="btn bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                            >
                                Go to Homepage
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        // If no error, render children normally
        return children;
    }
}

ErrorBoundary.propTypes = {
    children: PropTypes.node.isRequired,
    fallback: PropTypes.element, // A React element to show instead
    fallbackRender: PropTypes.func // A render prop function
};

export default ErrorBoundary; 