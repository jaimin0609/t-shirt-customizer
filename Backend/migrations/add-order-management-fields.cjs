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

    // Add new columns to the Orders table if they don't exist
    if (!(await columnExists('Orders', 'couponId'))) {
      await queryInterface.addColumn('Orders', 'couponId', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Coupons',
          key: 'id'
        }
      });
      console.log('Added couponId column');
    }

    if (!(await columnExists('Orders', 'trackingNumber'))) {
      await queryInterface.addColumn('Orders', 'trackingNumber', {
        type: DataTypes.STRING,
        allowNull: true
      });
      console.log('Added trackingNumber column');
    }

    if (!(await columnExists('Orders', 'trackingCarrier'))) {
      await queryInterface.addColumn('Orders', 'trackingCarrier', {
        type: DataTypes.STRING,
        allowNull: true
      });
      console.log('Added trackingCarrier column');
    }

    if (!(await columnExists('Orders', 'notes'))) {
      await queryInterface.addColumn('Orders', 'notes', {
        type: DataTypes.TEXT,
        allowNull: true
      });
      console.log('Added notes column');
    }

    if (!(await columnExists('Orders', 'refundAmount'))) {
      await queryInterface.addColumn('Orders', 'refundAmount', {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
      });
      console.log('Added refundAmount column');
    }

    if (!(await columnExists('Orders', 'refundReason'))) {
      await queryInterface.addColumn('Orders', 'refundReason', {
        type: DataTypes.TEXT,
        allowNull: true
      });
      console.log('Added refundReason column');
    }

    if (!(await columnExists('Orders', 'estimatedDeliveryDate'))) {
      await queryInterface.addColumn('Orders', 'estimatedDeliveryDate', {
        type: DataTypes.DATE,
        allowNull: true
      });
      console.log('Added estimatedDeliveryDate column');
    }

    if (!(await columnExists('Orders', 'actualDeliveryDate'))) {
      await queryInterface.addColumn('Orders', 'actualDeliveryDate', {
        type: DataTypes.DATE,
        allowNull: true
      });
      console.log('Added actualDeliveryDate column');
    }

    console.log('Migration: Added order management fields to Orders table');
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

    // Remove the columns if they exist
    if (await columnExists('Orders', 'couponId')) {
      await queryInterface.removeColumn('Orders', 'couponId');
    }
    if (await columnExists('Orders', 'trackingNumber')) {
      await queryInterface.removeColumn('Orders', 'trackingNumber');
    }
    if (await columnExists('Orders', 'trackingCarrier')) {
      await queryInterface.removeColumn('Orders', 'trackingCarrier');
    }
    if (await columnExists('Orders', 'notes')) {
      await queryInterface.removeColumn('Orders', 'notes');
    }
    if (await columnExists('Orders', 'refundAmount')) {
      await queryInterface.removeColumn('Orders', 'refundAmount');
    }
    if (await columnExists('Orders', 'refundReason')) {
      await queryInterface.removeColumn('Orders', 'refundReason');
    }
    if (await columnExists('Orders', 'estimatedDeliveryDate')) {
      await queryInterface.removeColumn('Orders', 'estimatedDeliveryDate');
    }
    if (await columnExists('Orders', 'actualDeliveryDate')) {
      await queryInterface.removeColumn('Orders', 'actualDeliveryDate');
    }

    console.log('Migration Rollback: Removed order management fields from Orders table');
    return Promise.resolve();
  } catch (error) {
    console.error('Migration Rollback Error:', error);
    return Promise.reject(error);
  }
}

module.exports = { up, down }; 