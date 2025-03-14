// Script to update product image URLs from local paths to Cloudinary URLs
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sequelize, Product } from '../models/index.js';

// Initialize environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Get the Cloudinary cloud name from environment variables
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dopvs93sl';

async function fixProductImageUrls() {
    try {
        console.log('Starting migration to fix product image URLs...');
        console.log(`Using Cloudinary cloud name: ${CLOUDINARY_CLOUD_NAME}`);
        
        // Connect to the database
        await sequelize.authenticate();
        console.log('Database connection successful');
        
        // Fetch all products with images
        const products = await Product.findAll();
        console.log(`Found ${products.length} products in the database`);
        
        let updatedCount = 0;
        
        // Process each product
        for (const product of products) {
            try {
                let needsUpdate = false;
                let images = product.images;
                let mainImage = product.image;
                
                // Process images array
                if (images) {
                    // Handle images array that might be stored as a JSON string
                    let imagesArray = images;
                    if (typeof images === 'string') {
                        try {
                            imagesArray = JSON.parse(images);
                        } catch (e) {
                            console.log(`Failed to parse images JSON for product ${product.id}: ${e.message}`);
                            imagesArray = [];
                        }
                    }
                    
                    // Process if it's an array
                    if (Array.isArray(imagesArray)) {
                        // Map the array and convert local paths to Cloudinary URLs
                        const updatedImages = imagesArray.map(img => {
                            if (typeof img === 'string' && 
                                !img.includes('cloudinary.com') && 
                                !img.startsWith('http') && 
                                !img.startsWith('data:image')) {
                                // Check for patterns that indicate Cloudinary image paths
                                if (img.includes('/product-') || img.includes('/images-')) {
                                    // Extract filename
                                    const pathParts = img.split('/');
                                    const filename = pathParts[pathParts.length - 1];
                                    
                                    // Create proper Cloudinary URL
                                    const cloudinaryUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/v1/${filename}`;
                                    console.log(`Converting image URL for product ${product.id}:`);
                                    console.log(`  From: ${img}`);
                                    console.log(`  To:   ${cloudinaryUrl}`);
                                    needsUpdate = true;
                                    return cloudinaryUrl;
                                }
                                return img;
                            }
                            return img;
                        });
                        
                        if (needsUpdate) {
                            images = updatedImages;
                        }
                    }
                }
                
                // Process main image
                if (mainImage && typeof mainImage === 'string' && 
                    !mainImage.includes('cloudinary.com') && 
                    !mainImage.startsWith('http') && 
                    !mainImage.startsWith('data:image')) {
                    
                    // Check for patterns that indicate Cloudinary image paths
                    if (mainImage.includes('/product-') || mainImage.includes('/images-')) {
                        // Extract filename
                        const pathParts = mainImage.split('/');
                        const filename = pathParts[pathParts.length - 1];
                        
                        // Create proper Cloudinary URL
                        const cloudinaryUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/v1/${filename}`;
                        console.log(`Converting main image for product ${product.id}:`);
                        console.log(`  From: ${mainImage}`);
                        console.log(`  To:   ${cloudinaryUrl}`);
                        mainImage = cloudinaryUrl;
                        needsUpdate = true;
                    }
                }
                
                // Update the product if needed
                if (needsUpdate) {
                    await product.update({
                        images: images,
                        image: mainImage
                    });
                    updatedCount++;
                    console.log(`✅ Updated product ${product.id} images successfully`);
                }
            } catch (productError) {
                console.error(`Error processing product ${product.id}:`, productError);
                // Continue with next product
            }
        }
        
        console.log(`Migration completed! Updated ${updatedCount} out of ${products.length} products.`);
        
    } catch (error) {
        console.error('Error during migration:', error);
    } finally {
        // Close the database connection
        await sequelize.close();
        console.log('Database connection closed');
    }
}

// Run the migration
fixProductImageUrls()
    .then(() => {
        console.log('Script execution completed.');
        process.exit(0);
    })
    .catch(error => {
        console.error('Script execution failed:', error);
        process.exit(1);
    }); 