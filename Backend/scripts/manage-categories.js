// Script to manage categories in the database
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Sequelize, DataTypes } from 'sequelize';
import readline from 'readline';

// Set up environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Create a readline interface for interactive mode
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Log environment information
console.log('Running manage-categories.js script...');
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
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'Products' // Ensure table name matches your database
});

// Default categories if we need to add them
const defaultCategories = [
  "t-shirts",
  "hoodies",
  "sweatshirts",
  "tanks",
  "caps",
  "accessories",
  "customizable-tshirts"
];

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
    
    return results.map(row => row.category);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

async function getProductsInCategory(category) {
  try {
    const products = await Product.findAll({
      where: { category },
      limit: 5,
      order: [['id', 'ASC']]
    });
    
    console.log(`\n==== Sample Products in '${category}' category ====`);
    if (products.length === 0) {
      console.log(`No products found in the '${category}' category.`);
    } else {
      products.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - $${product.price} (Stock: ${product.stock})`);
      });
      console.log(`\nShowing ${products.length} of ${await Product.count({ where: { category } })} products`);
    }
    
    return products;
  } catch (error) {
    console.error(`Error fetching products in category '${category}':`, error);
    return [];
  }
}

async function addMockCategories() {
  try {
    console.log('\n==== Adding Mock Categories ====');
    const existingCategories = await getCategories();
    
    // Filter out categories that already exist
    const categoriesToAdd = defaultCategories.filter(
      category => !existingCategories.includes(category)
    );
    
    if (categoriesToAdd.length === 0) {
      console.log('All default categories already exist in the database.');
      return;
    }
    
    console.log(`Adding ${categoriesToAdd.length} mock categories:`);
    categoriesToAdd.forEach(category => console.log(`- ${category}`));
    
    const mockProduct = {
      name: 'Sample Product',
      description: 'This is a sample product added via script',
      price: 19.99,
      stock: 100,
      isActive: true
    };
    
    // Add one product for each category
    for (const category of categoriesToAdd) {
      await Product.create({
        ...mockProduct,
        name: `Sample ${category} product`,
        category
      });
      console.log(`Added sample product for '${category}' category`);
    }
    
    console.log('Mock categories added successfully!');
  } catch (error) {
    console.error('Error adding mock categories:', error);
  }
}

async function deleteCategory(category) {
  try {
    console.log(`\n==== Updating Products in '${category}' category ====`);
    
    // Count products in this category
    const count = await Product.count({ where: { category } });
    
    if (count === 0) {
      console.log(`No products found in the '${category}' category.`);
      return;
    }
    
    // We don't actually delete the category - we just update products to remove that category
    const [updatedRows] = await sequelize.query(`
      UPDATE "Products"
      SET category = NULL
      WHERE category = :category
    `, {
      replacements: { category }
    });
    
    console.log(`Updated ${updatedRows} products to remove the '${category}' category.`);
    
  } catch (error) {
    console.error(`Error deleting category '${category}':`, error);
  }
}

async function interactiveMenu() {
  console.log('\n==== Category Management Menu ====');
  console.log('1. List all categories');
  console.log('2. View products in a category');
  console.log('3. Add mock categories (if none exist)');
  console.log('4. Delete a category');
  console.log('5. Exit');
  
  rl.question('\nSelect an option (1-5): ', async (answer) => {
    switch (answer) {
      case '1':
        await getCategories();
        interactiveMenu();
        break;
        
      case '2':
        const categories = await getCategories();
        if (categories.length === 0) {
          console.log('No categories available to view.');
          interactiveMenu();
          break;
        }
        
        rl.question(`\nEnter category number (1-${categories.length}): `, async (categoryIndex) => {
          const index = parseInt(categoryIndex) - 1;
          if (isNaN(index) || index < 0 || index >= categories.length) {
            console.log('Invalid category number.');
          } else {
            await getProductsInCategory(categories[index]);
          }
          interactiveMenu();
        });
        break;
        
      case '3':
        await addMockCategories();
        interactiveMenu();
        break;
        
      case '4':
        const categoriesToDelete = await getCategories();
        if (categoriesToDelete.length === 0) {
          console.log('No categories available to delete.');
          interactiveMenu();
          break;
        }
        
        rl.question(`\nEnter category number to delete (1-${categoriesToDelete.length}): `, async (categoryIndex) => {
          const index = parseInt(categoryIndex) - 1;
          if (isNaN(index) || index < 0 || index >= categoriesToDelete.length) {
            console.log('Invalid category number.');
            interactiveMenu();
          } else {
            const categoryToDelete = categoriesToDelete[index];
            rl.question(`Are you sure you want to delete the '${categoryToDelete}' category? (y/n): `, async (confirm) => {
              if (confirm.toLowerCase() === 'y') {
                await deleteCategory(categoryToDelete);
              } else {
                console.log('Delete operation cancelled.');
              }
              interactiveMenu();
            });
          }
        });
        break;
        
      case '5':
        console.log('Exiting...');
        await sequelize.close();
        rl.close();
        break;
        
      default:
        console.log('Invalid option. Please try again.');
        interactiveMenu();
    }
  });
}

// Check for command line arguments
const args = process.argv.slice(2);
if (args.length > 0) {
  (async () => {
    try {
      switch (args[0]) {
        case 'list':
          await getCategories();
          break;
          
        case 'view':
          if (args[1]) {
            await getProductsInCategory(args[1]);
          } else {
            console.log('Please specify a category to view. Example: node manage-categories.js view t-shirts');
          }
          break;
          
        case 'add-mock':
          await addMockCategories();
          break;
          
        case 'delete':
          if (args[1]) {
            rl.question(`Are you sure you want to delete the '${args[1]}' category? (y/n): `, async (confirm) => {
              if (confirm.toLowerCase() === 'y') {
                await deleteCategory(args[1]);
              } else {
                console.log('Delete operation cancelled.');
              }
              rl.close();
            });
          } else {
            console.log('Please specify a category to delete. Example: node manage-categories.js delete t-shirts');
            rl.close();
          }
          return; // Don't close the connection yet since we have an async readline question
          
        default:
          console.log('Unknown command. Available commands: list, view, add-mock, delete');
      }
      
      await sequelize.close();
      console.log('\nDatabase connection closed.');
      if (args[0] !== 'delete') rl.close();
    } catch (error) {
      console.error('Error:', error);
      await sequelize.close();
      process.exit(1);
    }
  })();
} else {
  // Run interactive mode if no command-line arguments
  interactiveMenu();
} 