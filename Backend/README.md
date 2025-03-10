## Cloudinary Integration

The project now uses Cloudinary for image hosting. This provides several benefits:

1. **Reliable Image Storage**: Images are stored on Cloudinary's servers rather than locally.
2. **Image Transformations**: Cloudinary provides on-the-fly image resizing, cropping, and other transformations.
3. **CDN Delivery**: Images are served from Cloudinary's global CDN for faster loading.
4. **No Server Storage Issues**: Eliminates the need to manage image storage on the server.

### Setup

1. Sign up for a free Cloudinary account at https://cloudinary.com/
2. Add your Cloudinary credentials to the `.env` file:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

### Usage

The application now handles image uploads through Cloudinary. All product images will be stored in Cloudinary and served directly from their CDN.

To seed the database with sample products using Cloudinary images, run:

```
node scripts/sampleCloudinaryProducts.js
```

### Implementation Details

- Configuration: `Backend/config/cloudinary.js` contains the Cloudinary setup
- Image Upload: Product routes in `Backend/routes/products.routes.js` handle image uploads to Cloudinary
- Frontend: The frontend components have been updated to handle Cloudinary URLs 