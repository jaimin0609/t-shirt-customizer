import React from 'react';
import { render, screen } from '@testing-library/react';
import DesignCanvas from '../DesignCanvas';

// Mock fabric.js
jest.mock('fabric', () => {
    const mockCanvas = {
        add: jest.fn(),
        remove: jest.fn(),
        renderAll: jest.fn(),
        setActiveObject: jest.fn(),
        getActiveObject: jest.fn(),
        on: jest.fn(),
        setBackgroundImage: jest.fn(),
        setDimensions: jest.fn(),
        getObjects: jest.fn().mockReturnValue([]),
        setViewportTransform: jest.fn(),
        toDataURL: jest.fn().mockReturnValue('data:image/png;base64,mockImageDataUrl'),
        dispose: jest.fn()
    };

    return {
        fabric: {
            Canvas: jest.fn(() => mockCanvas),
            Image: {
                fromURL: jest.fn((url, callback) => {
                    const mockImage = {
                        set: jest.fn(),
                        scaleToWidth: jest.fn(),
                        scaleToHeight: jest.fn(),
                        getScaledWidth: jest.fn().mockReturnValue(100),
                        getScaledHeight: jest.fn().mockReturnValue(100),
                        width: 200,
                        height: 200
                    };
                    callback(mockImage);
                    return mockImage;
                })
            },
            Text: jest.fn(() => ({
                set: jest.fn()
            }))
        }
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
        showError: jest.fn()
    })
}));

describe('DesignCanvas Component', () => {
    const defaultProps = {
        canvasWidth: 600,
        canvasHeight: 600,
        onObjectSelected: jest.fn(),
        onSelectionCleared: jest.fn(),
        onCanvasReady: jest.fn(),
        backgroundImageUrl: '/assets/images/tshirts/FFFFFF.png',
        tshirtColor: '#FFFFFF'
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders canvas element', () => {
        render(<DesignCanvas {...defaultProps} />);

        // Check if canvas is rendered
        const canvas = screen.getByRole('presentation');
        expect(canvas).toBeInTheDocument();
        expect(canvas.tagName.toLowerCase()).toBe('canvas');
    });

    test('initializes fabric canvas on mount', () => {
        const { fabric } = require('fabric');

        render(<DesignCanvas {...defaultProps} />);

        // Canvas should be initialized
        expect(fabric.Canvas).toHaveBeenCalledTimes(1);
    });

    test('sets up event listeners', () => {
        const { fabric } = require('fabric');

        render(<DesignCanvas {...defaultProps} />);

        // Event listeners should be set up
        const mockCanvas = fabric.Canvas.mock.results[0].value;
        expect(mockCanvas.on).toHaveBeenCalledWith('selection:created', expect.any(Function));
        expect(mockCanvas.on).toHaveBeenCalledWith('selection:cleared', expect.any(Function));
    });

    test('loads background image', () => {
        const { fabric } = require('fabric');

        render(<DesignCanvas {...defaultProps} />);

        // Background image should be loaded
        expect(fabric.Image.fromURL).toHaveBeenCalledWith(
            defaultProps.backgroundImageUrl,
            expect.any(Function),
            expect.objectContaining({ crossOrigin: 'anonymous' })
        );
    });

    test('disposes canvas on unmount', () => {
        const { fabric } = require('fabric');

        const { unmount } = render(<DesignCanvas {...defaultProps} />);

        // Unmount the component
        unmount();

        // Canvas should be disposed
        const mockCanvas = fabric.Canvas.mock.results[0].value;
        expect(mockCanvas.dispose).toHaveBeenCalledTimes(1);
    });

    test('calls onCanvasReady when canvas is initialized', () => {
        render(<DesignCanvas {...defaultProps} />);

        // onCanvasReady should be called
        expect(defaultProps.onCanvasReady).toHaveBeenCalledTimes(1);
    });

    // We can't easily test imperative handles (addText, addImage, etc.) with React Testing Library
    // Those would be better tested with integration tests or using React's TestRenderer
});

// Test the forwardRef wrapper component separately
describe('DesignCanvas forwardRef', () => {
    test('exports a forwardRef component', () => {
        // This is a crude test that ensures the default export is not the unwrapped component
        expect(DesignCanvas).not.toBe(React.forwardRef);
        expect(DesignCanvas.$$typeof).toBe(Symbol.for('react.forward_ref'));
    });
}); 