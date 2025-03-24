import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Component for displaying product images in a gallery with thumbnail navigation
 * 
 * @param {Object} props - Component properties
 * @param {Array} props.images - Array of image URLs
 * @param {Function} props.getImageUrl - Function to convert image path to full URL
 */
const ProductImageGallery = ({ images, getImageUrl }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isZoomed, setIsZoomed] = useState(false);
    const [loadedImages, setLoadedImages] = useState({});
    const [imageErrors, setImageErrors] = useState({});

    // Handle image loading completion
    const handleImageLoad = (index) => {
        setLoadedImages(prev => ({ ...prev, [index]: true }));
    };

    // Handle image loading errors
    const handleImageError = (index) => {
        setImageErrors(prev => ({ ...prev, [index]: true }));
    };

    // Toggle zoom state for the current image
    const toggleZoom = () => {
        setIsZoomed(!isZoomed);
    };

    // Check if current image is loaded
    const isCurrentImageLoaded = loadedImages[currentImageIndex];
    const hasCurrentImageError = imageErrors[currentImageIndex];

    return (
        <div className="product-gallery w-full md:w-1/2 mb-8 md:mb-0">
            {/* Main Image */}
            <div
                className={`relative overflow-hidden rounded-lg bg-gray-100 mb-4 ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                style={{ height: '400px' }}
                onClick={toggleZoom}
            >
                {!isCurrentImageLoaded && !hasCurrentImageError && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
                    </div>
                )}

                {hasCurrentImageError && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-red-500">Failed to load image</div>
                    </div>
                )}

                {images && images.length > 0 && (
                    <img
                        src={getImageUrl(images[currentImageIndex])}
                        alt={`Product image ${currentImageIndex + 1}`}
                        className={`w-full h-full object-contain transition-transform duration-300 ${isZoomed ? 'scale-150' : 'scale-100'}`}
                        onLoad={() => handleImageLoad(currentImageIndex)}
                        onError={() => handleImageError(currentImageIndex)}
                    />
                )}

                {isZoomed && (
                    <button
                        className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsZoomed(false);
                        }}
                    >
                        <XMarkIcon className="h-6 w-6 text-gray-600" />
                    </button>
                )}
            </div>

            {/* Thumbnails */}
            {images && images.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                    {images.map((image, index) => (
                        <div
                            key={index}
                            className={`rounded-md overflow-hidden cursor-pointer border-2 ${index === currentImageIndex ? 'border-blue-500' : 'border-transparent'
                                }`}
                            onClick={() => setCurrentImageIndex(index)}
                        >
                            <img
                                src={getImageUrl(image)}
                                alt={`Product thumbnail ${index + 1}`}
                                className="w-full h-16 object-cover"
                                onLoad={() => {
                                    // Track thumbnail loading if needed
                                }}
                                onError={() => {
                                    // Track thumbnail errors if needed
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProductImageGallery; 