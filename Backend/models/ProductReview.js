import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ProductReview = sequelize.define('ProductReview', {
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
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 5
        }
    },
    title: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    comment: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    isVerifiedPurchase: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isApproved: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    helpfulVotes: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'product_reviews',
    timestamps: true
});

// Add associations
ProductReview.associate = (models) => {
    ProductReview.belongsTo(models.Product, { 
        foreignKey: 'productId',
        as: 'product'
    });
    
    ProductReview.belongsTo(models.User, { 
        foreignKey: 'userId',
        as: 'user'
    });
};

export default ProductReview; 