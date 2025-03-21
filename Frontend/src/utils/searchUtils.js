/**
 * Utility functions for product search functionality
 */

/**
 * Generates a "did you mean" suggestion for a search query
 * This is a simple implementation that could be replaced with a more sophisticated algorithm
 * or with backend suggestions in a real application
 * 
 * @param {string} query - The original search query
 * @returns {string} A suggested alternative query
 */
export const generateDidYouMeanSuggestion = (query) => {
  if (!query || query.length < 3) return query;

  // This is a very basic algorithm that just:
  // 1. Removes a random character if query is long enough
  // 2. Fixes basic common typos
  // 3. Corrects casing

  // Common typo corrections (could be expanded)
  const commonTypos = {
    'shitr': 'shirt',
    'tshrit': 't-shirt',
    'hoddie': 'hoodie',
    'panst': 'pants',
    'jaket': 'jacket',
    'sweather': 'sweater',
    'shoe': 'shoes',
    'blak': 'black',
    'wihte': 'white',
    'grene': 'green',
    'blu': 'blue',
    'yelow': 'yellow',
    'purpel': 'purple',
  };

  // Check if query contains any known typos
  let correctedQuery = query.toLowerCase();
  
  Object.entries(commonTypos).forEach(([typo, correction]) => {
    if (correctedQuery.includes(typo)) {
      correctedQuery = correctedQuery.replace(typo, correction);
    }
  });

  // Apply proper capitalization to the beginning of the query
  correctedQuery = correctedQuery.charAt(0).toUpperCase() + correctedQuery.slice(1);

  // Only return the correction if it's different from the original
  return correctedQuery === query ? query : correctedQuery;
};

/**
 * Returns the image URL for a product based on its data structure
 * 
 * @param {Object} product - The product object
 * @returns {string} The URL to the product image
 */
export const getProductImageUrl = (product) => {
  if (!product) {
    return '/assets/placeholder-product.jpg';
  }

  // Handle product with imageUrl field
  if (product.imageUrl) {
    // If it's a full URL or data URL
    if (product.imageUrl.startsWith('http') || product.imageUrl.startsWith('data:')) {
      return product.imageUrl;
    }
    // If it's a path
    return product.imageUrl.startsWith('/') ? product.imageUrl : `/${product.imageUrl}`;
  }

  // Handle product with images array
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    const firstImage = product.images[0];
    
    // If the image is a string (URL)
    if (typeof firstImage === 'string') {
      if (firstImage.startsWith('http') || firstImage.startsWith('data:')) {
        return firstImage;
      }
      return firstImage.startsWith('/') ? firstImage : `/${firstImage}`;
    }
    
    // If the image is an object with url property
    if (firstImage && firstImage.url) {
      if (firstImage.url.startsWith('http') || firstImage.url.startsWith('data:')) {
        return firstImage.url;
      }
      return firstImage.url.startsWith('/') ? firstImage.url : `/${firstImage.url}`;
    }
  }

  // Handle product with image field
  if (product.image) {
    if (typeof product.image === 'string') {
      if (product.image.startsWith('http') || product.image.startsWith('data:')) {
        return product.image;
      }
      return product.image.startsWith('/') ? product.image : `/${product.image}`;
    }
    
    // If image is an object with url property
    if (product.image.url) {
      if (product.image.url.startsWith('http') || product.image.url.startsWith('data:')) {
        return product.image.url;
      }
      return product.image.url.startsWith('/') ? product.image.url : `/${product.image.url}`;
    }
  }

  // Handle products with thumbnails
  if (product.thumbnail) {
    if (product.thumbnail.startsWith('http') || product.thumbnail.startsWith('data:')) {
      return product.thumbnail;
    }
    return product.thumbnail.startsWith('/') ? product.thumbnail : `/${product.thumbnail}`;
  }

  // Default fallback
  return '/assets/placeholder-product.jpg';
};

/**
 * Updates URL search parameters based on filters
 * 
 * @param {Object} filters - Object containing filter values
 * @param {string} searchQuery - The current search query
 * @param {Function} setSearchParams - Function to update search parameters
 */
export const updateSearchParams = (filters, searchQuery, setSearchParams) => {
  const params = new URLSearchParams();
  
  // Add search query if exists
  if (searchQuery) {
    params.set('search', searchQuery);
  }
  
  // Add filter parameters
  if (filters.categories && filters.categories.length) {
    filters.categories.forEach(category => params.append('category', category));
  }
  
  if (filters.genders && filters.genders.length) {
    filters.genders.forEach(gender => params.append('gender', gender));
  }
  
  if (filters.ageGroups && filters.ageGroups.length) {
    filters.ageGroups.forEach(ageGroup => params.append('ageGroup', ageGroup));
  }
  
  // Update URL
  setSearchParams(params);
}; 