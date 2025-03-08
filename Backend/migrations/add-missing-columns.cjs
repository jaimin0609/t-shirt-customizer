module.exports = {
  async up(queryInterface, Sequelize) {
    // Helper function to check if a column exists
    const columnExists = async (tableName, columnName) => {
      try {
        const [columns] = await queryInterface.sequelize.query(
          `SELECT COLUMN_NAME 
           FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_SCHEMA = '${queryInterface.sequelize.config.database}' 
           AND TABLE_NAME = '${tableName}' 
           AND COLUMN_NAME = '${columnName}'`
        );
        return columns.length > 0;
      } catch (error) {
        console.error(`Error checking if ${columnName} exists in ${tableName}:`, error);
        return false;
      }
    };

    // Add columns to Orders table
    const missingOrderColumns = [
      {
        name: 'subtotal',
        definition: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0.00
        },
        postProcess: async () => {
          await queryInterface.sequelize.query(
            `UPDATE Orders SET subtotal = total WHERE subtotal = 0`
          );
        }
      },
      {
        name: 'shipping',
        definition: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0.00
        },
        postProcess: async () => {
          await queryInterface.sequelize.query(
            `UPDATE Orders SET shipping = shippingCost WHERE shipping = 0 AND shippingCost IS NOT NULL`
          );
          await queryInterface.sequelize.query(
            `UPDATE Orders SET shipping = 5.00 WHERE shipping = 0`
          );
        }
      },
      {
        name: 'discount',
        definition: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0.00
        }
      }
    ];

    // Add missing columns to Orders table
    for (const column of missingOrderColumns) {
      if (!(await columnExists('Orders', column.name))) {
        console.log(`Adding ${column.name} to Orders table`);
        await queryInterface.addColumn('Orders', column.name, column.definition);
        if (column.postProcess) {
          await column.postProcess();
        }
        console.log(`Added ${column.name} to Orders table`);
      } else {
        console.log(`Column ${column.name} already exists in Orders table`);
      }
    }

    // Add columns to OrderItems table
    const missingOrderItemsColumns = [
      {
        name: 'customization',
        definition: {
          type: Sequelize.JSON,
          allowNull: true
        }
      },
      {
        name: 'size',
        definition: {
          type: Sequelize.STRING,
          allowNull: true
        }
      },
      {
        name: 'color',
        definition: {
          type: Sequelize.STRING,
          allowNull: true
        }
      }
    ];

    // Add missing columns to OrderItems table
    for (const column of missingOrderItemsColumns) {
      if (!(await columnExists('OrderItems', column.name))) {
        console.log(`Adding ${column.name} to OrderItems table`);
        await queryInterface.addColumn('OrderItems', column.name, column.definition);
        console.log(`Added ${column.name} to OrderItems table`);
      } else {
        console.log(`Column ${column.name} already exists in OrderItems table`);
      }
    }

    console.log('Migration complete: Added all missing columns to Orders and OrderItems tables');
  },

  async down(queryInterface, Sequelize) {
    // List of columns to remove
    const columnsToRemove = [
      { table: 'Orders', column: 'subtotal' },
      { table: 'Orders', column: 'shipping' },
      { table: 'Orders', column: 'discount' },
      { table: 'OrderItems', column: 'customization' },
      { table: 'OrderItems', column: 'size' },
      { table: 'OrderItems', column: 'color' }
    ];

    // Remove columns
    for (const { table, column } of columnsToRemove) {
      try {
        await queryInterface.removeColumn(table, column);
        console.log(`Removed ${column} from ${table}`);
      } catch (error) {
        console.error(`Error removing ${column} from ${table}:`, error);
      }
    }

    return Promise.resolve();
  }
}; 