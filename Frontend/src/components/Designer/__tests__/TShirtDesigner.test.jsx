import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TShirtDesigner from '../TShirtDesigner';

// Mock the child components
jest.mock('../DesignCanvas', () => {
    const React = require('react');
    const forwardRef = (props, ref) => {
        React.useImperativeHandle(ref, () => ({
            addText: jest.fn(),
            addImage: jest.fn(),
            updateObject: jest.fn(),
            applyFilter: jest.fn(),
            removeSelected: jest.fn(),
            resetCanvas: jest.fn(),
            exportCanvas: jest.fn().mockReturnValue('data:image/png;base64,mockImageData')
        }));
        return <div data-testid="design-canvas" />;
    };
    return React.forwardRef(forwardRef);
});

jest.mock('../TextControls', () => {
    return function MockTextControls(props) {
        return <div data-testid="text-controls">TextControls Mock</div>;
    };
});

jest.mock('../ImageControls', () => {
    return function MockImageControls(props) {
        return <div data-testid="image-controls">ImageControls Mock</div>;
    };
});

// Mock the performance monitoring hook
jest.mock('../../../utils/performanceMonitor', () => ({
    useComponentPerformance: () => ({
        trackRender: jest.fn(),
        trackOperation: jest.fn().mockReturnValue(jest.fn())
    })
}));

// Mock the notification context
jest.mock('../../../contexts/NotificationContext', () => ({
    useNotification: () => ({
        showSuccess: jest.fn(),
        showError: jest.fn(),
        showWarning: jest.fn(),
        showInfo: jest.fn()
    })
}));

// Mock the error handler hook
jest.mock('../../../hooks/useErrorHandler', () => ({
    __esModule: true,
    default: () => ({
        handleError: jest.fn(),
        withErrorHandling: (fn) => fn
    })
}));

describe('TShirtDesigner Component', () => {
    const mockSaveDesign = jest.fn();

    beforeEach(() => {
        mockSaveDesign.mockClear();
    });

    test('renders with default props', () => {
        render(<TShirtDesigner onSaveDesign={mockSaveDesign} />);

        // Check if main components are rendered
        expect(screen.getByTestId('design-canvas')).toBeInTheDocument();
        expect(screen.getByText(/Add Text/i)).toBeInTheDocument();
        expect(screen.getByText(/Remove Selected/i)).toBeInTheDocument();
        expect(screen.getByText(/Reset Canvas/i)).toBeInTheDocument();
        expect(screen.getByText(/Save Design/i)).toBeInTheDocument();
    });

    test('renders text controls by default', () => {
        render(<TShirtDesigner onSaveDesign={mockSaveDesign} />);

        // Text controls should be shown by default
        expect(screen.getByTestId('text-controls')).toBeInTheDocument();
        expect(screen.queryByTestId('image-controls')).not.toBeInTheDocument();
    });

    test('switches to image controls when image mode is selected', () => {
        render(<TShirtDesigner onSaveDesign={mockSaveDesign} />);

        // Click the image mode button
        const imageModeButton = screen.getByRole('button', { name: /Image mode/i });
        fireEvent.click(imageModeButton);

        // Image controls should now be shown
        expect(screen.getByTestId('image-controls')).toBeInTheDocument();
        expect(screen.queryByTestId('text-controls')).not.toBeInTheDocument();
    });

    test('changes tshirt color when color swatch is clicked', () => {
        render(<TShirtDesigner onSaveDesign={mockSaveDesign} />);

        // Find a color swatch (black) and click it
        const blackColorSwatch = screen.getByTitle('Black');
        fireEvent.click(blackColorSwatch);

        // The black swatch should now have the 'selected' class
        expect(blackColorSwatch).toHaveClass('color-swatch');
        expect(blackColorSwatch).toHaveClass('selected');
    });

    test('calls onSaveDesign when save button is clicked', async () => {
        render(<TShirtDesigner onSaveDesign={mockSaveDesign} />);

        // Click the save button
        const saveButton = screen.getByText(/Save Design/i);
        fireEvent.click(saveButton);

        // onSaveDesign should have been called with design data
        expect(mockSaveDesign).toHaveBeenCalledTimes(1);
        expect(mockSaveDesign).toHaveBeenCalledWith(
            expect.objectContaining({
                designImage: expect.any(String),
                tshirtColor: expect.any(String),
                timestamp: expect.any(String)
            })
        );
    });
}); 