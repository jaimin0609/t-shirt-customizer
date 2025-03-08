const { DataTypes } = require('sequelize');

async function up(queryInterface, Sequelize) {
  try {
    // Helper function to check if column exists
    const columnExists = async (tableName, columnName) => {
      try {
        const tableDescription = await queryInterface.describeTable(tableName);
        return !!tableDescription[columnName];
      } catch (error) {
        return false;
      }
    };

    // Add subtotal column if it doesn't exist
    if (!(await columnExists('Orders', 'subtotal'))) {
      await queryInterface.addColumn('Orders', 'subtotal', {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true, // Making it nullable for now
        defaultValue: 0.00
      });
      
      console.log('Added subtotal column to Orders table');
      
      // Update existing orders to set subtotal equal to total as a fallback
      await queryInterface.sequelize.query(`
        UPDATE Orders 
        SET subtotal = total 
        WHERE subtotal IS NULL OR subtotal = 0
      `);
      
      console.log('Updated existing orders with subtotal values');
      
      // Now make it non-nullable
      await queryInterface.changeColumn('Orders', 'subtotal', {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      });
      
      console.log('Updated subtotal column to be non-nullable');
    } else {
      console.log('Subtotal column already exists in Orders table');
    }

    return Promise.resolve();
  } catch (error) {
    console.error('Migration Error:', error);
    return Promise.reject(error);
  }
}

async function down(queryInterface, Sequelize) {
  try {
    // Helper function to check if column exists
    const columnExists = async (tableName, columnName) => {
      try {
        const tableDescription = await queryInterface.describeTable(tableName);
        return !!tableDescription[columnName];
      } catch (error) {
        return false;
      }
    };

    // Remove the subtotal column if it exists
    if (await columnExists('Orders', 'subtotal')) {
      await queryInterface.removeColumn('Orders', 'subtotal');
      console.log('Removed subtotal column from Orders table');
    }

    return Promise.resolve();
  } catch (error) {
    console.error('Migration Rollback Error:', error);
    return Promise.reject(error);
  }
}

module.exports = { up, down }; 