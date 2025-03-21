import React, { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { fabric } from 'fabric';
import { useNotification } from '../../contexts/NotificationContext';
import { useComponentPerformance } from '../../utils/performanceMonitor';

/**
 * DesignCanvas component handles the fabric.js canvas for t-shirt design
 * Separated from TShirtDesigner to focus on canvas-specific functionality
 */
const DesignCanvas = ({
    canvasWidth = 600,
    canvasHeight = 600,
    onObjectAdded,
    onObjectRemoved,
    onObjectModified,
    onSelectionCreated,
    onSelectionCleared,
    onCanvasReady,
    tshirtColor,
    backgroundImageUrl
}) => {
    const { trackRender, trackOperation } = useComponentPerformance('DesignCanvas');
    trackRender();

    const canvasRef = useRef(null);
    const canvasInstanceRef = useRef(null);
    const [isCanvasReady, setIsCanvasReady] = useState(false);
    const { showError } = useNotification();

    // Initialize canvas
    const initCanvas = useCallback(() => {
        const endTiming = trackOperation('initCanvas');
        try {
            // Clean up any existing canvas
            if (canvasInstanceRef.current) {
                canvasInstanceRef.current.dispose();
            }

            // Create new fabric.js canvas
            const canvas = new fabric.Canvas(canvasRef.current, {
                width: canvasWidth,
                height: canvasHeight,
                selection: true,
                preserveObjectStacking: true
            });

            // Set reference
            canvasInstanceRef.current = canvas;

            // Add event listeners
            canvas.on('object:added', (e) => onObjectAdded && onObjectAdded(e, canvas));
            canvas.on('object:removed', (e) => onObjectRemoved && onObjectRemoved(e, canvas));
            canvas.on('object:modified', (e) => onObjectModified && onObjectModified(e, canvas));
            canvas.on('selection:created', (e) => onSelectionCreated && onSelectionCreated(e, canvas));
            canvas.on('selection:cleared', (e) => onSelectionCleared && onSelectionCleared(e, canvas));

            // Load background image if provided
            if (backgroundImageUrl) {
                loadBackgroundImage(backgroundImageUrl, canvas);
            }

            // Notify parent component that canvas is ready
            setIsCanvasReady(true);
            if (onCanvasReady) {
                onCanvasReady(canvas);
            }

            endTiming({ width: canvasWidth, height: canvasHeight });
        } catch (error) {
            showError('Failed to initialize design canvas');
            console.error('Canvas initialization error:', error);
            endTiming({ error: true });
        }
    }, [canvasWidth, canvasHeight, backgroundImageUrl, onCanvasReady, onObjectAdded, onObjectModified, onObjectRemoved, onSelectionCleared, onSelectionCreated, showError, trackOperation]);

    // Load the background t-shirt image
    const loadBackgroundImage = useCallback((url, canvas) => {
        const endTiming = trackOperation('loadBackgroundImage');
        fabric.Image.fromURL(url, (img) => {
            // Position the image in the center
            img.set({
                left: 0,
                top: 0,
                selectable: false,
                evented: false
            });

            // Scale to fit canvas
            const canvasRatio = canvas.width / canvas.height;
            const imgRatio = img.width / img.height;

            if (imgRatio > canvasRatio) {
                // Image is wider
                img.scaleToWidth(canvas.width);
            } else {
                // Image is taller
                img.scaleToHeight(canvas.height);
            }

            // Center the image
            img.set({
                left: (canvas.width - img.getScaledWidth()) / 2,
                top: (canvas.height - img.getScaledHeight()) / 2
            });

            // Add the background image
            canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
                crossOrigin: 'anonymous'
            });

            endTiming({ url, width: img.width, height: img.height });
        }, { crossOrigin: 'anonymous' });
    }, [trackOperation]);

    // Initialize canvas on component mount
    useEffect(() => {
        initCanvas();

        // Cleanup on unmount
        return () => {
            if (canvasInstanceRef.current) {
                canvasInstanceRef.current.dispose();
            }
        };
    }, [initCanvas]);

    // Update background image when tshirt color changes
    useEffect(() => {
        if (isCanvasReady && canvasInstanceRef.current && backgroundImageUrl) {
            loadBackgroundImage(backgroundImageUrl, canvasInstanceRef.current);
        }
    }, [backgroundImageUrl, isCanvasReady, loadBackgroundImage, tshirtColor]);

    // Resize handler
    const handleResize = useCallback(() => {
        if (canvasInstanceRef.current) {
            // Implement responsive behavior if needed
            canvasInstanceRef.current.setDimensions({
                width: canvasWidth,
                height: canvasHeight
            });
            canvasInstanceRef.current.renderAll();
        }
    }, [canvasWidth, canvasHeight]);

    // Set up resize listener
    useEffect(() => {
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [handleResize]);

    // External methods (exposed via refs)
    // These methods could be exposed to parent component using useImperativeHandle if needed

    // Reset canvas zoom and pan
    const resetView = useCallback(() => {
        if (canvasInstanceRef.current) {
            canvasInstanceRef.current.setViewportTransform([1, 0, 0, 1, 0, 0]);
            canvasInstanceRef.current.renderAll();
        }
    }, []);

    // Add text to canvas
    const addText = useCallback((text, options = {}) => {
        if (!canvasInstanceRef.current) return null;

        const defaultOptions = {
            left: canvasWidth / 2,
            top: canvasHeight / 2,
            fontSize: 20,
            fill: '#000000',
            fontFamily: 'Arial',
            fontWeight: 'normal',
            textAlign: 'center',
            originX: 'center',
            originY: 'center',
            ...options
        };

        const textObj = new fabric.Text(text, defaultOptions);
        canvasInstanceRef.current.add(textObj);
        canvasInstanceRef.current.setActiveObject(textObj);
        canvasInstanceRef.current.renderAll();

        return textObj;
    }, [canvasHeight, canvasWidth]);

    // Add image to canvas
    const addImage = useCallback((url, options = {}) => {
        if (!canvasInstanceRef.current) return null;

        const canvas = canvasInstanceRef.current;

        fabric.Image.fromURL(url, (img) => {
            const defaultOptions = {
                left: canvasWidth / 2,
                top: canvasHeight / 2,
                originX: 'center',
                originY: 'center',
                ...options
            };

            img.set(defaultOptions);

            // Scale image if it's too large
            if (img.width > canvasWidth / 2) {
                img.scaleToWidth(canvasWidth / 2);
            }

            if (img.height > canvasHeight / 2) {
                img.scaleToHeight(canvasHeight / 2);
            }

            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
        }, { crossOrigin: 'anonymous' });
    }, [canvasHeight, canvasWidth]);

    // Remove selected object
    const removeSelectedObject = useCallback(() => {
        if (!canvasInstanceRef.current) return;

        const canvas = canvasInstanceRef.current;
        const activeObject = canvas.getActiveObject();

        if (activeObject) {
            canvas.remove(activeObject);
            canvas.renderAll();
        }
    }, []);

    // Get current canvas instance
    const getCanvas = useCallback(() => canvasInstanceRef.current, []);

    // Export the canvas as data URL
    const exportCanvasAsDataURL = useCallback((format = 'png', quality = 1) => {
        if (!canvasInstanceRef.current) return null;

        // Hide the background temporarily if needed
        const tempBgImage = canvasInstanceRef.current.backgroundImage;
        canvasInstanceRef.current.backgroundImage = null;
        canvasInstanceRef.current.renderAll();

        // Get data URL
        const dataURL = canvasInstanceRef.current.toDataURL({
            format: format,
            quality: quality,
            multiplier: 2  // Higher resolution
        });

        // Restore the background
        canvasInstanceRef.current.backgroundImage = tempBgImage;
        canvasInstanceRef.current.renderAll();

        return dataURL;
    }, []);

    // Expose methods to parent
    React.useImperativeHandle(
        ref,
        () => ({
            addText,
            addImage,
            removeSelectedObject,
            resetView,
            getCanvas,
            exportCanvasAsDataURL
        }),
        [addText, addImage, removeSelectedObject, resetView, getCanvas, exportCanvasAsDataURL]
    );

    return (
        <div className="design-canvas-container">
            <canvas ref={canvasRef} />
        </div>
    );
};

DesignCanvas.propTypes = {
    canvasWidth: PropTypes.number,
    canvasHeight: PropTypes.number,
    onObjectAdded: PropTypes.func,
    onObjectRemoved: PropTypes.func,
    onObjectModified: PropTypes.func,
    onSelectionCreated: PropTypes.func,
    onSelectionCleared: PropTypes.func,
    onCanvasReady: PropTypes.func,
    tshirtColor: PropTypes.string,
    backgroundImageUrl: PropTypes.string
};

export default React.forwardRef((props, ref) => <DesignCanvas {...props} ref={ref} />); 