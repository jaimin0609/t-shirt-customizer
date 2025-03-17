# Cloudinary Setup Guide

This guide explains how to set up your Cloudinary credentials correctly for your T-Shirt Customizer application, both locally and in deployment environments.

## 1. Get Fresh Cloudinary Credentials

1. Log into your [Cloudinary Console](https://cloudinary.com/console)
2. Navigate to **Dashboard**
3. Copy these credentials:
   - **Cloud Name**
   - **API Key**
   - **API Secret**
4. Optionally, create an **Upload Preset** if you want to allow direct frontend uploads:
   - Go to Settings > Upload
   - Scroll to "Upload presets"
   - Create a new preset with "Unsigned" mode for frontend use

## 2. Update Local Environment Files

### Backend (.env)

1. Open `Backend/.env`
2. Replace these values with your new credentials:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

### Frontend (.env and .env.production)

1. Open `Frontend/.env` (development) and `Frontend/.env.production`
2. Replace these values in BOTH files:
   ```
   VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   VITE_CLOUDINARY_API_KEY=your_cloudinary_api_key
   VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
   VITE_CLOUDINARY_URL_PREFIX=https://res.cloudinary.com/your_cloudinary_cloud_name
   ```

### Admin Panel (config.js)

1. Open `Backend/public/admin/js/config.js`
2. Replace the cloud name:
   ```javascript
   window.CLOUDINARY_CLOUD_NAME = window.CLOUDINARY_CLOUD_NAME || 'your_cloudinary_cloud_name';
   ```

## 3. Set Up Deployment Environment Variables

### Render (Backend)

1. Log into your [Render Dashboard](https://dashboard.render.com/)
2. Select your backend service
3. Go to **Environment**
4. Add these environment variables:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET` 
5. Make sure these match exactly what you set in your local `.env` file
6. Click **Save Changes**
7. Redeploy your service to apply the changes

### Vercel (Frontend)

1. Log into your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your frontend project
3. Go to **Settings > Environment Variables**
4. Add these environment variables:
   - `VITE_CLOUDINARY_CLOUD_NAME`
   - `VITE_CLOUDINARY_API_KEY`
   - `VITE_CLOUDINARY_UPLOAD_PRESET`
   - `VITE_CLOUDINARY_URL_PREFIX`
5. Make sure to add them to all environments (Production, Preview, Development)
6. Click **Save**
7. Redeploy your frontend to apply the changes

## 4. Test Cloudinary Connection

1. Run the test script locally to verify your credentials:
   ```
   cd Backend
   node scripts/testCloudinary.js
   ```
2. You should see a successful ping and the test image upload should work

## Troubleshooting

If you continue to experience issues:

1. Check browser console for specific error messages
2. Verify that environment variables are properly set in both development and production
3. Ensure your Cloudinary plan is active and has not expired
4. Check that your API key has not been revoked (regenerate if needed)
5. Confirm that your upload preset is properly configured if using frontend uploads

## Important Notes

- Never commit your actual API keys and secrets to Git
- The `.env` files in the repository should have placeholder values
- Your production values should only exist in your Render and Vercel dashboards
- If you regenerate API keys in Cloudinary, you must update them in all environments 