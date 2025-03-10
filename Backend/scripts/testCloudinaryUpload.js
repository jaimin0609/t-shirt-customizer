// Use ESM syntax
import { uploadImage, getImageUrl } from '../config/cloudinary.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Initialize environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Function to test Cloudinary upload
async function testCloudinaryUpload() {
    try {
        console.log('Testing Cloudinary integration...');
        
        // Get Cloudinary configuration from environment
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;
        
        console.log('Cloudinary Configuration:');
        console.log(`Cloud Name: ${cloudName}`);
        console.log(`API Key: ${apiKey ? '✓ Set' : '✗ Not Set'}`);
        console.log(`API Secret: ${apiSecret ? '✓ Set' : '✗ Not Set'}`);
        
        if (!cloudName || !apiKey || !apiSecret) {
            console.error('Error: Missing Cloudinary credentials in .env file');
            console.error('Please add the following to your .env file:');
            console.error('CLOUDINARY_CLOUD_NAME=your_cloud_name');
            console.error('CLOUDINARY_API_KEY=your_api_key');
            console.error('CLOUDINARY_API_SECRET=your_api_secret');
            return;
        }
        
        // Test direct upload function with a sample image URL
        console.log('\nTesting with sample image from URL...');
        const sampleImageUrl = 'https://picsum.photos/200';
        
        console.log(`Uploading image from: ${sampleImageUrl}`);
        const result = await uploadImage(sampleImageUrl);
        
        console.log('Upload successful!');
        console.log('Cloudinary secure URL:', result);
        
        // Test getImageUrl function
        const publicId = result.split('/').pop().split('.')[0];
        console.log('Public ID:', publicId);
        const transformedUrl = getImageUrl(publicId);
        console.log('Transformed URL:', transformedUrl);
        
        console.log('\nCloudinary integration test completed successfully!');
    } catch (error) {
        console.error('Error testing Cloudinary integration:', error);
    }
}

// Run the test
testCloudinaryUpload(); 