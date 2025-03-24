import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * LoadingPlaceholder component
 * 
 * A reusable loading placeholder with different visual styles based on content type
 * Uses TailwindCSS for styling and animation
 */
const LoadingPlaceholder = ({
    type = 'default',
    rows = 3,
    className = '',
    showLoadingText = false,
    loadingText = 'Loading...',
    isFullPage = false,
    hasRoundedCorners = true,
    animate = true,
    aspectRatio = null
}) => {
    // Base styles for all placeholder types
    const containerClasses = classNames(
        'loading-placeholder',
        {
            'animate-pulse': animate,
            'rounded': hasRoundedCorners,
            'min-h-screen flex items-center justify-center': isFullPage
        },
        className
    );

    // Aspect ratio styles for maintaining spacing
    const aspectRatioStyle = aspectRatio ? { aspectRatio } : {};

    // Render different placeholder types
    switch (type) {
        // Product card placeholder
        case 'product':
            return (
                <div className={containerClasses}>
                    <div className="h-64 bg-gray-200 rounded-t w-full"></div>
                    <div className="p-4 space-y-3">
                        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                    </div>
                </div>
            );

        // Form input placeholder  
        case 'form':
            return (
                <div className={containerClasses}>
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-10 bg-gray-200 rounded w-full"></div>
                </div>
            );

        // List item placeholder  
        case 'list':
            return (
                <div className={containerClasses}>
                    {[...Array(rows)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            );

        // Image placeholder  
        case 'image':
            return (
                <div
                    className={containerClasses}
                    style={aspectRatioStyle}
                >
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <svg
                            className="w-12 h-12 text-gray-300"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                    </div>
                </div>
            );

        // Authentication/loading overlay 
        case 'auth':
            return (
                <div className={classNames(
                    'fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50',
                    containerClasses
                )}>
                    <div className="text-center">
                        <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        {showLoadingText && (
                            <p className="text-lg text-gray-700">{loadingText}</p>
                        )}
                    </div>
                </div>
            );

        // Text content placeholder (default)
        default:
            return (
                <div className={containerClasses}>
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-2">
                        {[...Array(rows)].map((_, i) => (
                            <div
                                key={i}
                                className={`h-4 bg-gray-200 rounded w-${i % 3 === 0 ? 'full' : (i % 3 === 1 ? '5/6' : '3/4')}`}
                            ></div>
                        ))}
                    </div>
                    {showLoadingText && (
                        <div className="mt-4 text-sm text-gray-500 text-center">{loadingText}</div>
                    )}
                </div>
            );
    }
};

LoadingPlaceholder.propTypes = {
    type: PropTypes.oneOf(['default', 'product', 'form', 'list', 'image', 'auth']),
    rows: PropTypes.number,
    className: PropTypes.string,
    showLoadingText: PropTypes.bool,
    loadingText: PropTypes.string,
    isFullPage: PropTypes.bool,
    hasRoundedCorners: PropTypes.bool,
    animate: PropTypes.bool,
    aspectRatio: PropTypes.string
};

export default LoadingPlaceholder; 