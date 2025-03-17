import React from 'react';
import PropTypes from 'prop-types';

/**
 * Button component with consistent styling and accessibility features
 * 
 * @param {Object} props - Component props
 * @param {string} props.variant - Button variant (primary, secondary, outline, text)
 * @param {string} props.size - Button size (sm, md, lg)
 * @param {boolean} props.fullWidth - Whether button should take full width
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {boolean} props.isLoading - Whether button is in loading state
 * @param {React.ReactNode} props.leftIcon - Icon to display on the left
 * @param {React.ReactNode} props.rightIcon - Icon to display on the right
 * @param {string} props.type - Button type (button, submit, reset)
 * @param {Function} props.onClick - Click handler
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Button content
 * @returns {JSX.Element}
 */
const Button = ({
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    disabled = false,
    isLoading = false,
    leftIcon = null,
    rightIcon = null,
    type = 'button',
    onClick,
    className = '',
    children,
    ...rest
}) => {
    // Base classes that apply to all buttons
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500 disabled:opacity-50 disabled:pointer-events-none rounded-md';

    // Size-specific classes
    const sizeClasses = {
        sm: 'text-sm px-3 py-1.5 h-8',
        md: 'text-base px-4 py-2 h-10',
        lg: 'text-lg px-6 py-3 h-12',
    };

    // Variant-specific classes
    const variantClasses = {
        primary: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 disabled:bg-primary-300',
        secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 active:bg-gray-300 disabled:bg-gray-50',
        outline: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100 disabled:text-gray-400',
        text: 'bg-transparent text-primary-500 hover:text-primary-600 active:text-primary-700 hover:bg-gray-50 disabled:text-gray-400',
        danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 disabled:bg-red-300',
        success: 'bg-green-500 text-white hover:bg-green-600 active:bg-green-700 disabled:bg-green-300',
    };

    // Width classes
    const widthClasses = fullWidth ? 'w-full' : '';

    // Determine the correct classes to apply
    const buttonClasses = `
    ${baseClasses}
    ${sizeClasses[size] || sizeClasses.md}
    ${variantClasses[variant] || variantClasses.primary}
    ${widthClasses}
    ${isLoading ? 'relative text-transparent' : ''}
    ${className}
  `;

    return (
        <button
            type={type}
            className={buttonClasses}
            disabled={disabled || isLoading}
            onClick={onClick}
            {...rest}
        >
            {/* Show left icon if provided */}
            {leftIcon && <span className={`mr-2 ${isLoading ? 'opacity-0' : ''}`}>{leftIcon}</span>}

            {/* Main content */}
            <span className={isLoading ? 'opacity-0' : ''}>{children}</span>

            {/* Show right icon if provided */}
            {rightIcon && <span className={`ml-2 ${isLoading ? 'opacity-0' : ''}`}>{rightIcon}</span>}

            {/* Loading spinner (shown only when isLoading is true) */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                        className="animate-spin h-5 w-5 text-current"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
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
                </div>
            )}
        </button>
    );
};

Button.propTypes = {
    variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'text', 'danger', 'success']),
    size: PropTypes.oneOf(['sm', 'md', 'lg']),
    fullWidth: PropTypes.bool,
    disabled: PropTypes.bool,
    isLoading: PropTypes.bool,
    leftIcon: PropTypes.node,
    rightIcon: PropTypes.node,
    type: PropTypes.oneOf(['button', 'submit', 'reset']),
    onClick: PropTypes.func,
    className: PropTypes.string,
    children: PropTypes.node.isRequired,
};

export default Button; 