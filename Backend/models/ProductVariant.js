import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ProductVariant = sequelize.define('ProductVariant', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Products',
            key: 'id'
        }
    },
    // Can be 'color', 'size', or 'color_size' for combined variants
    type: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'color'
    },
    // For color variants
    color: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Color name (e.g., "Red", "Blue")'
    },
    colorCode: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Color hex code (e.g., "#FF0000" for red)'
    },
    // For size variants
    size: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Size value (e.g., "S", "M", "L")'
    },
    // Stock specific to this variant
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    // Price adjustment relative to base product price (can be positive or negative)
    priceAdjustment: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    // Images specific to this variant
    image: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Main image for this variant'
    },
    // Additional images for the variant
    additionalImages: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Array of additional image URLs'
    },
    // SKU for this specific variant
    sku: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    // Status of this variant
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'outOfStock'),
        defaultValue: 'active'
    }
}, {
    timestamps: true,
    tableName: 'ProductVariants'
});

// Define associations
ProductVariant.associate = (models) => {
    ProductVariant.belongsTo(models.Product, {
        foreignKey: 'productId',
        as: 'product'
    });
};

export default ProductVariant; 