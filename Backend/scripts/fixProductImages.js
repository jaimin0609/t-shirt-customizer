// Simple script to fix product images in the database
import { Product } from '../models/index.js';
import 'dotenv/config';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Initialize environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Validate Cloudinary cloud name
if (!process.env.CLOUDINARY_CLOUD_NAME) {
  console.error('❌ CLOUDINARY_CLOUD_NAME environment variable is missing!');
  console.error('Please set this variable in your .env file.');
  process.exit(1);
}

// Default placeholder URL using the configured Cloudinary account
const DEFAULT_PLACEHOLDER = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1650052235/tshirt-customizer/placeholder-product.jpg`;

// Function to fix product images
async function fixProductImages() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Database connection established');
        
        // Get all products from the database
        const products = await Product.findAll();
        console.log(`Found ${products.length} products in the database`);
        
        // Fix each product
        for (const product of products) {
            console.log(`Fixing product ${product.id}: ${product.name}`);
            
            // Update product with placeholder URL
            await product.update({
                image: DEFAULT_PLACEHOLDER,
                images: [DEFAULT_PLACEHOLDER]
            });
            
            console.log(`✅ Updated product ${product.id} with placeholder image`);
        }
        
        console.log('All products updated successfully');
    } catch (error) {
        console.error('Error fixing product images:', error);
        process.exit(1);
    }
}

// Run the script
fixProductImages().then(() => {
    console.log('Image fix completed');
    process.exit(0);
}).catch(error => {
    console.error('Script execution failed:', error);
    process.exit(1);
}); 