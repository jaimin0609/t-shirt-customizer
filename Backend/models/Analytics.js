import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Analytics extends Model {}

Analytics.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    sessionId: {
        type: DataTypes.STRING,
        allowNull: false,
        index: true
    },
    pageViewId: {
        type: DataTypes.STRING,
        allowNull: true,
        index: true
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false
    },
    eventType: {
        type: DataTypes.STRING,
        allowNull: false,
        index: true
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    referrer: {
        type: DataTypes.STRING,
        allowNull: true
    },
    userAgent: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    path: {
        type: DataTypes.STRING,
        allowNull: true,
        index: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: true
    },
    queryParams: {
        type: DataTypes.STRING,
        allowNull: true
    },
    productId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        index: true
    },
    productName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    screenWidth: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    screenHeight: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    language: {
        type: DataTypes.STRING,
        allowNull: true
    },
    duration: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    cartTotal: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    timeOnPage: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    // Additional JSON field for any other properties
    eventData: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const value = this.getDataValue('eventData');
            return value ? JSON.parse(value) : null;
        },
        set(value) {
            this.setDataValue('eventData', value ? JSON.stringify(value) : null);
        }
    }
}, {
    sequelize,
    modelName: 'Analytics',
    timestamps: true,
    indexes: [
        {
            name: 'analytics_session_event_idx',
            fields: ['sessionId', 'eventType', 'timestamp']
        },
        {
            name: 'analytics_product_idx',
            fields: ['productId', 'eventType']
        },
        {
            name: 'analytics_date_idx',
            fields: ['timestamp']
        }
    ]
});

export default Analytics; 