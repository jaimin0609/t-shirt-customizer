// Script to fetch all product categories from the database
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Sequelize } from 'sequelize';

// Set up environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Log environment information
console.log('Running get-categories.js script...');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

// Create a connection to the database
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false // needed for Render's SSL
        }
      },
      logging: false
    })
  : new Sequelize(
      process.env.DB_NAME || 'ecommerce',
      process.env.DB_USER || 'root',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        logging: false
      }
    );

// Define a minimal Product model just for this script
const Product = sequelize.define('Product', {
  category: {
    type: Sequelize.STRING,
    allowNull: true
  }
}, {
  tableName: 'Products' // Ensure table name matches your database
});

async function getCategories() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Successfully connected to the database.');
    
    // Get distinct categories from the products table
    const query = `
      SELECT DISTINCT category 
      FROM "Products" 
      WHERE category IS NOT NULL AND category != '' 
      ORDER BY category ASC
    `;
    
    const [results] = await sequelize.query(query);
    
    console.log('\n==== Categories found in database ====');
    if (results.length === 0) {
      console.log('No categories found in the database.');
    } else {
      results.forEach((row, index) => {
        console.log(`${index + 1}. ${row.category}`);
      });
      console.log(`\nTotal categories: ${results.length}`);
    }
    
    // Close the connection
    await sequelize.close();
    console.log('\nDatabase connection closed.');
    
  } catch (error) {
    console.error('Error connecting to the database:', error);
    process.exit(1);
  }
}

// Run the function
getCategories(); 