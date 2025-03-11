// Test Cloudinary using the URL string approach
import cloudinary from 'cloudinary';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Initialize environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Validate environment variables
const requiredVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('Please check your .env file');
  process.exit(1);
}

// Construct URL from environment variables
const cloudinaryUrl = `cloudinary://${process.env.CLOUDINARY_API_KEY}:${process.env.CLOUDINARY_API_SECRET}@${process.env.CLOUDINARY_CLOUD_NAME}`;

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
    
    function testCloudinary() {
        console.log('\nTesting Cloudinary connection...');
        
        // Try a simple ping test first
        console.log('Checking API connection...');
        cloudinary.api.ping((error, pingResult) => {
            if (error) {
                console.error('Cloudinary ping failed:', error);
                return;
            }
            
            console.log('Ping result:', pingResult);
            
            // Try to list resource types
            console.log('\nListing resource types...');
            cloudinary.api.resource_types((error, resourceTypes) => {
                if (error) {
                    console.error('Cloudinary resource types failed:', error);
                    return;
                }
                
                console.log('Resource types:', resourceTypes);
                console.log('\nCloudinary connection successful!');
            });
        });
    }
    
    testCloudinary();
} else {
    console.error('Invalid Cloudinary URL format');
} 