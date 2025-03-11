// Set up default categories in the database
// This script adds standard categories if they don't already exist

// ===== CONFIGURATION =====
// Replace this with your Render DATABASE_URL
const DATABASE_URL = 'postgres://username:password@host:port/database';
// =======================

// Import required modules
const { Sequelize, DataTypes } = require('sequelize');

console.log('=== Category Setup Script ===');
console.log('This script will add default categories to your database if they don\'t exist');

// Standard categories to add
const DEFAULT_CATEGORIES = [
  "t-shirts",
  "hoodies",
  "sweatshirts",
  "tanks",
  "caps",
  "accessories",
  "customizable-tshirts"
];

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

// Define a minimal Product model
const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 19.99
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 100
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'Products'
});

async function setupCategories() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Successfully connected to the database!');
    
    // Get existing categories
    const query = `
      SELECT DISTINCT category 
      FROM "Products" 
      WHERE category IS NOT NULL AND category != '' 
    `;
    
    const [existingCategories] = await sequelize.query(query);
    const existingCategoryNames = existingCategories.map(row => row.category);
    
    console.log('\nExisting categories:', existingCategoryNames.length ? existingCategoryNames.join(', ') : 'None');
    
    // Find categories that need to be added
    const missingCategories = DEFAULT_CATEGORIES.filter(
      category => !existingCategoryNames.includes(category)
    );
    
    if (missingCategories.length === 0) {
      console.log('\n✅ All default categories already exist in the database.');
      return;
    }
    
    console.log(`\nAdding ${missingCategories.length} missing categories:`);
    missingCategories.forEach(cat => console.log(`- ${cat}`));
    
    // Add a sample product for each missing category
    let addedCount = 0;
    for (const category of missingCategories) {
      try {
        await Product.create({
          name: `Sample ${category} product`,
          description: `This is an auto-generated sample product for the ${category} category.`,
          price: 19.99 + Math.floor(Math.random() * 10),
          stock: 50 + Math.floor(Math.random() * 50),
          category: category,
          isActive: true
        });
        
        console.log(`✅ Added sample product for '${category}' category`);
        addedCount++;
      } catch (error) {
        console.error(`❌ Failed to add product for '${category}':`, error.message);
      }
    }
    
    console.log(`\n==== Summary ====`);
    console.log(`Added ${addedCount} out of ${missingCategories.length} categories`);
    
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
if (DATABASE_URL === 'postgres://username:password@host:port/database') {
  console.log('\n⚠️ ERROR: You need to update the DATABASE_URL in the script');
  console.log('1. Open setup-categories.js in a text editor');
  console.log('2. Replace the DATABASE_URL at the top with your Render PostgreSQL connection string');
  console.log('3. Run the script again with: node setup-categories.js');
} else {
  // Run the category setup
  setupCategories();
} 