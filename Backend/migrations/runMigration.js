import sequelize from './config/database.js';
import { DataTypes } from 'sequelize';

async function runMigration() {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    console.log('Starting migration...');
    
    // Check if columns already exist first
    const tableInfo = await queryInterface.describeTable('Products');
    
    // Add columns if they don't exist
    if (!tableInfo.discountedPrice) {
      console.log('Adding discountedPrice column...');
      await queryInterface.addColumn('Products', 'discountedPrice', {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
      });
    }
    
    if (!tableInfo.discountPercentage) {
      console.log('Adding discountPercentage column...');
      await queryInterface.addColumn('Products', 'discountPercentage', {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
      });
    }
    
    if (!tableInfo.isOnClearance) {
      console.log('Adding isOnClearance column...');
      await queryInterface.addColumn('Products', 'isOnClearance', {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      });
    }
    
    if (!tableInfo.promotionId) {
      console.log('Adding promotionId column...');
      await queryInterface.addColumn('Products', 'promotionId', {
        type: DataTypes.INTEGER,
        allowNull: true
      });
    }
    
    if (!tableInfo.isFeaturedSale) {
      console.log('Adding isFeaturedSale column...');
      await queryInterface.addColumn('Products', 'isFeaturedSale', {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      });
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sequelize.close();
  }
}

runMigration(); 