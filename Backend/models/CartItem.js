import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CartItem = sequelize.define('CartItem', {
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            min: 1
        }
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    customization: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
    }
}, {
    hooks: {
        beforeValidate: (cartItem) => {
            if (!cartItem.customization) {
                cartItem.customization = {};
            }
        }
    }
});

export default CartItem; 