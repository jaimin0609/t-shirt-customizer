// Simple script to fix product images in the database
import db from '../models/index.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Initialize environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Default placeholder URL
const DEFAULT_PLACEHOLDER = 'https://res.cloudinary.com/dopvs93sl/image/upload/v1650052235/tshirt-customizer/placeholder-product.jpg';

// Function to fix product images
async function fixProductImages() {
    try {
        console.log('Connecting to database...');
        await db.sequelize.authenticate();
        console.log('Database connection established');
        
        // Get all products from the database
        const products = await db.Product.findAll();
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