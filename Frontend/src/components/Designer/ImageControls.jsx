import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { useNotification } from '../../contexts/NotificationContext';
import { useComponentPerformance } from '../../utils/performanceMonitor';
import useErrorHandler from '../../hooks/useErrorHandler';
import config from '../../config/appConfig';

/**
 * ImageControls component for managing image uploads and manipulations
 * in the t-shirt designer
 */
const ImageControls = ({
    selectedObject,
    onAddImage,
    onUpdate
}) => {
    const { trackRender, trackOperation } = useComponentPerformance('ImageControls');
    trackRender();

    const { showSuccess, showError } = useNotification();
    const { withErrorHandling } = useErrorHandler();
    const fileInputRef = useRef(null);

    // Image properties state
    const [imageProps, setImageProps] = useState({
        opacity: 1,
        brightness: 0,
        contrast: 0,
        flipX: false,
        flipY: false
    });

    // Upload status
    const [isUploading, setIsUploading] = useState(false);

    // Update local state when selected object changes
    useEffect(() => {
        if (selectedObject && selectedObject.type === 'image') {
            setImageProps({
                opacity: typeof selectedObject.opacity === 'number' ? selectedObject.opacity : 1,
                brightness: selectedObject._filters && selectedObject._filters[0] ?
                    selectedObject._filters[0].brightness : 0,
                contrast: selectedObject._filters && selectedObject._filters[1] ?
                    selectedObject._filters[1].contrast : 0,
                flipX: selectedObject.flipX || false,
                flipY: selectedObject.flipY || false
            });
        }
    }, [selectedObject]);

    // Check if we have a valid image object selected
    const isImageSelected = selectedObject && selectedObject.type === 'image';

    // Process image file (either upload to server or create local URL)
    const processImageFile = useCallback(withErrorHandling(async (file) => {
        // If using Cloudinary for uploads
        if (config.CLOUDINARY.CLOUD_NAME && config.FEATURES.USE_CLOUD_STORAGE) {
            return await uploadToCloudinary(file);
        } else {
            // Use local URL
            return URL.createObjectURL(file);
        }
    }, {
        fallbackMessage: 'Failed to process image',
        showNotification: false
    }), []);

    // Upload to Cloudinary
    const uploadToCloudinary = useCallback(withErrorHandling(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', config.CLOUDINARY.UPLOAD_PRESET);

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${config.CLOUDINARY.CLOUD_NAME}/image/upload`,
            {
                method: 'POST',
                body: formData
            }
        );

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        return data.secure_url;
    }, {
        fallbackMessage: 'Failed to upload image to cloud storage',
        showNotification: false
    }), []);

    // Handle file selection
    const handleFileChange = useCallback(async (e) => {
        const endTiming = trackOperation('handleFileChange');
        const file = e.target.files[0];

        if (!file) {
            endTiming({ status: 'cancelled' });
            return;
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            showError(`Unsupported file type. Please upload: ${validTypes.join(', ')}`);
            endTiming({ status: 'invalid_type', type: file.type });
            return;
        }

        // Validate file size
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            showError(`File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`);
            endTiming({ status: 'too_large', size: file.size });
            return;
        }

        try {
            setIsUploading(true);

            // Process the file (either upload to server or use local URL)
            const imageUrl = await processImageFile(file);

            if (imageUrl) {
                onAddImage(imageUrl);
                showSuccess('Image added successfully');

                // Reset the file input
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }

            endTiming({ status: 'success', size: file.size });
        } catch (error) {
            showError(`Failed to add image: ${error.message}`);
            endTiming({ status: 'error', message: error.message });
        } finally {
            setIsUploading(false);
        }
    }, [onAddImage, processImageFile, showError, showSuccess, trackOperation]);

    // Handle image property changes
    const handlePropertyChange = useCallback((property, value) => {
        setImageProps(prev => ({ ...prev, [property]: value }));

        if (property === 'brightness' || property === 'contrast') {
            // For filter properties, we need special handling
            onUpdate('filter', { type: property, value });
        } else {
            // For regular properties
            onUpdate(property, value);
        }
    }, [onUpdate]);

    // Toggle flip
    const toggleFlip = useCallback((axis) => {
        const property = axis === 'x' ? 'flipX' : 'flipY';
        const newValue = !imageProps[property];
        handlePropertyChange(property, newValue);
    }, [handlePropertyChange, imageProps]);

    // Handle image click from library
    const handleLibraryImageClick = useCallback((src) => {
        onAddImage(src);
    }, [onAddImage]);

    // Open file dialog when button is clicked
    const handleUploadButtonClick = useCallback(() => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    }, []);

    // Display library images
    const libraryImages = [
        '/assets/images/icons/t-shirt-icon.png',
        '/assets/images/icons/heart-icon.png',
        '/assets/images/icons/star-icon.png',
        '/assets/images/icons/smile-icon.png',
        '/assets/images/icons/music-icon.png'
    ];

    // If no image object is selected, show upload options
    if (!isImageSelected) {
        return (
            <div className="image-controls">
                <div className="upload-section">
                    <h4>Add Image</h4>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="file-input"
                        disabled={isUploading}
                    />
                    <button
                        className="btn btn-primary"
                        onClick={handleUploadButtonClick}
                        disabled={isUploading}
                    >
                        {isUploading ? 'Uploading...' : 'Upload Image'}
                    </button>
                </div>

                <div className="library-section">
                    <h4>Image Library</h4>
                    <div className="image-grid">
                        {libraryImages.map((src, index) => (
                            <div
                                key={index}
                                className="library-image"
                                onClick={() => handleLibraryImageClick(src)}
                            >
                                <img src={src} alt={`Library image ${index + 1}`} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // If an image is selected, show editing controls
    return (
        <div className="image-controls">
            <div className="control-group">
                <label htmlFor="imageOpacity">Opacity</label>
                <input
                    id="imageOpacity"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={imageProps.opacity}
                    onChange={(e) => handlePropertyChange('opacity', parseFloat(e.target.value))}
                    className="form-control"
                />
                <span className="value-display">{Math.round(imageProps.opacity * 100)}%</span>
            </div>

            <div className="control-group">
                <label htmlFor="imageBrightness">Brightness</label>
                <input
                    id="imageBrightness"
                    type="range"
                    min="-1"
                    max="1"
                    step="0.01"
                    value={imageProps.brightness}
                    onChange={(e) => handlePropertyChange('brightness', parseFloat(e.target.value))}
                    className="form-control"
                />
                <span className="value-display">{Math.round(imageProps.brightness * 100)}%</span>
            </div>

            <div className="control-group">
                <label htmlFor="imageContrast">Contrast</label>
                <input
                    id="imageContrast"
                    type="range"
                    min="-1"
                    max="1"
                    step="0.01"
                    value={imageProps.contrast}
                    onChange={(e) => handlePropertyChange('contrast', parseFloat(e.target.value))}
                    className="form-control"
                />
                <span className="value-display">{Math.round(imageProps.contrast * 100)}%</span>
            </div>

            <div className="control-group">
                <label>Flip</label>
                <div className="button-group">
                    <button
                        className={`flip-button ${imageProps.flipX ? 'active' : ''}`}
                        onClick={() => toggleFlip('x')}
                        aria-label="Flip Horizontally"
                        title="Flip Horizontally"
                    >
                        ↔
                    </button>
                    <button
                        className={`flip-button ${imageProps.flipY ? 'active' : ''}`}
                        onClick={() => toggleFlip('y')}
                        aria-label="Flip Vertically"
                        title="Flip Vertically"
                    >
                        ↕
                    </button>
                </div>
            </div>
        </div>
    );
};

ImageControls.propTypes = {
    selectedObject: PropTypes.object,
    onAddImage: PropTypes.func.isRequired,
    onUpdate: PropTypes.func.isRequired
};

// Memoize the component to prevent unnecessary rerenders
export default memo(ImageControls); 