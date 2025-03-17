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
                skip-to-content
                ${className}
            `}
            data-testid="skip-link"
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