// Migration script to add customization column to OrderItems table
const { Sequelize } = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');
require('dotenv').config();

// Database connection
const sequelize = new Sequelize(
    process.env.DB_NAME || 'tshirt_customizer',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        logging: console.log
    }
);

// Helper function to check if column exists
async function columnExists(tableName, columnName) {
    try {
        const query = `
            SELECT COUNT(*) as count
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE 
                TABLE_SCHEMA = '${process.env.DB_NAME || 'tshirt_customizer'}' AND
                TABLE_NAME = '${tableName}' AND
                COLUMN_NAME = '${columnName}'
        `;
        const [results] = await sequelize.query(query);
        return results[0].count > 0;
    } catch (error) {
        console.error('Error checking if column exists:', error);
        return false;
    }
}

// Initialize Umzug
const umzug = new Umzug({
    migrations: {
        glob: 'migrations/add-customization-column.cjs',
    },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize }),
    logger: console,
});

// Run the migration
(async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection established successfully.');
        
        console.log('Starting migration...');
        await umzug.up();
        console.log('Migration completed successfully.');
        
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
})(); 