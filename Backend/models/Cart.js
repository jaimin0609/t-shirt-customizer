import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Cart = sequelize.define('Cart', {
    status: {
        type: DataTypes.ENUM('active', 'converted', 'abandoned'),
        defaultValue: 'active',
        allowNull: false
    },
    total: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        validate: {
            min: 0
        }
    }
}, {
    hooks: {
        beforeValidate: (cart) => {
            if (cart.total === null || cart.total === undefined) {
                cart.total = 0;
            }
        }
    }
});

export default Cart; 