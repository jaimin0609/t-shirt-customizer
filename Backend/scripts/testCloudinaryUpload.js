// Use ESM syntax
import { cloudinary } from '../config/cloudinary.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import path from 'path';

// Initialize environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Function to test Cloudinary configuration
async function testCloudinaryConfig() {
    try {
        console.log('Testing Cloudinary configuration...');
        
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
        
        // Test the Cloudinary configuration by retrieving account info
        console.log('\nTesting Cloudinary API connection...');
        const accountInfo = await cloudinary.api.ping();
        console.log('Cloudinary API connection successful:', accountInfo);
        
        console.log('\nCloudinary configuration test completed successfully!');
        return true;
    } catch (error) {
        console.error('Error testing Cloudinary configuration:', error);
        return false;
    }
}

// Run the test
testCloudinaryConfig(); 