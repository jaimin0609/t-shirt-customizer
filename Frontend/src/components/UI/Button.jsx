import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * Accessible Button Component
 * 
 * A reusable button component with accessibility features, loading state,
 * and various styling options.
 */
const Button = ({
    children,
    onClick,
    type = 'button',
    variant = 'primary',
    size = 'md',
    className = '',
    disabled = false,
    isLoading = false,
    fullWidth = false,
    icon = null,
    iconPosition = 'left',
    ariaLabel,
    title,
    role = 'button',
    ...props
}) => {
    // Base button styles
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors transition-transform';

    // Variant styles
    const variantStyles = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
        secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-500',
        success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
        danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
        warning: 'bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-500',
        info: 'bg-cyan-500 hover:bg-cyan-600 text-white focus:ring-cyan-500',
        light: 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 focus:ring-gray-500',
        dark: 'bg-gray-800 hover:bg-gray-900 text-white focus:ring-gray-500',
        link: 'bg-transparent hover:underline text-blue-600 hover:text-blue-800 focus:ring-blue-500 p-0'
    };

    // Size styles
    const sizeStyles = {
        xs: 'text-xs px-2.5 py-1.5',
        sm: 'text-sm px-3 py-2',
        md: 'text-sm px-4 py-2',
        lg: 'text-base px-4 py-2',
        xl: 'text-lg px-6 py-3'
    };

    // Combine classes
    const buttonClasses = classNames(
        baseStyles,
        variantStyles[variant],
        variant !== 'link' && sizeStyles[size],
        fullWidth ? 'w-full' : '',
        disabled || isLoading ? 'opacity-70 cursor-not-allowed' : '',
        className
    );

    // Icon rendering
    const renderIcon = () => {
        if (!icon) return null;

        const iconClasses = classNames(
            'inline-block',
            iconPosition === 'left' ? 'mr-2 -ml-1' : 'ml-2 -mr-1',
            size === 'xs' || size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
        );

        return (
            <span className={iconClasses}>
                {icon}
            </span>
        );
    };

    // Loading spinner
    const renderSpinner = () => (
        <svg
            className={`animate-spin ${size === 'xs' || size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-2`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
        </svg>
    );

    // Generate the appropriate aria attributes
    const ariaProps = {};
    if (isLoading) {
        ariaProps['aria-busy'] = true;
    }
    if (ariaLabel) {
        ariaProps['aria-label'] = ariaLabel;
    }
    if (disabled) {
        ariaProps['aria-disabled'] = true;
    }

    return (
        <button
            type={type}
            onClick={onClick}
            className={buttonClasses}
            disabled={disabled || isLoading}
            title={title}
            role={role}
            {...ariaProps}
            {...props}
        >
            {isLoading && renderSpinner()}
            {!isLoading && iconPosition === 'left' && renderIcon()}
            {children}
            {!isLoading && iconPosition === 'right' && renderIcon()}
        </button>
    );
};

Button.propTypes = {
    children: PropTypes.node.isRequired,
    onClick: PropTypes.func,
    type: PropTypes.oneOf(['button', 'submit', 'reset']),
    variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark', 'link']),
    size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
    className: PropTypes.string,
    disabled: PropTypes.bool,
    isLoading: PropTypes.bool,
    fullWidth: PropTypes.bool,
    icon: PropTypes.node,
    iconPosition: PropTypes.oneOf(['left', 'right']),
    ariaLabel: PropTypes.string,
    title: PropTypes.string,
    role: PropTypes.string
};

export default Button; 