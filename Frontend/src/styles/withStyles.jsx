/**
 * withStyles HOC
 * 
 * This higher-order component provides a convenient way to attach styles
 * to React components using our style system.
 */

import React from 'react';
import { optimizeStyles, combineStyles } from './cssOptimizer';

/**
 * Higher-order component for attaching styles to a React component
 * 
 * @param {Function|Object} styleCreator - Style object or function that returns styles based on props
 * @param {Object} options - Additional options for styling
 * @returns {Function} - HOC that wraps the component with styles
 */
function withStyles(styleCreator, options = {}) {
    const {
        name = '',                  // Component name for debugging
        injectProps = true,         // Whether to inject className and styles as props
        propNamespace = '',         // Optional namespace for injected props
        forwardRef = false,         // Whether to forward refs to the wrapped component
        withTheme = false,          // Whether to inject the theme as a prop
    } = options;

    return function wrapWithStyles(WrappedComponent) {
        // Main component that renders the wrapped component with styles
        function WithStyles(props) {
            // Get styles - either call function or use object directly
            const styleResult = typeof styleCreator === 'function'
                ? styleCreator(props)
                : optimizeStyles(styleCreator);

            // Extract style details
            const { className, styles } = styleResult;

            // Prepare props for the wrapped component
            let newProps = { ...props };

            // Combine classNames if the component already has one
            if (props.className) {
                newProps.className = `${className} ${props.className}`;
            } else {
                newProps.className = className;
            }

            // Inject additional props if requested
            if (injectProps) {
                const prefix = propNamespace ? `${propNamespace}` : '';

                newProps = {
                    ...newProps,
                    [`${prefix}styles`]: styles,
                    [`${prefix}className`]: className,
                    [`${prefix}cx`]: (...args) => {
                        return [className, ...args].filter(Boolean).join(' ');
                    },
                };
            }

            // Inject theme if requested
            if (withTheme) {
                // This implementation is just a placeholder.
                // In a real app, you'd get the theme from a context.
                const theme = { mode: 'light' }; // placeholder
                newProps.theme = theme;
            }

            // Forward ref if needed
            if (forwardRef && props.forwardedRef) {
                newProps.ref = props.forwardedRef;
                delete newProps.forwardedRef;
            }

            // Render the wrapped component with the new props
            return <WrappedComponent {...newProps} />;
        }

        // Set display name for debugging
        const componentName = name || WrappedComponent.displayName || WrappedComponent.name || 'Component';
        WithStyles.displayName = `WithStyles(${componentName})`;

        // Set up to forward refs if needed
        if (forwardRef) {
            return React.forwardRef((props, ref) => (
                <WithStyles {...props} forwardedRef={ref} />
            ));
        }

        return WithStyles;
    };
}

/**
 * Create a styled component directly
 * 
 * @param {string} component - HTML element or component to style
 * @param {Object|Function} styles - Styles to apply
 * @param {Object} options - Additional styling options
 * @returns {Function} - Styled component
 */
export function styled(component, styles, options = {}) {
    const StyledComponent = withStyles(styles, options)(component);
    return StyledComponent;
}

/**
 * Create a component with dynamic styles based on props
 * 
 * @param {string|Function} component - Component to style
 * @param {Function} stylesFn - Function that generates styles based on props
 * @param {Object} options - Additional styling options
 * @returns {Function} - Dynamically styled component
 */
export function createStyledComponent(component, stylesFn, options = {}) {
    return styled(component, stylesFn, options);
}

/**
 * Combine multiple style HOCs into one
 * 
 * @param {...Function} hocs - withStyles HOCs to combine
 * @returns {Function} - Combined HOC
 */
export function composeStyles(...hocs) {
    return function (component) {
        return hocs.reduce((acc, hoc) => hoc(acc), component);
    };
}

/**
 * Apply inline styles to a component
 * 
 * @param {Object|Function} styles - Styles to apply inline
 * @returns {Function} - HOC that applies inline styles
 */
export function withInlineStyles(styles) {
    return function (WrappedComponent) {
        return function InlineStyledComponent(props) {
            // Get styles based on props if it's a function
            const styleObj = typeof styles === 'function' ? styles(props) : styles;

            // Apply as inline style
            return <WrappedComponent {...props} style={{ ...props.style, ...styleObj }} />;
        };
    };
}

export default withStyles; 