import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Product = sequelize.define('Product', {
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
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    discountedPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Current discounted price, calculated from discount fields or promotion'
    },
    discountPercentage: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: { min: 0, max: 100 },
        comment: 'Discount percentage for this product (0-100)',
        defaultValue: 0
    },
    isOnClearance: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether this product is on clearance sale'
    },
    promotionId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID of the specific promotion this product is part of'
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false
    },
    gender: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'unisex'
    },
    ageGroup: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'adult'
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    thumbnail: {
        type: DataTypes.STRING,
        allowNull: true
    },
    imageMetadata: {
        type: DataTypes.JSON,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'draft', 'outOfStock'),
        defaultValue: 'active'
    },
    sales: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    isCustomizable: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    hasVariants: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether this product has color/size variants'
    },
    isFeaturedSale: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether this product should be featured in sale sections'
    }
}, {
    timestamps: true,
    tableName: 'Products'
});

// Define associations
Product.associate = (models) => {
    Product.hasMany(models.OrderItem, {
        foreignKey: 'productId',
        as: 'orderItems'
    });
    Product.hasMany(models.CartItem, {
        foreignKey: 'productId',
        as: 'cartItems'
    });
    // Add relationship with ProductVariant
    Product.hasMany(models.ProductVariant, {
        foreignKey: 'productId',
        as: 'variants'
    });
};

// Add virtual field for availableSizes
Product.prototype.toJSON = function() {
    const values = { ...this.get() };
    // Add default sizes if not present
    if (!values.availableSizes) {
        values.availableSizes = ["S", "M", "L", "XL"];
    }
    return values;
};

export default Product; 