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

const migrateImageData = async () => {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
        
        // First, count how many products need migration
        const [countResult] = await sequelize.query(
            'SELECT COUNT(*) as count FROM Products WHERE image IS NOT NULL AND (images IS NULL OR JSON_LENGTH(images) = 0)'
        );
        const count = countResult[0].count;
        
        console.log(`Found ${count} products that need image data migration`);
        
        if (count > 0) {
            // Update products to move image to images array
            const [updateResult] = await sequelize.query(
                'UPDATE Products SET images = JSON_ARRAY(image) WHERE image IS NOT NULL AND (images IS NULL OR JSON_LENGTH(images) = 0)'
            );
            
            console.log(`Successfully migrated ${updateResult.affectedRows} products`);
            
            // Verify the migration
            const [verifyResult] = await sequelize.query(
                'SELECT COUNT(*) as count FROM Products WHERE JSON_LENGTH(images) > 0'
            );
            
            console.log(`Verification: ${verifyResult[0].count} products now have non-empty images array`);
            
            // Show a sample of migrated products
            const [sampleProducts] = await sequelize.query(
                'SELECT id, name, image, images FROM Products WHERE JSON_LENGTH(images) > 0 LIMIT 5'
            );
            
            console.log('\nSample of migrated products:');
            console.log(JSON.stringify(sampleProducts, null, 2));
        } else {
            console.log('No products need migration.');
        }
        
    } catch (error) {
        console.error('Error migrating image data:', error);
    } finally {
        await sequelize.close();
    }
};

// Run the migration
migrateImageData(); 