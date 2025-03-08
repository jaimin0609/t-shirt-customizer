import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
  try {
    // Add new columns to the Orders table
    await queryInterface.addColumn('Orders', 'couponId', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Coupons',
        key: 'id'
      }
    });

    await queryInterface.addColumn('Orders', 'trackingNumber', {
      type: DataTypes.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('Orders', 'trackingCarrier', {
      type: DataTypes.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('Orders', 'notes', {
      type: DataTypes.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('Orders', 'refundAmount', {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    });

    await queryInterface.addColumn('Orders', 'refundReason', {
      type: DataTypes.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('Orders', 'estimatedDeliveryDate', {
      type: DataTypes.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('Orders', 'actualDeliveryDate', {
      type: DataTypes.DATE,
      allowNull: true
    });

    console.log('Migration: Added order management fields to Orders table');
    return Promise.resolve();
  } catch (error) {
    console.error('Migration Error:', error);
    return Promise.reject(error);
  }
}

export async function down(queryInterface, Sequelize) {
  try {
    // Remove the columns if we need to rollback
    await queryInterface.removeColumn('Orders', 'couponId');
    await queryInterface.removeColumn('Orders', 'trackingNumber');
    await queryInterface.removeColumn('Orders', 'trackingCarrier');
    await queryInterface.removeColumn('Orders', 'notes');
    await queryInterface.removeColumn('Orders', 'refundAmount');
    await queryInterface.removeColumn('Orders', 'refundReason');
    await queryInterface.removeColumn('Orders', 'estimatedDeliveryDate');
    await queryInterface.removeColumn('Orders', 'actualDeliveryDate');

    console.log('Migration Rollback: Removed order management fields from Orders table');
    return Promise.resolve();
  } catch (error) {
    console.error('Migration Rollback Error:', error);
    return Promise.reject(error);
  }
} 