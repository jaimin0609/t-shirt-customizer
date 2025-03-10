// Script to upload placeholder images to Cloudinary
import { cloudinary } from '../config/cloudinary.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

// Initialize environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// List of placeholder images to upload
const placeholderImages = [
    {
        name: 'placeholder-tshirt-white',
        url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80'
    },
    {
        name: 'placeholder-hoodie-black',
        url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80'
    },
    {
        name: 'placeholder-polo-blue',
        url: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800&q=80'
    },
    {
        name: 'placeholder-kids-tshirt',
        url: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800&q=80'
    },
    {
        name: 'placeholder-womens-vneck',
        url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&q=80'
    },
    {
        name: 'placeholder-product',
        url: 'https://images.unsplash.com/photo-1588117305388-c2631a279f82?w=800&q=80'
    }
];

// Function to download an image from URL
async function downloadImage(url, outputPath) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        
        const buffer = await response.buffer();
        fs.writeFileSync(outputPath, buffer);
        
        return outputPath;
    } catch (error) {
        console.error(`Error downloading image from ${url}:`, error);
        throw error;
    }
}

// Function to upload an image to Cloudinary
async function uploadToCloudinary(imagePath, publicId) {
    try {
        console.log(`Uploading ${imagePath} to Cloudinary as ${publicId}...`);
        
        const uploadResult = await cloudinary.uploader.upload(imagePath, {
            folder: 'tshirt-customizer',
            public_id: publicId,
            overwrite: true,
            resource_type: 'image'
        });
        
        console.log(`✅ Uploaded successfully! URL: ${uploadResult.secure_url}`);
        return uploadResult.secure_url;
    } catch (error) {
        console.error(`❌ Error uploading to Cloudinary:`, error);
        throw error;
    }
}

// Main function to upload all placeholder images
async function uploadPlaceholders() {
    try {
        console.log('Checking Cloudinary configuration...');
        await cloudinary.api.ping();
        console.log('✅ Cloudinary is properly configured!');
        
        console.log('\nStarting to upload placeholder images...');
        
        // Create temp directory if it doesn't exist
        const tempDir = join(__dirname, 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }
        
        const results = [];
        
        // Process each placeholder image
        for (const placeholder of placeholderImages) {
            try {
                console.log(`\nProcessing ${placeholder.name}...`);
                
                // Download the image
                const tempPath = join(tempDir, `${placeholder.name}.jpg`);
                await downloadImage(placeholder.url, tempPath);
                
                // Upload to Cloudinary
                const cloudinaryUrl = await uploadToCloudinary(tempPath, placeholder.name);
                
                // Clean up temp file
                fs.unlinkSync(tempPath);
                
                results.push({
                    name: placeholder.name,
                    url: cloudinaryUrl,
                    success: true
                });
            } catch (error) {
                console.error(`Failed to process ${placeholder.name}:`, error.message);
                results.push({
                    name: placeholder.name,
                    error: error.message,
                    success: false
                });
            }
        }
        
        // Clean up temp directory
        if (fs.existsSync(tempDir)) {
            fs.rmdirSync(tempDir);
        }
        
        // Report results
        console.log('\nUpload Results:');
        results.forEach(result => {
            if (result.success) {
                console.log(`✅ ${result.name}: ${result.url}`);
            } else {
                console.log(`❌ ${result.name}: ${result.error}`);
            }
        });
        
        console.log('\nPlaceholder images upload completed!');
    } catch (error) {
        console.error('Error uploading placeholder images:', error);
    }
}

// Run the script
uploadPlaceholders().then(() => {
    console.log('Script execution completed');
    process.exit(0);
}).catch(error => {
    console.error('Script execution failed:', error);
    process.exit(1);
}); 