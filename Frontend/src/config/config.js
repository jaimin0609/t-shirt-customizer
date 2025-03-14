// Add Cloudinary configuration to the config file
export const cloudinaryConfig = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dopvs93sl',
  apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY,
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
};

// Helper function to construct Cloudinary URLs
export const getCloudinaryUrl = (publicId, options = {}) => {
  if (!publicId) return null;
  
  const { width, height, crop = 'fill', quality = 'auto' } = options;
  
  // If it's already a full URL, return it
  if (publicId.startsWith('http')) {
    return publicId;
  }
  
  // If it's a relative path with product- prefix, extract the filename
  if (publicId.includes('/product-') || publicId.includes('/images-')) {
    const parts = publicId.split('/');
    publicId = parts[parts.length - 1];
  }
  
  // Build transformation string
  let transformation = `f_auto,q_${quality}`;
  if (width) transformation += `,w_${width}`;
  if (height) transformation += `,h_${height}`;
  if (crop) transformation += `,c_${crop}`;
  
  return `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload/${transformation}/${publicId}`;
}; 