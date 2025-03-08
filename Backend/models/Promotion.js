import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Promotion = sequelize.define('Promotion', {
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
    }
}, {
    timestamps: true,
    tableName: 'Promotions'
});

// Define associations if needed
Promotion.associate = (models) => {
    Promotion.hasMany(models.Product, {
        foreignKey: 'promotionId',
        as: 'products'
    });
};

export default Promotion; 