// Simple script to check categories in the database
// You can run this with: node check-categories-local.js

// ===== CONFIGURATION =====
// Replace this with your Render DATABASE_URL
const DATABASE_URL = 'postgresql://t_shirt_customizer_db_user:N6h76ZKQNvDLnXdasl4hktPzbrtC7LjB@dpg-cv5r06in91rc73b7odt0-a.oregon-postgres.render.com/t_shirt_customizer_db';
// =======================

// Import required modules
import { Sequelize } from 'sequelize';

console.log('=== Category Checker Script ===');
console.log('This script will connect to your database and list all categories');

// Create database connection
const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // required for Render's SSL
    }
  },
  logging: false
});

async function checkCategories() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Successfully connected to the database!');
    
    // Query for all categories
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
    
    // Add a sample product to each category section
    if (results.length > 0) {
      console.log('\n==== Sample Products in Each Category ====');
      
      for (const row of results) {
        const category = row.category;
        const [products] = await sequelize.query(`
          SELECT id, name, price, stock 
          FROM "Products" 
          WHERE category = :category
          LIMIT 3
        `, {
          replacements: { category }
        });
        
        console.log(`\n${category} (${products.length} products):`);
        if (products.length === 0) {
          console.log(`  No products found in this category.`);
        } else {
          products.forEach(product => {
            console.log(`  - ${product.name} ($${product.price})`);
          });
        }
      }
    }
  
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('password authentication failed')) {
      console.log('\nTIP: Make sure you replaced the DATABASE_URL with your actual Render database URL');
    }
  } finally {
    // Close the connection
    await sequelize.close();
    console.log('\nDatabase connection closed.');
  }
}

// =================================================
// Run the function
// =================================================

// Check if DATABASE_URL has been updated
if (DATABASE_URL.includes('username:password')) {
  console.log('\n⚠️ ERROR: You need to update the DATABASE_URL in the script');
  console.log('1. Open check-categories-local.js in a text editor');
  console.log('2. Replace the DATABASE_URL at the top with your Render PostgreSQL connection string');
  console.log('3. Run the script again with: node check-categories-local.js');
} else {
  // Run the category check
  checkCategories();
} 