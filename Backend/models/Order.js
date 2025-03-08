import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    orderNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        defaultValue: () => 'ORD' + Date.now() + Math.floor(Math.random() * 1000)
    },
    total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    shipping: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    status: {
        type: DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled'),
        defaultValue: 'pending'
    },
    paymentStatus: {
        type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
        defaultValue: 'pending'
    },
    paymentMethod: {
        type: DataTypes.STRING,
        allowNull: false
    },
    shippingAddress: {
        type: DataTypes.JSON,
        allowNull: false
    },
    couponId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Coupons',
            key: 'id'
        }
    },
    trackingNumber: {
        type: DataTypes.STRING,
        allowNull: true
    },
    trackingCarrier: {
        type: DataTypes.STRING,
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    refundAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    refundReason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    estimatedDeliveryDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    actualDeliveryDate: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'Orders'
});

export default Order; 