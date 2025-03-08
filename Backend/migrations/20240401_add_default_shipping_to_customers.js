import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

async function up() {
    try {
        await sequelize.getQueryInterface().addColumn(
            'customers',
            'isDefaultShippingAddress',
            {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
                allowNull: false
            }
        );
        console.log('Added isDefaultShippingAddress column to customers table');
    } catch (error) {
        console.error('Error adding isDefaultShippingAddress column:', error);
    }
}

async function down() {
    try {
        await sequelize.getQueryInterface().removeColumn(
            'customers',
            'isDefaultShippingAddress'
        );
        console.log('Removed isDefaultShippingAddress column from customers table');
    } catch (error) {
        console.error('Error removing isDefaultShippingAddress column:', error);
    }
}

export { up, down }; 