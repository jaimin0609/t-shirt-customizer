import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Coupon = sequelize.define('Coupon', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
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
        defaultValue: true
    },
    usageLimit: {
        type: DataTypes.INTEGER,
        defaultValue: null,
        allowNull: true
    },
    usageCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    minimumPurchase: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    isPublic: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether to display this coupon in the promotion banner'
    },
    bannerText: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Text to display in the promotion banner'
    },
    bannerColor: {
        type: DataTypes.STRING,
        defaultValue: '#3b82f6',
        comment: 'Background color for the promotion banner'
    }
}, {
    timestamps: true
});

export default Coupon; 