import React from 'react';
import PropTypes from 'prop-types';

/**
 * Loading spinner component with accessibility support
 * 
 * @param {Object} props - Component props
 * @param {string} props.size - Size of the spinner (xs, sm, md, lg)
 * @param {string} props.color - Color of the spinner (inherit from parent by default)
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.label - Accessible label for screen readers (defaults to "Loading...")
 * @returns {JSX.Element}
 */
const LoadingSpinner = ({
    size = 'md',
    color = 'currentColor',
    className = '',
    label = 'Loading...',
}) => {
    // Map size to dimensions
    const sizeMap = {
        xs: 'h-4 w-4',
        sm: 'h-5 w-5',
        md: 'h-8 w-8',
        lg: 'h-12 w-12',
    };

    const sizeClass = sizeMap[size] || sizeMap.md;

    return (
        <div
            className={`inline-flex items-center justify-center ${className}`}
            role="status"
            aria-live="polite"
        >
            <svg
                className={`animate-spin ${sizeClass} text-${color}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                />
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
            </svg>
            {/* Hidden text for screen readers */}
            <span className="sr-only">{label}</span>
        </div>
    );
};

LoadingSpinner.propTypes = {
    size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg']),
    color: PropTypes.string,
    className: PropTypes.string,
    label: PropTypes.string,
};

export default LoadingSpinner; 