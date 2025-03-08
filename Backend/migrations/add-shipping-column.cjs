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

    // Add shipping column if it doesn't exist
    if (!(await columnExists('Orders', 'shipping'))) {
      await queryInterface.addColumn('Orders', 'shipping', {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true, // Making it nullable for now
        defaultValue: 0.00
      });
      
      console.log('Added shipping column to Orders table');
      
      // Update existing orders to set shipping to a default value
      await queryInterface.sequelize.query(`
        UPDATE Orders 
        SET shipping = 5.00 
        WHERE shipping IS NULL OR shipping = 0
      `);
      
      console.log('Updated existing orders with shipping values');
      
      // Now make it non-nullable
      await queryInterface.changeColumn('Orders', 'shipping', {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      });
      
      console.log('Updated shipping column to be non-nullable');
    } else {
      console.log('Shipping column already exists in Orders table');
    }

    // Also check if shippingCost column exists, which might be the actual column name
    if (await columnExists('Orders', 'shippingCost')) {
      console.log('ShippingCost column exists - adding shipping column as an alias');
      
      // Copy data from shippingCost to shipping if shipping is new
      if (!(await columnExists('Orders', 'shipping'))) {
        await queryInterface.sequelize.query(`
          UPDATE Orders 
          SET shipping = shippingCost
        `);
        console.log('Copied data from shippingCost to shipping column');
      }
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

    // Remove the shipping column if it exists
    if (await columnExists('Orders', 'shipping')) {
      await queryInterface.removeColumn('Orders', 'shipping');
      console.log('Removed shipping column from Orders table');
    }

    return Promise.resolve();
  } catch (error) {
    console.error('Migration Rollback Error:', error);
    return Promise.reject(error);
  }
}

module.exports = { up, down }; 