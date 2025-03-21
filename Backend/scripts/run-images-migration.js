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
let sequelize;

// Check if we have a DATABASE_URL (for production)
if (process.env.DATABASE_URL) {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        logging: console.log
    });
    console.log('Using PostgreSQL with DATABASE_URL');
} else {
    // Validate required environment variables
    if (!process.env.DB_NAME || !process.env.DB_USER) {
        console.error('Missing required database environment variables (DB_NAME, DB_USER)');
        process.exit(1);
    }
    
    // For local development
    sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD,
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
    console.log('Using local database configuration');
}

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