import 'dotenv/config';
import { Sequelize } from 'sequelize';

// Initialize Sequelize with the database configuration
let sequelize;
if (process.env.DATABASE_URL) {
    console.log('Using DATABASE_URL for connection');
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: console.log,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    });
} else {
    console.log('Using individual connection parameters');
    sequelize = new Sequelize(
        process.env.DB_NAME || 'tshirt_customizer',
        process.env.DB_USER || 'root',
        process.env.DB_PASSWORD || '6941@Sjp',
        {
            host: process.env.DB_HOST || 'localhost',
            dialect: process.env.DB_DIALECT || 'mysql',
            logging: console.log
        }
    );
}

const checkDatabase = async () => {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
        
        // Check Products table structure
        console.log('\n--- PRODUCTS TABLE STRUCTURE ---');
        const tableInfo = await sequelize.getQueryInterface().describeTable('Products');
        console.log('Products table columns:', Object.keys(tableInfo).join(', '));
        
        // Count products in the database
        const [productCount] = await sequelize.query('SELECT COUNT(*) as count FROM "Products"');
        console.log(`\nTotal products in database: ${productCount[0].count}`);
        
        if (productCount[0].count > 0) {
            // Get sample products
            const [products] = await sequelize.query('SELECT id, name, price, status, image, images FROM "Products" LIMIT 5');
            console.log('\n--- SAMPLE PRODUCTS ---');
            console.log(JSON.stringify(products, null, 2));
            
            // Check for products with active status
            const [activeProducts] = await sequelize.query('SELECT COUNT(*) as count FROM "Products" WHERE status = \'active\'');
            console.log(`\nActive products: ${activeProducts[0].count}`);
            
            // Check if images column has data
            const [withImages] = await sequelize.query('SELECT COUNT(*) as count FROM "Products" WHERE images IS NOT NULL');
            console.log(`Products with non-null images: ${withImages[0].count}`);
        }
        
    } catch (error) {
        console.error('Error checking database:', error);
    } finally {
        await sequelize.close();
    }
};

// Run the check
checkDatabase(); 