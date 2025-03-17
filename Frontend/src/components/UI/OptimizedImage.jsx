import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import imageOptimizer from '../../utils/imageOptimizer';

// Cache for already loaded images
const imageCache = new Set();

// Helper to generate a low-quality placeholder
const generateLowQualityPlaceholder = (src) => {
    // In a real implementation, this would call an API to get a tiny version
    // For now, we'll just use a simple placeholder
    return `${src}?w=20&q=10`;
};

/**
 * OptimizedImage Component
 * 
 * A highly performance-optimized image component that implements:
 * - Responsive images with proper srcSet
 * - Intersection Observer based lazy loading
 * - Progressive loading with blur-up effect
 * - WebP/AVIF format detection and usage
 * - Prevents layout shifts with aspect ratio preservation
 * - Error handling with fallbacks
 * - Image preloading for priority images
 * - In-memory caching for repeat images
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
    threshold = 0.1, // Intersection observer threshold
    rootMargin = '200px', // Load images 200px before they enter viewport
    ...props
}) => {
    const [loaded, setLoaded] = useState(imageCache.has(src));
    const [visible, setVisible] = useState(priority);
    const [bestFormat, setBestFormat] = useState(null);
    const [imgSrc, setImgSrc] = useState(priority ? src : null);
    const [error, setError] = useState(false);
    const [placeholderSrc, setPlaceholderSrc] = useState('');
    const imgRef = useRef(null);
    const observerRef = useRef(null);
    const containerRef = useRef(null);
    const aspectRatio = useRef(null);

    // Calculate a fixed aspect ratio if both width and height are provided
    if (width && height && typeof width === 'number' && typeof height === 'number') {
        aspectRatio.current = (height / width).toFixed(4);
    }

    // Set up image load when it becomes visible
    const loadImage = useCallback(() => {
        if (!imgSrc && visible && src) {
            // Generate responsive image sources when visible
            const responsiveProps = imageOptimizer.getResponsiveImageSrc(src, {
                format: bestFormat || 'webp',
                quality,
                sizes: [320, 640, 960, 1280, 1920]
            });
            setImgSrc(responsiveProps.src);
        }
    }, [src, imgSrc, visible, bestFormat, quality]);

    // Determine the best format on mount
    useEffect(() => {
        const checkFormat = async () => {
            const format = await imageOptimizer.getBestImageFormat();
            setBestFormat(format);
        };

        checkFormat();

        // Generate placeholder immediately
        if (placeholder && src) {
            setPlaceholderSrc(generateLowQualityPlaceholder(src));
        }

        // Preload if priority
        if (priority && src) {
            const img = new Image();
            img.src = src;
        }

        return () => {
            // Clean up observer
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, []);

    // Set up intersection observer
    useEffect(() => {
        if (!priority && imgRef.current && !loaded) {
            const options = {
                root: null, // Use viewport as root
                rootMargin, // Load images X pixels before they enter viewport
                threshold // Percentage of image visibility to trigger loading
            };

            const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    setVisible(true);
                    // Disconnect after triggering
                    observer.disconnect();
                }
            }, options);

            observer.observe(imgRef.current);
            observerRef.current = observer;

            return () => {
                if (observerRef.current) {
                    observerRef.current.disconnect();
                }
            };
        }
    }, [priority, loaded, rootMargin, threshold]);

    // Trigger image load when visibility changes
    useEffect(() => {
        loadImage();
    }, [visible, bestFormat, loadImage]);

    // Reset states when src changes
    useEffect(() => {
        if (!src) return;

        setLoaded(imageCache.has(src));
        setError(false);

        if (!visible && !priority) {
            setImgSrc(null); // Reset source until visible
        } else {
            // Generate responsive image sources
            const responsiveProps = imageOptimizer.getResponsiveImageSrc(src, {
                format: bestFormat || 'webp',
                quality,
                sizes: [320, 640, 960, 1280, 1920]
            });
            setImgSrc(responsiveProps.src);
        }

        // Reset placeholder when src changes
        if (placeholder) {
            setPlaceholderSrc(generateLowQualityPlaceholder(src));
        }
    }, [src, bestFormat, quality, priority, visible, placeholder]);

    // Handle successful loading
    const handleLoad = (e) => {
        if (!loaded) {
            setLoaded(true);
            imageCache.add(src); // Add to cache
            if (onLoad) onLoad(e);
        }
    };

    // Handle loading errors
    const handleError = (e) => {
        if (!error) {
            setError(true);
            setImgSrc(fallbackSrc);
            console.error(`Error loading image: ${src}`);
            if (onError) onError(e);
        }
    };

    // Calculate styles including blur-up effect and aspect ratio
    const containerStyles = {
        position: 'relative',
        overflow: 'hidden',
        width: width || '100%',
        height: height || 'auto',
        // Add padding-top for aspect ratio if we know it and no explicit height
        ...(aspectRatio.current && !height ? {
            height: 0,
            paddingTop: `${aspectRatio.current * 100}%`
        } : {})
    };

    const imageStyles = {
        objectFit: fit,
        transition: 'filter 0.3s ease-out, opacity 0.3s ease-out',
        filter: loaded ? 'blur(0)' : 'blur(10px)',
        opacity: loaded ? 1 : 0.6,
        width: width || '100%',
        height: height || 'auto',
        // For aspect ratio-based sizing
        ...(aspectRatio.current && !height ? {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
        } : {}),
        ...style
    };

    // Create class name including loaded and visibility states
    const imageClass = `optimized-image ${loaded ? 'loaded' : 'loading'} ${visible ? 'visible' : 'not-visible'} ${error ? 'error' : ''} ${className}`.trim();

    // Generate responsive sources
    const generateSources = () => {
        // Only generate sources if not in error state and we have an image source
        if (error || !imgSrc) return null;

        const formats = bestFormat === 'avif'
            ? ['avif', 'webp']
            : bestFormat === 'webp'
                ? ['webp']
                : [];

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
        if (!placeholder || !placeholderSrc || loaded) return null;

        const placeholderStyle = {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            objectFit: fit,
            objectPosition: 'center',
            width: '100%',
            height: '100%',
            filter: 'blur(20px)',
            transform: 'scale(1.1)', // Slightly larger to prevent edge artifacts
            opacity: loaded ? 0 : 0.7,
            transition: 'opacity 0.3s ease-out',
            zIndex: 1
        };

        return (
            <img
                src={placeholderSrc}
                aria-hidden="true"
                alt=""
                className="image-placeholder"
                style={placeholderStyle}
                loading="eager" // Always eager load the tiny placeholder
            />
        );
    };

    return (
        <div
            ref={containerRef}
            className={`optimized-image-container ${loaded ? 'loaded' : 'loading'}`}
            style={containerStyles}
        >
            {renderPlaceholder()}
            <picture>
                {generateSources()}
                <img
                    ref={imgRef}
                    src={imgSrc || (priority ? src : undefined)}
                    alt={alt}
                    className={imageClass}
                    style={imageStyles}
                    width={width}
                    height={height}
                    loading={priority ? 'eager' : 'lazy'} // Use native lazy loading as backup
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
    /** Intersection observer threshold (0-1) */
    threshold: PropTypes.number,
    /** Intersection observer root margin */
    rootMargin: PropTypes.string,
    /** On load callback */
    onLoad: PropTypes.func,
    /** On error callback */
    onError: PropTypes.func
};

export default OptimizedImage; 