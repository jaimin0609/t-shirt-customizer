import 'dotenv/config';
import { Sequelize } from 'sequelize';

// Initialize Sequelize with the database configuration
let sequelize;

// Check if we have a DATABASE_URL (for production)
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
    // Validate required environment variables
    if (!process.env.DB_NAME || !process.env.DB_USER) {
        console.error('Missing required database environment variables (DB_NAME, DB_USER)');
        process.exit(1);
    }
    
    // For local development
    console.log('Using individual connection parameters');
    sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD,
        {
            host: process.env.DB_HOST || 'localhost',
            dialect: process.env.DB_DIALECT || 'mysql',
            logging: console.log
        }
    );
}

const fixAssociations = async () => {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
        
        // First, manually define the Product model (simplified version)
        const Product = sequelize.define('Product', {}, { tableName: 'Products' });
        
        // Then, manually define the ProductVariant model (simplified version)
        const ProductVariant = sequelize.define('ProductVariant', {
            productId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Products',
                    key: 'id'
                }
            }
        }, { tableName: 'ProductVariants' });
        
        // Manually set up the association
        Product.hasMany(ProductVariant, {
            foreignKey: 'productId',
            as: 'variants'
        });
        
        ProductVariant.belongsTo(Product, {
            foreignKey: 'productId',
            as: 'product'
        });
        
        // Try a test query to check if the association works
        console.log('Testing association with a query...');
        try {
            const testResult = await Product.findOne({
                include: [{
                    model: ProductVariant,
                    as: 'variants',
                    required: false
                }],
                limit: 1
            });
            
            if (testResult) {
                console.log('Successfully queried a product with variants:');
                console.log(JSON.stringify(testResult, null, 2));
            } else {
                console.log('No products found in the database.');
            }
        } catch (testError) {
            console.error('Error testing association:', testError);
        }
        
        // Now create a patch file to fix this in the application code
        console.log('Association test complete. Create model patch files as needed.');
        
    } catch (error) {
        console.error('Error fixing associations:', error);
    } finally {
        await sequelize.close();
    }
};

// Run the function
fixAssociations(); 