// Test Cloudinary using the URL string approach
import { v2 as cloudinary } from 'cloudinary';

// The URL from the Cloudinary dashboard
const cloudinaryUrl = 'cloudinary://718734228757155:yXiUCqjRnc7zBk1kqlJHpc8e8qA@dopvs93sl';

// Extract parameters from the URL
const match = cloudinaryUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);

if (match) {
    const apiKey = match[1];
    const apiSecret = match[2];
    const cloudName = match[3];
    
    console.log('Extracted credentials from URL:');
    console.log('Cloud name:', cloudName);
    console.log('API key:', apiKey);
    console.log('API secret (masked):', '*'.repeat(apiSecret.length));
    
    // Configure with extracted credentials
    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret
    });
    
    async function testCloudinary() {
        try {
            console.log('\nTesting Cloudinary connection...');
            
            // Try a simple ping test first
            console.log('Checking API connection...');
            const pingResult = await cloudinary.api.ping();
            console.log('Ping result:', pingResult);
            
            // Try to list resource types
            console.log('\nListing resource types...');
            const resourceTypes = await cloudinary.api.resource_types();
            console.log('Resource types:', resourceTypes);
            
            console.log('\nCloudinary connection successful!');
        } catch (error) {
            console.error('Cloudinary test failed:', error);
            
            // Log detailed error information
            if (error.error && error.error.message) {
                console.error('Error message:', error.error.message);
            }
        }
    }
    
    testCloudinary();
} else {
    console.error('Invalid Cloudinary URL format');
} 