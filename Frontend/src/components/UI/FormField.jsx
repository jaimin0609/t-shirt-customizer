import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * Accessible Form Field Component
 * 
 * A wrapper component for form inputs that provides consistent styling,
 * proper labeling, error handling, and accessibility features.
 */
const FormField = ({
    id,
    label,
    name,
    type = 'text',
    placeholder = '',
    value,
    onChange,
    onBlur,
    error = '',
    touched = false,
    required = false,
    disabled = false,
    readOnly = false,
    helpText = '',
    className = '',
    labelClassName = '',
    inputClassName = '',
    errorClassName = '',
    helpTextClassName = '',
    children,
    autoComplete,
    ...props
}) => {
    // Generate a unique ID if not provided
    const fieldId = id || `field-${name}-${Math.random().toString(36).substring(2, 9)}`;
    const errorId = `${fieldId}-error`;
    const helpTextId = `${fieldId}-help`;
    const hasError = error && touched;

    // Base styles for different elements
    const containerClasses = classNames('mb-4', className);

    const labelClasses = classNames(
        'block text-sm font-medium text-gray-700 mb-1',
        {
            'text-red-600': hasError,
        },
        labelClassName
    );

    const inputClasses = classNames(
        'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 sm:text-sm',
        {
            'border-gray-300 focus:border-blue-500 focus:ring-blue-500': !hasError && !disabled,
            'border-red-300 focus:border-red-500 focus:ring-red-500': hasError,
            'bg-gray-50 text-gray-500 border-gray-200': disabled,
            'bg-gray-50 border-gray-200': readOnly,
        },
        inputClassName
    );

    const errorClasses = classNames(
        'mt-1 text-sm text-red-600',
        errorClassName
    );

    const helpTextClasses = classNames(
        'mt-1 text-sm text-gray-500',
        helpTextClassName
    );

    // Determine which input element to render
    const renderInput = () => {
        // If children are provided, assume it's a custom input or composite component
        if (children) {
            return React.Children.map(children, child => {
                if (!React.isValidElement(child)) return child;

                // Clone the child to pass necessary props for accessibility
                return React.cloneElement(child, {
                    id: fieldId,
                    name: name || child.props.name,
                    'aria-invalid': hasError ? 'true' : 'false',
                    'aria-describedby': [
                        hasError ? errorId : null,
                        helpText ? helpTextId : null,
                    ].filter(Boolean).join(' ') || undefined,
                    ...child.props,
                });
            });
        }

        // For textarea
        if (type === 'textarea') {
            return (
                <textarea
                    id={fieldId}
                    name={name}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    disabled={disabled}
                    readOnly={readOnly}
                    required={required}
                    className={inputClasses}
                    aria-invalid={hasError ? 'true' : 'false'}
                    aria-describedby={[
                        hasError ? errorId : null,
                        helpText ? helpTextId : null,
                    ].filter(Boolean).join(' ') || undefined}
                    autoComplete={autoComplete}
                    {...props}
                />
            );
        }

        // For select
        if (type === 'select') {
            return (
                <select
                    id={fieldId}
                    name={name}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    disabled={disabled}
                    readOnly={readOnly}
                    required={required}
                    className={inputClasses}
                    aria-invalid={hasError ? 'true' : 'false'}
                    aria-describedby={[
                        hasError ? errorId : null,
                        helpText ? helpTextId : null,
                    ].filter(Boolean).join(' ') || undefined}
                    {...props}
                >
                    {props.options?.map((option) => (
                        <option
                            key={option.value}
                            value={option.value}
                            disabled={option.disabled}
                        >
                            {option.label}
                        </option>
                    ))}
                </select>
            );
        }

        // For radio buttons or checkboxes
        if (type === 'radio' || type === 'checkbox') {
            return (
                <div className="mt-1">
                    {props.options?.map((option) => (
                        <div key={option.value} className="flex items-center mb-1">
                            <input
                                id={`${fieldId}-${option.value}`}
                                name={name}
                                type={type}
                                value={option.value}
                                checked={Array.isArray(value)
                                    ? value.includes(option.value)
                                    : value === option.value}
                                onChange={onChange}
                                onBlur={onBlur}
                                disabled={disabled || option.disabled}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                required={required}
                                aria-describedby={[
                                    hasError ? errorId : null,
                                    helpText ? helpTextId : null,
                                ].filter(Boolean).join(' ') || undefined}
                                {...props}
                            />
                            <label
                                htmlFor={`${fieldId}-${option.value}`}
                                className="ml-2 block text-sm text-gray-700"
                            >
                                {option.label}
                            </label>
                        </div>
                    ))}
                </div>
            );
        }

        // Default input
        return (
            <input
                id={fieldId}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                placeholder={placeholder}
                disabled={disabled}
                readOnly={readOnly}
                required={required}
                className={inputClasses}
                aria-invalid={hasError ? 'true' : 'false'}
                aria-describedby={[
                    hasError ? errorId : null,
                    helpText ? helpTextId : null,
                ].filter(Boolean).join(' ') || undefined}
                autoComplete={autoComplete}
                {...props}
            />
        );
    };

    return (
        <div className={containerClasses}>
            {/* Label */}
            <label htmlFor={fieldId} className={labelClasses}>
                {label}
                {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
            </label>

            {/* Input Element */}
            {renderInput()}

            {/* Error Message */}
            {hasError && (
                <p className={errorClasses} id={errorId} role="alert">
                    {error}
                </p>
            )}

            {/* Help Text */}
            {helpText && !hasError && (
                <p className={helpTextClasses} id={helpTextId}>
                    {helpText}
                </p>
            )}
        </div>
    );
};

FormField.propTypes = {
    id: PropTypes.string,
    label: PropTypes.node.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string,
    placeholder: PropTypes.string,
    value: PropTypes.any,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    error: PropTypes.string,
    touched: PropTypes.bool,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    readOnly: PropTypes.bool,
    helpText: PropTypes.node,
    className: PropTypes.string,
    labelClassName: PropTypes.string,
    inputClassName: PropTypes.string,
    errorClassName: PropTypes.string,
    helpTextClassName: PropTypes.string,
    children: PropTypes.node,
    autoComplete: PropTypes.string,
    options: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.any.isRequired,
        label: PropTypes.node.isRequired,
        disabled: PropTypes.bool
    }))
};

export default FormField; 