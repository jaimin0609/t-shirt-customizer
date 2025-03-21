import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useComponentPerformance } from '../../utils/performanceMonitor';
import { useNotification } from '../../contexts/NotificationContext';
import useErrorHandler from '../../hooks/useErrorHandler';
import config from '../../config/appConfig';

// Import styles
import './DesignerStyles.css';

// Import our new components
import DesignCanvas from './DesignCanvas';
import TextControls from './TextControls';
import ImageControls from './ImageControls';

// Fonts available for text
const AVAILABLE_FONTS = [
    'Arial',
    'Times New Roman',
    'Courier New',
    'Georgia',
    'Verdana',
    'Helvetica',
    'Comic Sans MS',
    'Impact',
    'Tahoma'
];

/**
 * TShirtDesigner component for customizing t-shirts
 * This is a refactored version that uses the extracted components
 */
const TShirtDesigner = ({
    initialColor = '#FFFFFF',
    onSaveDesign
}) => {
    const { trackRender, trackOperation } = useComponentPerformance('TShirtDesigner');
    trackRender();

    const { showSuccess, showError } = useNotification();
    const { handleError, withErrorHandling } = useErrorHandler();

    const canvasRef = useRef(null);
    const [tshirtColor, setTshirtColor] = useState(initialColor);
    const [selectedObject, setSelectedObject] = useState(null);
    const [designMode, setDesignMode] = useState('text'); // 'text' or 'image'
    const [loading, setLoading] = useState(false);

    // T-shirt image based on color
    const getShirtImageUrl = useCallback((color) => {
        const colorCode = color.replace('#', '');
        return `/assets/images/tshirts/${colorCode}.png`;
    }, []);

    // Available colors for t-shirt
    const TSHIRT_COLORS = useMemo(() => [
        { name: 'White', hex: '#FFFFFF' },
        { name: 'Black', hex: '#000000' },
        { name: 'Red', hex: '#FF0000' },
        { name: 'Blue', hex: '#0000FF' },
        { name: 'Green', hex: '#008000' },
        { name: 'Yellow', hex: '#FFFF00' },
        { name: 'Purple', hex: '#800080' },
        { name: 'Gray', hex: '#808080' }
    ], []);

    // Handle color selection
    const handleColorChange = useCallback((color) => {
        setTshirtColor(color);
    }, []);

    // Handle object selection
    const handleObjectSelected = useCallback((obj) => {
        setSelectedObject(obj);

        // Set design mode based on object type
        if (obj && obj.type === 'i-text') {
            setDesignMode('text');
        } else if (obj && obj.type === 'image') {
            setDesignMode('image');
        }
    }, []);

    // Handle adding text
    const handleAddText = useCallback(() => {
        if (canvasRef.current) {
            canvasRef.current.addText('Add your text here');
            setDesignMode('text');
        }
    }, []);

    // Handle adding image
    const handleAddImage = useCallback((url) => {
        if (canvasRef.current) {
            canvasRef.current.addImage(url);
            setDesignMode('image');
        }
    }, []);

    // Handle updating object properties
    const handleObjectUpdate = useCallback((property, value) => {
        if (canvasRef.current && selectedObject) {
            if (property === 'filter') {
                canvasRef.current.applyFilter(selectedObject, value.type, value.value);
            } else {
                canvasRef.current.updateObject(selectedObject, property, value);
            }
        }
    }, [selectedObject]);

    // Handle removal of selected object
    const handleRemoveSelected = useCallback(() => {
        if (canvasRef.current && selectedObject) {
            canvasRef.current.removeSelected();
            setSelectedObject(null);
        }
    }, [selectedObject]);

    // Reset the canvas
    const handleResetCanvas = useCallback(() => {
        if (canvasRef.current) {
            canvasRef.current.resetCanvas();
            setSelectedObject(null);
        }
    }, []);

    // Handle design mode toggle
    const handleModeToggle = useCallback((mode) => {
        setDesignMode(mode);
    }, []);

    // Save the design
    const handleSaveDesign = useCallback(withErrorHandling(async () => {
        const endTiming = trackOperation('saveDesign');

        if (!canvasRef.current) {
            showError('Canvas not initialized');
            endTiming({ status: 'error', reason: 'canvas_not_initialized' });
            return;
        }

        try {
            setLoading(true);

            // Get design as data URL
            const designImageUrl = canvasRef.current.exportCanvas();

            // Call the provided onSaveDesign function with the design
            if (onSaveDesign) {
                await onSaveDesign({
                    designImage: designImageUrl,
                    tshirtColor,
                    timestamp: new Date().toISOString()
                });
            }

            showSuccess('Design saved successfully!');
            endTiming({ status: 'success' });
        } catch (error) {
            handleError(error, 'Failed to save design');
            endTiming({ status: 'error', message: error.message });
        } finally {
            setLoading(false);
        }
    }, { showNotification: true }), [handleError, onSaveDesign, showError, showSuccess, tshirtColor, trackOperation]);

    // Generate a random design (for fun)
    const generateRandomDesign = useCallback(() => {
        if (!canvasRef.current) return;

        // Reset canvas
        canvasRef.current.resetCanvas();

        // Random color
        const randomColor = TSHIRT_COLORS[Math.floor(Math.random() * TSHIRT_COLORS.length)].hex;
        setTshirtColor(randomColor);

        // Add random text
        const texts = ['Awesome T-Shirt', 'Cool Design', 'Be Creative', 'Express Yourself', 'Unique Style'];
        const randomText = texts[Math.floor(Math.random() * texts.length)];
        canvasRef.current.addText(randomText);

        // Add random image
        const icons = [
            '/assets/images/icons/t-shirt-icon.png',
            '/assets/images/icons/heart-icon.png',
            '/assets/images/icons/star-icon.png'
        ];
        const randomIcon = icons[Math.floor(Math.random() * icons.length)];
        canvasRef.current.addImage(randomIcon);
    }, [TSHIRT_COLORS]);

    // Memoize background image URL to prevent unnecessary canvas updates
    const backgroundImageUrl = useMemo(() => getShirtImageUrl(tshirtColor), [getShirtImageUrl, tshirtColor]);

    // Memoize the TextControls component props
    const textControlsProps = useMemo(() => ({
        selectedObject: selectedObject?.type === 'i-text' ? selectedObject : null,
        onUpdate: handleObjectUpdate,
        fonts: AVAILABLE_FONTS
    }), [selectedObject, handleObjectUpdate]);

    // Memoize the ImageControls component props
    const imageControlsProps = useMemo(() => ({
        selectedObject: selectedObject?.type === 'image' ? selectedObject : null,
        onAddImage: handleAddImage,
        onUpdate: handleObjectUpdate
    }), [selectedObject, handleAddImage, handleObjectUpdate]);

    return (
        <div className="tshirt-designer">
            <div className="designer-layout">
                <div className="designer-sidebar">
                    <div className="designer-tools">
                        <div className="tool-section">
                            <h3>Design Mode</h3>
                            <div className="button-group">
                                <button
                                    className={`mode-button ${designMode === 'text' ? 'active' : ''}`}
                                    onClick={() => handleModeToggle('text')}
                                >
                                    <span role="img" aria-label="Text mode">📝</span> Text
                                </button>
                                <button
                                    className={`mode-button ${designMode === 'image' ? 'active' : ''}`}
                                    onClick={() => handleModeToggle('image')}
                                >
                                    <span role="img" aria-label="Image mode">🖼️</span> Image
                                </button>
                            </div>
                        </div>

                        <div className="tool-section">
                            <h3>T-Shirt Color</h3>
                            <div className="color-picker">
                                {TSHIRT_COLORS.map((color) => (
                                    <div
                                        key={color.hex}
                                        className={`color-swatch ${tshirtColor === color.hex ? 'selected' : ''}`}
                                        style={{ backgroundColor: color.hex }}
                                        onClick={() => handleColorChange(color.hex)}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="tool-section">
                            <h3>Add Elements</h3>
                            <div className="button-group">
                                <button
                                    className="add-element-button"
                                    onClick={handleAddText}
                                >
                                    Add Text
                                </button>
                            </div>
                        </div>

                        <div className="tool-section">
                            <h3>Actions</h3>
                            <div className="button-group">
                                <button
                                    className="action-button remove-button"
                                    onClick={handleRemoveSelected}
                                    disabled={!selectedObject}
                                >
                                    Remove Selected
                                </button>
                                <button
                                    className="action-button"
                                    onClick={handleResetCanvas}
                                >
                                    Reset Canvas
                                </button>
                                <button
                                    className="action-button fun-button"
                                    onClick={generateRandomDesign}
                                >
                                    Random Design
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Render controls based on design mode */}
                    <div className="design-controls">
                        {designMode === 'text' ? (
                            <TextControls {...textControlsProps} />
                        ) : (
                            <ImageControls {...imageControlsProps} />
                        )}
                    </div>
                </div>

                <div className="designer-canvas-container">
                    <DesignCanvas
                        ref={canvasRef}
                        width={500}
                        height={600}
                        onObjectSelected={handleObjectSelected}
                        tshirtColor={tshirtColor}
                        backgroundImageUrl={backgroundImageUrl}
                    />

                    <div className="designer-actions">
                        <button
                            className="save-button"
                            onClick={handleSaveDesign}
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save Design'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

TShirtDesigner.propTypes = {
    initialColor: PropTypes.string,
    onSaveDesign: PropTypes.func.isRequired
};

export default TShirtDesigner; 