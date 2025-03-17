import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import imageOptimizer from '../../utils/imageOptimizer';

/**
 * OptimizedImage Component
 * 
 * A performance-optimized image component that implements:
 * - Responsive images with proper srcSet
 * - Lazy loading
 * - Progressive loading with blur-up effect
 * - WebP/AVIF format detection and usage
 * - Prevents layout shifts
 * - Error handling with fallbacks
 */
const OptimizedImage = ({
    src,
    alt,
    width,
    height,
    className = '',
    style = {},
    sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
    fit = 'cover',
    quality = 80,
    priority = false,
    placeholder = true,
    fallbackSrc = '/images/placeholder.jpg',
    onLoad,
    onError,
    ...props
}) => {
    const [loaded, setLoaded] = useState(false);
    const [bestFormat, setBestFormat] = useState('webp');
    const [imgSrc, setImgSrc] = useState(src);
    const [error, setError] = useState(false);
    const imgRef = useRef(null);
    const containerRef = useRef(null);

    // Determine the best format on mount
    useEffect(() => {
        const checkFormat = async () => {
            const format = await imageOptimizer.getBestImageFormat();
            setBestFormat(format);
        };

        checkFormat();
    }, []);

    // Generate responsive image sources
    useEffect(() => {
        if (!src) return;

        // Reset states when src changes
        setLoaded(false);
        setError(false);

        // Use our image optimizer to get responsive image sources
        const responsiveProps = imageOptimizer.getResponsiveImageSrc(src, {
            format: bestFormat,
            quality,
            sizes: [320, 640, 960, 1280, 1920]
        });

        setImgSrc(responsiveProps.src);
    }, [src, bestFormat, quality]);

    // Handle loading
    const handleLoad = (e) => {
        setLoaded(true);
        if (onLoad) onLoad(e);
    };

    // Handle errors
    const handleError = (e) => {
        if (!error) {
            setError(true);
            setImgSrc(fallbackSrc);
            console.error(`Error loading image: ${src}`);
            if (onError) onError(e);
        }
    };

    // Calculate styles including blur-up effect
    const imageStyles = {
        objectFit: fit,
        transition: 'filter 0.3s ease-out, opacity 0.3s ease-out',
        filter: loaded ? 'blur(0)' : 'blur(10px)',
        opacity: loaded ? 1 : 0.6,
        width: width || '100%',
        height: height || 'auto',
        ...style
    };

    // Create class name including loaded state
    const imageClass = `optimized-image ${loaded ? 'loaded' : 'loading'} ${error ? 'error' : ''} ${className}`.trim();

    // Determine loading attribute based on priority
    const loadingAttr = priority ? 'eager' : 'lazy';

    // Generate responsive sources
    const generateSources = () => {
        // Only generate sources if not in error state
        if (error) return null;

        const formats = ['avif', 'webp'];
        return formats.map(format => {
            const { srcSet, sizes: sizesAttr } = imageOptimizer.getResponsiveImageSrc(src, {
                format,
                quality
            });

            return (
                <source
                    key={format}
                    type={`image/${format}`}
                    srcSet={srcSet}
                    sizes={sizes || sizesAttr}
                />
            );
        });
    };

    // Handle placeholder/blur-up effect
    const renderPlaceholder = () => {
        if (!placeholder || loaded) return null;

        // In a real implementation, this would use a tiny base64 placeholder
        // or a very small version of the image
        const placeholderStyle = {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            filter: 'blur(20px)',
            transform: 'scale(1.1)', // Slightly larger to prevent edge artifacts
            opacity: loaded ? 0 : 0.5,
            transition: 'opacity 0.3s ease-out',
            zIndex: 1
        };

        return (
            <div
                className="image-placeholder"
                style={placeholderStyle}
                aria-hidden="true"
            />
        );
    };

    return (
        <div
            ref={containerRef}
            className={`optimized-image-container ${loaded ? 'loaded' : 'loading'}`}
            style={{
                position: 'relative',
                overflow: 'hidden',
                width: width || '100%',
                height: height || 'auto',
            }}
        >
            {renderPlaceholder()}
            <picture>
                {generateSources()}
                <img
                    ref={imgRef}
                    src={imgSrc}
                    alt={alt}
                    className={imageClass}
                    style={imageStyles}
                    width={width}
                    height={height}
                    loading={loadingAttr}
                    decoding="async"
                    onLoad={handleLoad}
                    onError={handleError}
                    {...props}
                />
            </picture>

            {/* ARIA live region for error notifications for screen readers */}
            {error && (
                <div className="sr-only" role="alert" aria-live="polite">
                    Image failed to load. Displaying fallback image.
                </div>
            )}
        </div>
    );
};

OptimizedImage.propTypes = {
    /** Image source URL */
    src: PropTypes.string.isRequired,
    /** Alt text for accessibility */
    alt: PropTypes.string.isRequired,
    /** Optional explicit width */
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    /** Optional explicit height */
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    /** Additional CSS classes */
    className: PropTypes.string,
    /** Inline styles object */
    style: PropTypes.object,
    /** The sizes attribute for responsive images */
    sizes: PropTypes.string,
    /** Object-fit property */
    fit: PropTypes.oneOf(['cover', 'contain', 'fill', 'none', 'scale-down']),
    /** Image quality (1-100) */
    quality: PropTypes.number,
    /** Whether the image should be prioritized (disables lazy loading) */
    priority: PropTypes.bool,
    /** Whether to show a placeholder during loading */
    placeholder: PropTypes.bool,
    /** Fallback image source for errors */
    fallbackSrc: PropTypes.string,
    /** On load callback */
    onLoad: PropTypes.func,
    /** On error callback */
    onError: PropTypes.func
};

export default OptimizedImage; 