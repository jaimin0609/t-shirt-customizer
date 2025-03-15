import { Component } from 'react';
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
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error to an error reporting service
        console.error('Error caught by ErrorBoundary:', error, errorInfo);
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

    render() {
        if (this.state.hasError) {
            // Render fallback UI
            return (
                <div className="error-boundary-container flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
                    <div className="error-card bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Something went wrong</h2>
                        <div className="bg-red-50 p-4 rounded-md mb-4">
                            <p className="text-red-700 mb-2">We're sorry, but an error occurred while rendering this page.</p>
                            <details className="text-left mb-4">
                                <summary className="cursor-pointer text-gray-700 font-medium">Technical Details</summary>
                                <pre className="mt-2 text-sm text-gray-600 overflow-auto p-2 bg-gray-100 rounded">
                                    {this.state.error && this.state.error.toString()}
                                </pre>
                            </details>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={this.handleReload}
                                className="btn bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
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
        return this.props.children;
    }
}

ErrorBoundary.propTypes = {
    children: PropTypes.node.isRequired
};

export default ErrorBoundary; 