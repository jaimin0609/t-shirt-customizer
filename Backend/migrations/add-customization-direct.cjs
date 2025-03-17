require('dotenv').config();
const { Sequelize } = require('sequelize');

// Initialize Sequelize with database connection
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

// Run the migration
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection established successfully.');
    
    // Check if customization column exists
    const [customizationCheck] = await sequelize.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'tshirt_customizer'}'
      AND TABLE_NAME = 'OrderItems'
      AND COLUMN_NAME = 'customization'
    `);
    
    if (customizationCheck.length === 0) {
      // Add customization column
      await sequelize.query(`ALTER TABLE OrderItems ADD COLUMN customization JSON NULL`);
      console.log('Customization column added successfully.');
    } else {
      console.log('Customization column already exists.');
    }
    
    // Check if size column exists
    const [sizeCheck] = await sequelize.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'tshirt_customizer'}'
      AND TABLE_NAME = 'OrderItems'
      AND COLUMN_NAME = 'size'
    `);
    
    if (sizeCheck.length === 0) {
      console.log('size column does not exist. Adding it now...');
      await sequelize.query(`ALTER TABLE OrderItems ADD COLUMN size VARCHAR(255) NULL`);
      console.log('size column added successfully.');
    } else {
      console.log('size column already exists.');
    }
    
    // Check if color column exists
    const [colorCheck] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'tshirt_customizer'}' 
      AND TABLE_NAME = 'OrderItems' 
      AND COLUMN_NAME = 'color'
    `);
    
    if (colorCheck.length === 0) {
      console.log('color column does not exist. Adding it now...');
      await sequelize.query(`ALTER TABLE OrderItems ADD COLUMN color VARCHAR(255) NULL`);
      console.log('color column added successfully.');
    } else {
      console.log('color column already exists.');
    }
    
    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
})(); 