const { DataTypes } = require('sequelize');

async function up({ context: queryInterface }) {
    console.log('Running migration: add customization column to OrderItems table');
    
    // Check if customization column already exists
    const hasCustomizationColumn = await columnExists('OrderItems', 'customization');
    
    if (!hasCustomizationColumn) {
        console.log('Adding customization column to OrderItems table...');
        
        // Add customization column
        await queryInterface.addColumn('OrderItems', 'customization', {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: null
        });
        
        console.log('Customization column added successfully.');
        
        // Update existing records to have an empty object for customization
        await queryInterface.sequelize.query(`
            UPDATE OrderItems 
            SET customization = '{}' 
            WHERE customization IS NULL
        `);
        
        console.log('Updated existing records with empty customization objects.');
    } else {
        console.log('Customization column already exists in OrderItems table.');
    }
}

async function down({ context: queryInterface }) {
    console.log('Running migration rollback: remove customization column from OrderItems table');
    
    // Check if customization column exists
    const hasCustomizationColumn = await columnExists('OrderItems', 'customization');
    
    if (hasCustomizationColumn) {
        console.log('Removing customization column from OrderItems table...');
        
        // Remove customization column
        await queryInterface.removeColumn('OrderItems', 'customization');
        
        console.log('Customization column removed successfully.');
    } else {
        console.log('Customization column does not exist in OrderItems table.');
    }
}

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
        const [results] = await queryInterface.sequelize.query(query);
        return results[0].count > 0;
    } catch (error) {
        console.error('Error checking if column exists:', error);
        return false;
    }
}

module.exports = { up, down }; 