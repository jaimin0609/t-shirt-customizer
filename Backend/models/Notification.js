import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Type of notification (order, user, system, etc.)'
    },
    title: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Short title of notification'
    },
    message: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Notification message content'
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether notification has been read'
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'User ID the notification is for (null = all admins)'
    },
    targetId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID of related entity (order ID, product ID, etc.)'
    },
    targetType: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Type of related entity (order, product, etc.)'
    },
    icon: {
        type: DataTypes.STRING(50),
        defaultValue: 'bell',
        comment: 'Icon to display (Bootstrap icon name)'
    },
    color: {
        type: DataTypes.STRING(20),
        defaultValue: 'primary',
        comment: 'Color scheme for notification (Bootstrap color)'
    },
    link: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'URL to navigate to when clicked'
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
    tableName: 'notifications',
    timestamps: true
});

export default Notification; 