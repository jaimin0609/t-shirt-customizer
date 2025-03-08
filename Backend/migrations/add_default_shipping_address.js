import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';

export async function up() {
    try {
        // Step 1: Check if column exists
        const columnsResult = await sequelize.query(
            "SHOW COLUMNS FROM customers LIKE 'isDefaultShippingAddress'",
            { type: QueryTypes.SELECT }
        );

        // Only add column if it doesn't exist
        if (columnsResult.length === 0) {
            console.log('Adding isDefaultShippingAddress column to customers table...');
            await sequelize.query(
                "ALTER TABLE customers ADD COLUMN isDefaultShippingAddress BOOLEAN DEFAULT TRUE COMMENT 'Indicates if the address is used as default shipping address'"
            );
            console.log('Column added successfully.');
        } else {
            console.log('Column isDefaultShippingAddress already exists in customers table.');
        }

        return true;
    } catch (error) {
        console.error('Error during migration:', error);
        throw error;
    }
}

export async function down() {
    try {
        // Check if column exists before dropping
        const columnsResult = await sequelize.query(
            "SHOW COLUMNS FROM customers LIKE 'isDefaultShippingAddress'",
            { type: QueryTypes.SELECT }
        );

        // Only drop column if it exists
        if (columnsResult.length > 0) {
            console.log('Removing isDefaultShippingAddress column from customers table...');
            await sequelize.query(
                "ALTER TABLE customers DROP COLUMN isDefaultShippingAddress"
            );
            console.log('Column removed successfully.');
        } else {
            console.log('Column isDefaultShippingAddress does not exist in customers table.');
        }

        return true;
    } catch (error) {
        console.error('Error during rollback:', error);
        throw error;
    }
} 