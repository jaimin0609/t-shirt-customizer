import sequelize from './config/database.js';
import { DataTypes } from 'sequelize';

async function createPromotionsTable() {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    console.log('Checking if Promotions table exists...');
    
    // Check if the table exists
    const tables = await queryInterface.showAllTables();
    
    if (!tables.includes('Promotions')) {
      console.log('Creating Promotions table...');
      
      await queryInterface.createTable('Promotions', {
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
        discountType: {
          type: DataTypes.ENUM('percentage', 'fixed_amount'),
          defaultValue: 'percentage'
        },
        discountValue: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false
        },
        startDate: {
          type: DataTypes.DATE,
          allowNull: false
        },
        endDate: {
          type: DataTypes.DATE,
          allowNull: false
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        promotionType: {
          type: DataTypes.ENUM('store_wide', 'category', 'product_specific', 'clearance'),
          defaultValue: 'store_wide'
        },
        applicableCategories: {
          type: DataTypes.JSON,
          allowNull: true
        },
        applicableProducts: {
          type: DataTypes.JSON,
          allowNull: true
        },
        minimumPurchase: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: true
        },
        usageLimit: {
          type: DataTypes.INTEGER,
          allowNull: true
        },
        currentUsage: {
          type: DataTypes.INTEGER,
          defaultValue: 0
        },
        bannerImage: {
          type: DataTypes.STRING,
          allowNull: true
        },
        highlightColor: {
          type: DataTypes.STRING,
          allowNull: true
        },
        priority: {
          type: DataTypes.INTEGER,
          defaultValue: 0
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false
        }
      });
      
      console.log('Promotions table created successfully!');
    } else {
      console.log('Promotions table already exists.');
    }
  } catch (error) {
    console.error('Error creating Promotions table:', error);
  } finally {
    await sequelize.close();
  }
}

createPromotionsTable(); 