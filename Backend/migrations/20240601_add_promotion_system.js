import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
  // Create Promotions table
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

  // Add discount fields to Products table
  await queryInterface.addColumn('Products', 'discountedPrice', {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  });

  await queryInterface.addColumn('Products', 'discountPercentage', {
    type: DataTypes.INTEGER,
    allowNull: true
  });

  await queryInterface.addColumn('Products', 'isOnClearance', {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  });

  await queryInterface.addColumn('Products', 'promotionId', {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Promotions',
      key: 'id'
    }
  });

  await queryInterface.addColumn('Products', 'isFeaturedSale', {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  });
}

export async function down(queryInterface, Sequelize) {
  // Remove columns from Products
  await queryInterface.removeColumn('Products', 'discountedPrice');
  await queryInterface.removeColumn('Products', 'discountPercentage');
  await queryInterface.removeColumn('Products', 'isOnClearance');
  await queryInterface.removeColumn('Products', 'promotionId');
  await queryInterface.removeColumn('Products', 'isFeaturedSale');

  // Drop Promotions table
  await queryInterface.dropTable('Promotions');
} 