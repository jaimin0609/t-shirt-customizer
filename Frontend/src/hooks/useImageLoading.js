import { useState, useEffect } from 'react';

/**
 * Custom hook for optimized image loading with preloading capabilities
 * 
 * @param {string|Array} src - Image URL or array of image URLs to load
 * @param {Object} options - Configuration options
 * @param {boolean} options.preload - Whether to preload the image(s)
 * @param {boolean} options.lowQualityPlaceholder - Whether to generate a low-quality placeholder
 * @param {number} options.threshold - Intersection observer threshold (0-1)
 * @param {string} options.rootMargin - Intersection observer root margin
 * @param {Function} options.onLoad - Callback when image loads
 * @param {Function} options.onError - Callback when image fails to load
 * @returns {Object} Image loading state and reference
 */
function useImageLoading(src, options = {}) {
  const {
    preload = false,
    lowQualityPlaceholder = false,
    threshold = 0.1,
    rootMargin = '200px 0px',
    onLoad,
    onError,
  } = options;

  // Define state for tracking loading status
  const [loadingStatus, setLoadingStatus] = useState({
    isLoading: true,
    isLoaded: false,
    error: null,
    placeholderUrl: null,
  });
  
  // Create ref for the element to observe
  const [elementRef, setElementRef] = useState(null);

  // Process a single image url
  const processImage = (imageUrl) => {
    if (!imageUrl) {
      setLoadingStatus({
        isLoading: false,
        isLoaded: false,
        error: new Error('Invalid image URL'),
        placeholderUrl: null,
      });
      return;
    }

    const img = new Image();
    
    img.onload = () => {
      setLoadingStatus({
        isLoading: false,
        isLoaded: true,
        error: null,
        placeholderUrl: loadingStatus.placeholderUrl,
      });
      if (onLoad) onLoad(imageUrl);
    };
    
    img.onerror = (error) => {
      setLoadingStatus({
        isLoading: false,
        isLoaded: false,
        error: new Error(`Failed to load image: ${imageUrl}`),
        placeholderUrl: loadingStatus.placeholderUrl,
      });
      if (onError) onError(error);
    };
    
    img.src = imageUrl;
  };

  // Generate a low quality placeholder for the image
  const generatePlaceholder = async (imageUrl) => {
    if (!lowQualityPlaceholder || !imageUrl) return;
    
    // Simple base64 placeholder (in a real app, you might want to use a server-side solution)
    // This is just a fallback that creates a colored rectangle
    try {
      const placeholderColor = await getAverageColor(imageUrl);
      const placeholder = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect width='1' height='1' fill='${encodeURIComponent(placeholderColor)}'/%3E%3C/svg%3E`;
      
      setLoadingStatus(prev => ({
        ...prev,
        placeholderUrl: placeholder
      }));
    } catch (error) {
      console.error('Error generating placeholder:', error);
    }
  };

  // Helper to get average color from an image
  const getAverageColor = (imageUrl) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 1;
        canvas.height = 1;
        
        context.drawImage(img, 0, 0, 1, 1);
        const pixelData = context.getImageData(0, 0, 1, 1).data;
        
        const color = `rgb(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]})`;
        resolve(color);
      };
      
      img.onerror = () => {
        resolve('#e2e8f0'); // Default light gray color
      };
      
      // Use a proxy or CORS-enabled image
      img.src = imageUrl;
    });
  };

  // Effect for intersection observer (lazy loading)
  useEffect(() => {
    if (!src || preload) return;
    
    let observer;
    let canceled = false;
    
    if (elementRef) {
      observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          
          if (entry.isIntersecting && !canceled) {
            // Element is in viewport, load the image
            if (Array.isArray(src)) {
              src.forEach(processImage);
            } else {
              processImage(src);
            }
            
            // Unobserve after loading starts
            if (observer && elementRef) {
              observer.unobserve(elementRef);
            }
          }
        },
        { threshold, rootMargin }
      );
      
      observer.observe(elementRef);
    }
    
    return () => {
      canceled = true;
      if (observer && elementRef) {
        observer.unobserve(elementRef);
        observer.disconnect();
      }
    };
  }, [src, elementRef, preload, threshold, rootMargin]);

  // Effect for preloading
  useEffect(() => {
    if (!src || !preload) return;
    
    const handlePreload = () => {
      if (Array.isArray(src)) {
        src.forEach(processImage);
      } else {
        processImage(src);
      }
    };
    
    handlePreload();
  }, [src, preload]);

  // Effect for placeholder generation
  useEffect(() => {
    if (!src || !lowQualityPlaceholder) return;
    
    const url = Array.isArray(src) ? src[0] : src;
    generatePlaceholder(url);
  }, [src, lowQualityPlaceholder]);

  return {
    ...loadingStatus,
    ref: setElementRef,
    
    // Helper function to preload additional images
    preloadImages: (imagesToPreload) => {
      if (Array.isArray(imagesToPreload)) {
        imagesToPreload.forEach(processImage);
      } else if (typeof imagesToPreload === 'string') {
        processImage(imagesToPreload);
      }
    }
  };
}

export default useImageLoading; 