/**
 * Generates the full URL for an image based on the design or image path
 * @param {string} imagePath - The image path or design ID
 * @returns {string} The full image URL
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '/images/placeholder.png';
  
  // If it's already a full URL, return it
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it's a relative path, prepend the API URL or CDN URL
  const baseUrl = process.env.REACT_APP_CDN_URL || process.env.REACT_APP_API_URL || '';
  
  // Remove leading slash if both baseUrl and imagePath have one
  if (baseUrl.endsWith('/') && imagePath.startsWith('/')) {
    return `${baseUrl}${imagePath.substring(1)}`;
  }
  
  // Add slash if neither has one
  if (!baseUrl.endsWith('/') && !imagePath.startsWith('/')) {
    return `${baseUrl}/${imagePath}`;
  }
  
  return `${baseUrl}${imagePath}`;
}; 