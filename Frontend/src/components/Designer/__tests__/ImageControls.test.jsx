import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImageControls from '../ImageControls';

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
        showError: jest.fn()
    })
}));

// Mock the error handler hook
jest.mock('../../../hooks/useErrorHandler', () => ({
    __esModule: true,
    default: () => ({
        withErrorHandling: (fn, options) => fn
    })
}));

// Mock configuration
jest.mock('../../../config/appConfig', () => ({
    CLOUDINARY: {
        CLOUD_NAME: 'demo',
        UPLOAD_PRESET: 'preset'
    },
    FEATURES: {
        USE_CLOUD_STORAGE: false
    }
}));

describe('ImageControls Component', () => {
    const mockSelectedObject = {
        type: 'image',
        opacity: 0.8,
        _filters: [
            { brightness: 0.2 },
            { contrast: 0.1 }
        ],
        flipX: true,
        flipY: false
    };

    const mockOnAddImage = jest.fn();
    const mockOnUpdate = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock URL.createObjectURL
        global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');

        // Mock FileReader
        global.FileReader = class {
            readAsDataURL() {
                setTimeout(() => {
                    this.onload({ target: { result: 'data:image/png;base64,mockdata' } });
                }, 0);
            }
        };
    });

    test('renders upload controls when no image is selected', () => {
        render(
            <ImageControls
                onAddImage={mockOnAddImage}
                onUpdate={mockOnUpdate}
            />
        );

        // Should show the upload section
        expect(screen.getByText(/Add Image/i)).toBeInTheDocument();
        expect(screen.getByText(/Upload Image/i)).toBeInTheDocument();

        // Should show the library section
        expect(screen.getByText(/Image Library/i)).toBeInTheDocument();

        // Should not show editing controls
        expect(screen.queryByLabelText(/Opacity/i)).not.toBeInTheDocument();
    });

    test('renders editing controls when an image is selected', () => {
        render(
            <ImageControls
                selectedObject={mockSelectedObject}
                onAddImage={mockOnAddImage}
                onUpdate={mockOnUpdate}
            />
        );

        // Should show editing controls
        expect(screen.getByLabelText(/Opacity/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Brightness/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Contrast/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Flip/i)).toBeInTheDocument();

        // Should not show upload controls
        expect(screen.queryByText(/Add Image/i)).not.toBeInTheDocument();
    });

    test('uses image property values from selected object', () => {
        render(
            <ImageControls
                selectedObject={mockSelectedObject}
                onAddImage={mockOnAddImage}
                onUpdate={mockOnUpdate}
            />
        );

        // Opacity slider should have the value from the selected object
        expect(screen.getByLabelText(/Opacity/i).value).toBe('0.8');

        // Brightness slider should have the value from the selected object
        expect(screen.getByLabelText(/Brightness/i).value).toBe('0.2');

        // Contrast slider should have the value from the selected object
        expect(screen.getByLabelText(/Contrast/i).value).toBe('0.1');

        // Flip buttons should reflect the values from the selected object
        const flipXButton = screen.getByLabelText(/Flip Horizontally/i);
        const flipYButton = screen.getByLabelText(/Flip Vertically/i);

        expect(flipXButton).toHaveClass('active');
        expect(flipYButton).not.toHaveClass('active');
    });

    test('calls onUpdate when opacity is changed', () => {
        render(
            <ImageControls
                selectedObject={mockSelectedObject}
                onAddImage={mockOnAddImage}
                onUpdate={mockOnUpdate}
            />
        );

        const opacitySlider = screen.getByLabelText(/Opacity/i);
        fireEvent.change(opacitySlider, { target: { value: '0.5' } });

        expect(mockOnUpdate).toHaveBeenCalledWith('opacity', 0.5);
    });

    test('calls onUpdate with filter property when brightness is changed', () => {
        render(
            <ImageControls
                selectedObject={mockSelectedObject}
                onAddImage={mockOnAddImage}
                onUpdate={mockOnUpdate}
            />
        );

        const brightnessSlider = screen.getByLabelText(/Brightness/i);
        fireEvent.change(brightnessSlider, { target: { value: '0.3' } });

        expect(mockOnUpdate).toHaveBeenCalledWith('filter', { type: 'brightness', value: 0.3 });
    });

    test('calls onUpdate with filter property when contrast is changed', () => {
        render(
            <ImageControls
                selectedObject={mockSelectedObject}
                onAddImage={mockOnAddImage}
                onUpdate={mockOnUpdate}
            />
        );

        const contrastSlider = screen.getByLabelText(/Contrast/i);
        fireEvent.change(contrastSlider, { target: { value: '0.4' } });

        expect(mockOnUpdate).toHaveBeenCalledWith('filter', { type: 'contrast', value: 0.4 });
    });

    test('toggles flipX property when horizontal flip button is clicked', () => {
        render(
            <ImageControls
                selectedObject={mockSelectedObject}
                onAddImage={mockOnAddImage}
                onUpdate={mockOnUpdate}
            />
        );

        const flipXButton = screen.getByLabelText(/Flip Horizontally/i);
        fireEvent.click(flipXButton);

        // Since flipX is initially true, it should be toggled to false
        expect(mockOnUpdate).toHaveBeenCalledWith('flipX', false);
    });

    test('toggles flipY property when vertical flip button is clicked', () => {
        render(
            <ImageControls
                selectedObject={mockSelectedObject}
                onAddImage={mockOnAddImage}
                onUpdate={mockOnUpdate}
            />
        );

        const flipYButton = screen.getByLabelText(/Flip Vertically/i);
        fireEvent.click(flipYButton);

        // Since flipY is initially false, it should be toggled to true
        expect(mockOnUpdate).toHaveBeenCalledWith('flipY', true);
    });

    test('calls onAddImage when a library image is clicked', () => {
        render(
            <ImageControls
                onAddImage={mockOnAddImage}
                onUpdate={mockOnUpdate}
            />
        );

        // Find the first library image and click it
        const libraryImages = screen.getAllByRole('img');
        fireEvent.click(libraryImages[0].parentElement);

        expect(mockOnAddImage).toHaveBeenCalledTimes(1);
        expect(mockOnAddImage).toHaveBeenCalledWith(expect.stringContaining('/assets/images/icons/'));
    });

    test('updates local state when selected object changes', () => {
        const { rerender } = render(
            <ImageControls
                selectedObject={mockSelectedObject}
                onAddImage={mockOnAddImage}
                onUpdate={mockOnUpdate}
            />
        );

        // Initial opacity should be 0.8
        expect(screen.getByLabelText(/Opacity/i).value).toBe('0.8');

        // Change the selected object
        const updatedObject = {
            ...mockSelectedObject,
            opacity: 0.4,
            _filters: [
                { brightness: -0.1 },
                { contrast: 0.5 }
            ]
        };

        rerender(
            <ImageControls
                selectedObject={updatedObject}
                onAddImage={mockOnAddImage}
                onUpdate={mockOnUpdate}
            />
        );

        // Opacity should now be 0.4
        expect(screen.getByLabelText(/Opacity/i).value).toBe('0.4');

        // Brightness should now be -0.1
        expect(screen.getByLabelText(/Brightness/i).value).toBe('-0.1');

        // Contrast should now be 0.5
        expect(screen.getByLabelText(/Contrast/i).value).toBe('0.5');
    });
}); 