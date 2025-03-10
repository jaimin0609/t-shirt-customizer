import { sequelize, Product, ProductVariant, Category } from '../models/index.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { cloudinary, getCloudinaryUrl } from '../config/cloudinary.js';

// Initialize environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Initialize Sequelize and models
async function init() {
    try {
        // Sync database
        await sequelize.authenticate();
        console.log('Connection established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

// Sample image URLs to use as placeholders
const sampleImageUrls = [
    'https://res.cloudinary.com/dopvs93sl/image/upload/v1650052235/tshirt-customizer/placeholder-tshirt-white.jpg',
    'https://res.cloudinary.com/dopvs93sl/image/upload/v1650052235/tshirt-customizer/placeholder-hoodie-black.jpg',
    'https://res.cloudinary.com/dopvs93sl/image/upload/v1650052235/tshirt-customizer/placeholder-polo-blue.jpg',
    'https://res.cloudinary.com/dopvs93sl/image/upload/v1650052235/tshirt-customizer/placeholder-kids-tshirt.jpg',
    'https://res.cloudinary.com/dopvs93sl/image/upload/v1650052235/tshirt-customizer/placeholder-womens-vneck.jpg'
];

// Create products with Cloudinary URLs
async function seedCloudinaryProducts() {
    try {
        console.log('Starting to seed products with Cloudinary URLs...');
        
        // Get cloudinary URLs (use placeholders if Cloudinary API doesn't work)
        let cloudinaryUrls = [];
        try {
            console.log('Checking if Cloudinary is properly configured...');
            // Try a simple ping test
            await cloudinary.api.ping();
            console.log('✓ Cloudinary is properly configured!');
            
            // Use the placeholders since they're already on Cloudinary
            cloudinaryUrls = sampleImageUrls;
        } catch (error) {
            console.warn('Cloudinary API check failed, using placeholder URLs:', error.message);
            cloudinaryUrls = sampleImageUrls;
        }
        
        // Define sample products
        const sampleProducts = [
            {
                name: 'Classic White T-Shirt',
                description: 'A timeless white t-shirt made of 100% cotton. Perfect for any casual occasion.',
                price: 19.99,
                category: 'T-Shirts',
                gender: 'unisex',
                ageGroup: 'adult',
                stock: 100,
                isCustomizable: true,
                hasVariants: true,
                status: 'active',
                image: cloudinaryUrls[0] || getCloudinaryUrl(),
                images: [cloudinaryUrls[0] || getCloudinaryUrl()],
                featured: true,
                customizationOptions: {
                    colors: ['white', 'black', 'navy', 'gray'],
                    printAreas: ['front', 'back', 'sleeve'],
                    maxPrintWidth: 10,
                    maxPrintHeight: 12
                }
            },
            {
                name: 'Graphic Print Hoodie',
                description: 'Comfortable hoodie with unique graphic prints. Made with soft fabric for everyday wear.',
                price: 39.99,
                category: 'Hoodies',
                gender: 'unisex',
                ageGroup: 'adult',
                stock: 50,
                isCustomizable: true,
                hasVariants: true,
                status: 'active',
                image: cloudinaryUrls[1] || getCloudinaryUrl(),
                images: [cloudinaryUrls[1] || getCloudinaryUrl()],
                featured: false,
                customizationOptions: {
                    colors: ['black', 'gray', 'navy', 'maroon'],
                    printAreas: ['front', 'back'],
                    maxPrintWidth: 12,
                    maxPrintHeight: 15
                }
            },
            {
                name: 'Slim Fit Polo',
                description: 'Elegant slim fit polo shirt perfect for both casual and smart-casual events.',
                price: 29.99,
                category: 'Polo Shirts',
                gender: 'men',
                ageGroup: 'adult',
                stock: 75,
                isCustomizable: true,
                hasVariants: true,
                status: 'active',
                image: cloudinaryUrls[2] || getCloudinaryUrl(),
                images: [cloudinaryUrls[2] || getCloudinaryUrl()],
                featured: true,
                customizationOptions: {
                    colors: ['white', 'black', 'navy', 'light blue'],
                    printAreas: ['chest', 'sleeve'],
                    maxPrintWidth: 8,
                    maxPrintHeight: 8
                }
            },
            {
                name: 'Kids Cartoon T-Shirt',
                description: 'Fun and colorful t-shirts for kids featuring popular cartoon characters.',
                price: 15.99,
                category: 'T-Shirts',
                gender: 'kids',
                ageGroup: 'child',
                stock: 60,
                isCustomizable: true,
                hasVariants: true,
                status: 'active',
                image: cloudinaryUrls[3] || getCloudinaryUrl(),
                images: [cloudinaryUrls[3] || getCloudinaryUrl()],
                featured: false,
                customizationOptions: {
                    colors: ['white', 'blue', 'pink', 'yellow'],
                    printAreas: ['front'],
                    maxPrintWidth: 10,
                    maxPrintHeight: 10
                }
            },
            {
                name: 'Women\'s V-Neck Tee',
                description: 'Stylish v-neck t-shirt designed specifically for women. Comfortable and versatile.',
                price: 24.99,
                category: 'T-Shirts',
                gender: 'women',
                ageGroup: 'adult',
                stock: 80,
                isCustomizable: true,
                hasVariants: true,
                status: 'active',
                image: cloudinaryUrls[4] || getCloudinaryUrl(),
                images: [cloudinaryUrls[4] || getCloudinaryUrl()],
                featured: true,
                customizationOptions: {
                    colors: ['white', 'black', 'red', 'pink'],
                    printAreas: ['front', 'back'],
                    maxPrintWidth: 10,
                    maxPrintHeight: 12
                }
            }
        ];
        
        // Ensure categories exist
        const categories = [...new Set(sampleProducts.map(p => p.category))];
        for (const categoryName of categories) {
            await Category.findOrCreate({
                where: { name: categoryName }
            });
        }
        
        // Create products
        for (const productData of sampleProducts) {
            console.log(`Creating product: ${productData.name}`);
            
            const product = await Product.create(productData);
            
            // Create variants for the product
            if (productData.hasVariants) {
                // Create size variants
                const sizes = ['S', 'M', 'L', 'XL'];
                for (const size of sizes) {
                    await ProductVariant.create({
                        productId: product.id,
                        type: 'size',
                        size: size,
                        stock: Math.floor(Math.random() * 50) + 10,
                        priceAdjustment: size === 'XL' ? 2.00 : 0,
                        status: 'active'
                    });
                }
                
                // Create color variants
                const colors = productData.customizationOptions.colors;
                for (const color of colors) {
                    await ProductVariant.create({
                        productId: product.id,
                        type: 'color',
                        color: color,
                        colorCode: getColorCode(color),
                        stock: Math.floor(Math.random() * 30) + 5,
                        priceAdjustment: 0,
                        status: 'active'
                    });
                }
            }
        }
        
        console.log('Products with Cloudinary URLs seeded successfully!');
    } catch (error) {
        console.error('Error seeding products:', error);
    }
}

// Helper function to get color hex codes
function getColorCode(colorName) {
    const colorCodes = {
        'white': '#FFFFFF',
        'black': '#000000',
        'navy': '#000080',
        'gray': '#808080',
        'light blue': '#ADD8E6',
        'blue': '#0000FF',
        'pink': '#FFC0CB',
        'yellow': '#FFFF00',
        'red': '#FF0000',
        'maroon': '#800000'
    };
    return colorCodes[colorName.toLowerCase()] || '#000000';
}

// Run the seeder
async function runSeeder() {
    try {
        await init();
        await seedCloudinaryProducts();
        console.log('Seeding completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error during seeding:', error);
        process.exit(1);
    }
}

runSeeder(); 