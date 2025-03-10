import 'dotenv/config';
import { Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log environment information
console.log('===== ENVIRONMENT INFORMATION =====');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DB_NAME exists:', !!process.env.DB_NAME);
console.log('====================================');

// Initialize Sequelize with the database configuration
let sequelize;
if (process.env.DATABASE_URL) {
    console.log('Using DATABASE_URL for connection');
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: console.log,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    });
} else {
    console.log('Using individual connection parameters');
    sequelize = new Sequelize(
        process.env.DB_NAME || 'tshirt_customizer',
        process.env.DB_USER || 'root',
        process.env.DB_PASSWORD || '',
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
}

const fixProductImagesColumn = async () => {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
        
        // Check if the images column exists in the Products table
        console.log('Checking if images column exists in Products table...');
        let tableInfo;
        try {
            tableInfo = await sequelize.getQueryInterface().describeTable('Products');
            console.log('Products table exists and accessible');
        } catch (error) {
            console.error('Error accessing Products table:', error);
            return;
        }
        
        // Add the images column if it doesn't exist
        if (!tableInfo.images) {
            console.log('Adding images column to Products table...');
            try {
                await sequelize.getQueryInterface().addColumn('Products', 'images', {
                    type: Sequelize.JSON,
                    allowNull: true,
                    defaultValue: null,
                    comment: 'Array of image URLs for the product'
                });
                console.log('Images column added successfully.');
            } catch (error) {
                console.error('Error adding images column:', error);
                return;
            }
        } else {
            console.log('Images column already exists in Products table.');
        }
        
        // Count how many products need migration
        console.log('Counting products that need image data migration...');
        const countQueryStr = sequelize.dialect.name === 'postgres' 
            ? 'SELECT COUNT(*) as count FROM "Products" WHERE image IS NOT NULL AND (images IS NULL OR jsonb_array_length(images) = 0)'
            : 'SELECT COUNT(*) as count FROM Products WHERE image IS NOT NULL AND (images IS NULL OR JSON_LENGTH(images) = 0)';
        
        const [countResult] = await sequelize.query(countQueryStr);
        const count = countResult[0].count;
        console.log(`Found ${count} products that need image data migration`);
        
        if (count > 0) {
            // Migrate data from image to images
            console.log('Migrating data from image column to images array...');
            
            // Different SQL syntax for PostgreSQL vs MySQL
            const updateQueryStr = sequelize.dialect.name === 'postgres' 
                ? 'UPDATE "Products" SET images = jsonb_build_array(image) WHERE image IS NOT NULL AND (images IS NULL OR jsonb_array_length(images) = 0)'
                : 'UPDATE Products SET images = JSON_ARRAY(image) WHERE image IS NOT NULL AND (images IS NULL OR JSON_LENGTH(images) = 0)';
            
            try {
                const [updateResult] = await sequelize.query(updateQueryStr);
                console.log(`Migration complete. ${updateResult.rowCount || updateResult.affectedRows} products updated.`);
            } catch (error) {
                console.error('Error during migration:', error);
            }
        }
        
        // Verify the migration
        console.log('Verifying migration...');
        const verifyQueryStr = sequelize.dialect.name === 'postgres'
            ? 'SELECT COUNT(*) as count FROM "Products" WHERE images IS NOT NULL AND jsonb_array_length(images) > 0'
            : 'SELECT COUNT(*) as count FROM Products WHERE images IS NOT NULL AND JSON_LENGTH(images) > 0';
        
        const [verifyResult] = await sequelize.query(verifyQueryStr);
        console.log(`Verification complete. ${verifyResult[0].count} products now have non-empty images array.`);
        
        // Add the patch to the Product model - this creates a 'toJSON' hook that ensures the 'images' array 
        // is always populated even if it's missing in the database
        console.log('Creating Product model patch file...');
        
        const patchFilePath = path.join(__dirname, '../models/ProductPatch.js');
        const patchCode = `
// This file patches the Product model to handle legacy 'image' field
// It ensures that 'images' is always populated even for older products
// that only have the 'image' field

export function applyProductModelPatch(Product) {
    // Store the original toJSON method
    const originalToJSON = Product.prototype.toJSON;
    
    // Override toJSON to handle image/images compatibility
    Product.prototype.toJSON = function() {
        // Call the original method to get the base values
        const values = originalToJSON ? originalToJSON.call(this) : {...this.get()};
        
        // Ensure images is always an array
        if (!values.images) {
            values.images = [];
        }
        
        // If images array is empty but image exists, use image
        if (values.images.length === 0 && values.image) {
            values.images = [values.image];
        }
        
        return values;
    };
    
    console.log('Product model patch applied - image/images compatibility added');
}
`;
        
        fs.writeFileSync(patchFilePath, patchCode);
        console.log(`Patch file created at ${patchFilePath}`);
        
        // Add the import and application of the patch to the index.js model file
        console.log('Updating models/index.js to apply the patch...');
        
        const indexPath = path.join(__dirname, '../models/index.js');
        let indexContent = '';
        
        try {
            indexContent = fs.readFileSync(indexPath, 'utf8');
        } catch (error) {
            console.error('Error reading models/index.js:', error);
            return;
        }
        
        // Check if the patch is already included
        if (!indexContent.includes('ProductPatch')) {
            // Add import statement after the last import
            const importSection = indexContent.split('import');
            const lastImport = importSection[importSection.length - 1];
            const restOfFile = lastImport.substring(lastImport.indexOf(';') + 1);
            
            const newIndexContent = indexContent.replace(
                restOfFile,
                `\n// Import Product model patch\nimport { applyProductModelPatch } from './ProductPatch.js';\n${restOfFile}`
            );
            
            // Add the patch application after Product is defined
            const patchedContent = newIndexContent.replace(
                'export default Product;',
                'export default Product;\n\n// Apply patch to handle image/images compatibility\napplyProductModelPatch(Product);'
            );
            
            fs.writeFileSync(indexPath, patchedContent);
            console.log('models/index.js updated to apply the Product model patch');
        } else {
            console.log('Product patch already included in models/index.js');
        }
        
        console.log('Fix complete! The application should now handle both image and images fields correctly.');
        
    } catch (error) {
        console.error('Error in fix script:', error);
    } finally {
        await sequelize.close();
    }
};

// Run the function
fixProductImagesColumn(); 