/**
 * Image Optimization Utility
 * 
 * This utility provides functions for optimizing image loading, processing,
 * and display throughout the application.
 */

/**
 * Generates responsive image URLs for different viewport sizes
 * 
 * @param {string} imagePath - Original image path
 * @param {Object} options - Configuration options
 * @param {Array<number>} options.sizes - Array of widths in pixels
 * @param {string} options.format - Image format (webp, avif, jpg, etc.)
 * @param {number} options.quality - Image quality (1-100)
 * @returns {Object} Object with srcSet and sizes attributes
 */
export const getResponsiveImageSrc = (imagePath, options = {}) => {
  const {
    sizes = [320, 640, 960, 1280, 1920],
    format = 'webp',
    quality = 80
  } = options;

  // For production, we would use a real image service like Cloudinary, Imgix, etc.
  // For this example, we'll simulate it with a URL pattern
  const generateUrl = (path, width, format, quality) => {
    // In production, replace this with actual image service URL
    // Example for Cloudinary: return `https://res.cloudinary.com/your-cloud/image/upload/w_${width},q_${quality}/${path}.${format}`;
    
    // For our demo, we'll use a simulated URL structure
    const basePath = path.replace(/\.[^.]+$/, ''); // Remove extension
    return `${basePath}_w${width}_q${quality}.${format}`;
  };

  // Generate srcSet attribute
  const srcSet = sizes.map(size => 
    `${generateUrl(imagePath, size, format, quality)} ${size}w`
  ).join(', ');

  // Generate sizes attribute based on viewport width
  const sizesAttr = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

  return {
    srcSet,
    sizes: sizesAttr,
    src: generateUrl(imagePath, sizes[Math.floor(sizes.length / 2)], format, quality),
    type: `image/${format}`
  };
};

/**
 * Creates a progressive/blur-up image loading experience
 * 
 * @param {string} imagePath - Path to the full-size image
 * @returns {Object} Object with placeholder and src
 */
export const getProgressiveImageProps = (imagePath) => {
  // Create a tiny placeholder (in production, this would be a real tiny image)
  // This could use a real tiny image generation service or data URI
  const placeholder = `${imagePath.replace(/\.[^.]+$/, '')}_tiny.jpg`;
  
  return {
    placeholder,
    src: imagePath,
    loading: 'lazy',
    onLoad: 'this.classList.add("loaded")'
  };
};

/**
 * Lazy load image component properties
 * 
 * @param {string} src - Image source
 * @param {string} alt - Image alt text
 * @param {Object} options - Additional options
 * @returns {Object} Props for a lazy-loaded image
 */
export const getLazyImageProps = (src, alt, options = {}) => {
  return {
    src,
    alt,
    loading: 'lazy',
    decoding: 'async',
    ...options
  };
};

/**
 * Determines if WebP format is supported by the browser
 * 
 * @returns {Promise<boolean>} Promise that resolves to true if WebP is supported
 */
export const supportsWebp = async () => {
  if (!self.createImageBitmap) return false;
  
  const webpData = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
  const blob = await fetch(webpData).then(r => r.blob());
  
  try {
    return createImageBitmap(blob).then(() => true, () => false);
  } catch (e) {
    return false;
  }
};

/**
 * Determines if AVIF format is supported by the browser
 * 
 * @returns {Promise<boolean>} Promise that resolves to true if AVIF is supported
 */
export const supportsAvif = async () => {
  if (!self.createImageBitmap) return false;
  
  const avifData = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  const blob = await fetch(avifData).then(r => r.blob());
  
  try {
    return createImageBitmap(blob).then(() => true, () => false);
  } catch (e) {
    return false;
  }
};

/**
 * Get the best supported image format for the current browser
 * 
 * @returns {Promise<string>} The best supported format (avif, webp, or jpg)
 */
export const getBestImageFormat = async () => {
  if (await supportsAvif()) return 'avif';
  if (await supportsWebp()) return 'webp';
  return 'jpg';
};

/**
 * Helper to add proper width and height attributes to prevent layout shifts
 * 
 * @param {string} src - Image source
 * @param {Object} dimensions - Width and height
 * @returns {Promise<Object>} Object with width and height properties
 */
export const getImageDimensions = async (src, dimensions = null) => {
  // If dimensions are provided, use them
  if (dimensions && dimensions.width && dimensions.height) {
    return dimensions;
  }
  
  // In a real implementation, this could use an image metadata service
  // For now, we'll return a placeholder promise that would typically
  // load the image and return its dimensions
  return new Promise((resolve) => {
    // In production, actually load the image and get dimensions
    // const img = new Image();
    // img.onload = () => resolve({ width: img.width, height: img.height });
    // img.src = src;
    
    // For demo purposes, we'll return placeholder dimensions
    setTimeout(() => {
      resolve({ width: 800, height: 600 });
    }, 10);
  });
};

/**
 * Calculate the ideal size for an image based on its container
 * 
 * @param {HTMLElement} container - The container element
 * @param {number} aspectRatio - The image aspect ratio (width/height)
 * @returns {Object} Object with width and height
 */
export const calculateIdealImageSize = (container, aspectRatio = 4/3) => {
  if (!container) return { width: 800, height: 600 };
  
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  
  // If we have both dimensions, use them to calculate
  if (containerWidth && containerHeight) {
    const containerRatio = containerWidth / containerHeight;
    
    if (containerRatio > aspectRatio) {
      // Container is wider than image
      return {
        width: Math.round(containerHeight * aspectRatio),
        height: containerHeight
      };
    } else {
      // Container is taller than image
      return {
        width: containerWidth,
        height: Math.round(containerWidth / aspectRatio)
      };
    }
  }
  
  // If we only have width, calculate height based on aspect ratio
  if (containerWidth) {
    return {
      width: containerWidth,
      height: Math.round(containerWidth / aspectRatio)
    };
  }
  
  // Default fallback
  return { width: 800, height: 600 };
};

/**
 * Centralized image error handler
 * 
 * @param {Event} event - The error event
 * @param {string} fallbackSrc - Fallback image source
 */
export const handleImageError = (event, fallbackSrc = '/images/placeholder.jpg') => {
  console.error('Image failed to load:', event.target.src);
  
  if (event.target.src !== fallbackSrc) {
    event.target.src = fallbackSrc;
    event.target.setAttribute('data-error', 'true');
  }
};

// Export default object with all functions
export default {
  getResponsiveImageSrc,
  getProgressiveImageProps,
  getLazyImageProps,
  supportsWebp,
  supportsAvif,
  getBestImageFormat,
  getImageDimensions,
  calculateIdealImageSize,
  handleImageError
}; 