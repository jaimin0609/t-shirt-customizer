require('dotenv').config();
const { Sequelize } = require('sequelize');

// Initialize Sequelize with database connection
const sequelize = new Sequelize(
  process.env.DB_NAME || 'tshirt_customizer',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '6941@Sjp',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: console.log
  }
);

// Run the migration
(async () => {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('Connection established successfully.');
    
    // Get all columns in Orders table
    const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'tshirt_customizer'}'
      AND TABLE_NAME = 'Orders'
    `);
    
    const columnNames = columns.map(col => col.COLUMN_NAME.toLowerCase());
    
    // Check for discount column
    if (!columnNames.includes('discount')) {
      await sequelize.query(`ALTER TABLE Orders ADD COLUMN discount DECIMAL(10,2) DEFAULT 0.00 NOT NULL`);
      console.log('discount column added successfully.');
    }
    
    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
})(); 