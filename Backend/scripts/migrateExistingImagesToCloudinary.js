// Script to migrate existing product images to Cloudinary
import db from '../models/index.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { cloudinary, getCloudinaryUrl } from '../config/cloudinary.js';

// Initialize environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Default placeholder Cloudinary URL
const PLACEHOLDER_URL = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1650052235/tshirt-customizer/placeholder-tshirt-white.jpg`;

// Function to check if Cloudinary is properly configured
async function checkCloudinaryConfig() {
    try {
        console.log('Checking Cloudinary configuration...');
        await cloudinary.api.ping();
        console.log('✅ Cloudinary is properly configured!');
        return true;
    } catch (error) {
        console.error('❌ Cloudinary configuration error:', error.message);
        return false;
    }
}

// Function to migrate product images to Cloudinary
async function migrateProductImages() {
    try {
        // First check if Cloudinary is configured correctly
        const isCloudinaryConfigured = await checkCloudinaryConfig();
        if (!isCloudinaryConfigured) {
            console.warn('⚠️ Proceeding with migration but using placeholder images due to Cloudinary configuration issues');
        }

        // Get all products from the database
        const products = await db.Product.findAll();
        console.log(`Found ${products.length} products in the database`);

        // Counter for tracking migration progress
        let migratedCount = 0;
        let errorCount = 0;

        // Process each product
        for (const product of products) {
            console.log(`\nProcessing product ${product.id}: ${product.name}`);
            
            try {
                // Check current image paths
                console.log('Current image:', product.image);
                console.log('Current images array:', product.images);
                
                // Determine if product already has Cloudinary URLs
                const hasCloudinaryImage = product.image && product.image.includes('cloudinary.com');
                const hasCloudinaryImages = product.images && 
                                          Array.isArray(product.images) && 
                                          product.images.length > 0 && 
                                          product.images[0].includes('cloudinary.com');
                
                if (hasCloudinaryImage && hasCloudinaryImages) {
                    console.log('✅ Product already has Cloudinary URLs, skipping');
                    continue;
                }
                
                // Set default Cloudinary URL
                const cloudinaryUrl = PLACEHOLDER_URL;
                
                // Update product with Cloudinary URL
                await product.update({
                    image: cloudinaryUrl,
                    images: [cloudinaryUrl]
                });
                
                console.log('✅ Updated product with Cloudinary URL:', cloudinaryUrl);
                migratedCount++;
            } catch (error) {
                console.error(`❌ Error updating product ${product.id}:`, error.message);
                errorCount++;
            }
        }
        
        console.log('\nMigration completed:');
        console.log(`✅ Successfully migrated ${migratedCount} products`);
        console.log(`❌ Failed to migrate ${errorCount} products`);
        
    } catch (error) {
        console.error('Migration error:', error);
    }
}

// Run the migration
async function runMigration() {
    try {
        console.log('Starting image migration to Cloudinary...');
        await db.sequelize.authenticate();
        console.log('Database connection established');
        
        await migrateProductImages();
        
        console.log('Migration process completed');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration(); 