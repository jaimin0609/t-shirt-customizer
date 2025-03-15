const { Sequelize } = require('sequelize');
require('dotenv').config();

// Database connection parameters from environment variables
const dbConfig = {
  database: process.env.DB_NAME || 'tshirt_customizer',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  host: process.env.DB_HOST || 'localhost',
  dialect: 'mysql',
  logging: console.log
};

// Create Sequelize instance
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging
  }
);

async function runMigration() {
  try {
    // Connect to the database
    await sequelize.authenticate();
    console.log('Connected to the database successfully.');

    // Check if the columns already exist
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Users' 
      AND COLUMN_NAME IN ('resetToken', 'resetTokenExpiry')
    `);

    const existingColumns = results.map(r => r.COLUMN_NAME);
    
    // Add resetToken column if it doesn't exist
    if (!existingColumns.includes('resetToken')) {
      await sequelize.query(`
        ALTER TABLE Users 
        ADD COLUMN resetToken VARCHAR(255) NULL
      `);
      console.log('Added resetToken column to Users table');
    } else {
      console.log('resetToken column already exists');
    }

    // Add resetTokenExpiry column if it doesn't exist
    if (!existingColumns.includes('resetTokenExpiry')) {
      await sequelize.query(`
        ALTER TABLE Users 
        ADD COLUMN resetTokenExpiry DATETIME NULL
      `);
      console.log('Added resetTokenExpiry column to Users table');
    } else {
      console.log('resetTokenExpiry column already exists');
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration(); 