import { Sequelize, DataTypes } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
let envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    console.log('Using local database configuration');
    import('dotenv').then(dotenv => {
        dotenv.config({ path: envPath });
    });
} else {
    console.log('Using production database configuration');
}

// Initialize Sequelize with the database configuration
const sequelize = new Sequelize(
    process.env.DB_NAME || 'tshirt_customizer',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '6941@Sjp',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: process.env.DB_DIALECT || 'mysql',
        logging: console.log,
        dialectOptions: {
            ssl: process.env.DB_SSL === 'true' ? {
                require: true,
                rejectUnauthorized: false
            } : false
        }
    }
);

const runMigration = async () => {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');

        // Check if the images column already exists
        console.log('Checking if images column exists in Products table...');
        const tableInfo = await sequelize.getQueryInterface().describeTable('Products');
        
        if (!tableInfo.images) {
            console.log('Adding images column to Products table...');
            // Add the images column
            await sequelize.getQueryInterface().addColumn('Products', 'images', {
                type: DataTypes.JSON,
                allowNull: true,
                defaultValue: [],
                comment: 'Array of image URLs for the product'
            });
            console.log('Migration completed successfully.');
        } else {
            console.log('Images column already exists in Products table.');
        }
    } catch (error) {
        console.error('Error running migration:', error);
    } finally {
        await sequelize.close();
    }
};

// Run the migration
runMigration(); 