const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME || 'tshirt_customizer',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || 'password',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        logging: console.log
    }
);

async function checkOrderItemsTable() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
        
        // Get the OrderItems table structure
        const [results] = await sequelize.query('SHOW FULL COLUMNS FROM `OrderItems`');
        console.log('OrderItems Table Structure:');
        console.table(results);
        
        // Additional check to see if customization column exists
        const customizationCheck = results.some(col => col.Field === 'customization');
        console.log(`Customization column exists: ${customizationCheck}`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error checking OrderItems table:', error);
        process.exit(1);
    }
}

checkOrderItemsTable(); 