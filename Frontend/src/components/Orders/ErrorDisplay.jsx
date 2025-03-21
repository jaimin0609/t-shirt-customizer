import React from 'react';

/**
 * Component for displaying error messages
 */
const ErrorDisplay = ({ error, onRetry }) => {
    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center max-w-md">
                <div className="text-red-500 text-5xl mb-4">
                    <span role="img" aria-label="Error">⚠️</span>
                </div>
                <h2 className="text-xl font-semibold mb-2">Error Loading Orders</h2>
                <p className="text-gray-600 mb-6">
                    {typeof error === 'string' ? error : 'There was a problem loading your orders. Please try again.'}
                </p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Try Again
                    </button>
                )}
            </div>
        </div>
    );
};

export default ErrorDisplay; 