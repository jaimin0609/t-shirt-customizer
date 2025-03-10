import { Sequelize } from 'sequelize';

// Database configuration
const sequelize = new Sequelize(
    'tshirt_customizer',
    'root',
    '6941@Sjp',
    {
        host: 'localhost',
        dialect: 'mysql',
        logging: console.log
    }
);

const checkProductsTable = async () => {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
        
        // Check Products table schema
        console.log('\n--- PRODUCTS TABLE SCHEMA ---');
        const tableInfo = await sequelize.getQueryInterface().describeTable('Products');
        console.log(JSON.stringify(tableInfo, null, 2));
        
        // Get a sample of products
        console.log('\n--- SAMPLE PRODUCTS DATA ---');
        const [products] = await sequelize.query('SELECT id, name, price, images FROM Products LIMIT 5');
        console.log(JSON.stringify(products, null, 2));
        
        // Check if any products have data in the images column
        console.log('\n--- CHECKING IMAGES COLUMN DATA ---');
        const [imagesData] = await sequelize.query('SELECT COUNT(*) as count FROM Products WHERE images IS NOT NULL');
        console.log(`Products with non-null images: ${imagesData[0].count}`);
        
        const [nonEmptyImages] = await sequelize.query('SELECT COUNT(*) as count FROM Products WHERE JSON_LENGTH(images) > 0');
        console.log(`Products with non-empty images array: ${nonEmptyImages[0].count}`);
        
        // If we have products with image column data but not images column data,
        // we might need to migrate that data
        const [productWithImageNoImages] = await sequelize.query(
            'SELECT id, name, image, images FROM Products WHERE image IS NOT NULL AND (images IS NULL OR JSON_LENGTH(images) = 0) LIMIT 5'
        );
        
        if (productWithImageNoImages.length > 0) {
            console.log('\n--- PRODUCTS WITH image BUT NO images ---');
            console.log(JSON.stringify(productWithImageNoImages, null, 2));
            
            // Suggest migration strategy
            console.log('\nSuggested fix: Migrate data from image column to images array');
            console.log('Example query: UPDATE Products SET images = JSON_ARRAY(image) WHERE image IS NOT NULL AND (images IS NULL OR JSON_LENGTH(images) = 0)');
        }
        
    } catch (error) {
        console.error('Error checking Products table:', error);
    } finally {
        await sequelize.close();
    }
};

// Run the check
checkProductsTable(); 