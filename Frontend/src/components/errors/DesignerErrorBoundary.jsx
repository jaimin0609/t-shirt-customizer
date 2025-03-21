import React from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '../ErrorBoundary';
import { ERROR_TYPES } from '../../services/errorHandler';
import { useNotification } from '../../contexts/NotificationContext';

/**
 * DesignerErrorBoundary is a specialized error boundary for handling errors in the T-shirt designer
 * It wraps the generic ErrorBoundary with canvas/designer-specific behavior
 */
const DesignerErrorBoundary = ({ children, onResetDesigner }) => {
    const { showInfo } = useNotification();

    // Custom reset handler that attempts to reset the designer and shows a notification
    const handleReset = () => {
        showInfo('Reinitializing the designer. Your work might be lost.', {
            duration: 5000
        });

        // If a reset function was provided, call it
        if (onResetDesigner && typeof onResetDesigner === 'function') {
            try {
                onResetDesigner();
            } catch (err) {
                console.error('Error resetting designer:', err);
            }
        }
    };

    return (
        <ErrorBoundary
            fallback="There was a problem with the T-shirt designer. We're sorry for the inconvenience."
            showReset={true}
            showHome={true}
            name="DesignerErrorBoundary"
            onReset={handleReset}
        >
            {children}
        </ErrorBoundary>
    );
};

DesignerErrorBoundary.propTypes = {
    children: PropTypes.node.isRequired,
    onResetDesigner: PropTypes.func
};

export default DesignerErrorBoundary; 