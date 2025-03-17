import React from 'react';
import PropTypes from 'prop-types';

/**
 * SkipLink component for keyboard accessibility
 * Provides a way for keyboard users to skip navigation and go directly to main content
 * 
 * @param {Object} props - Component props
 * @param {string} props.targetId - ID of the element to skip to
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
const SkipLink = ({
    targetId = 'main-content',
    className = '',
    children = 'Skip to main content'
}) => {
    return (
        <a
            href={`#${targetId}`}
            className={`
        absolute top-0 left-0 -translate-y-full p-2 bg-primary-500 text-white
        z-50 focus:translate-y-0 transition-transform duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
        ${className}
      `}
        >
            {children}
        </a>
    );
};

SkipLink.propTypes = {
    targetId: PropTypes.string,
    className: PropTypes.string,
    children: PropTypes.node
};

export default SkipLink; 