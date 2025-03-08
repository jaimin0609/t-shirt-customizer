import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'mysql'
});

async function createTables() {
    try {
        // Users table
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS Users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'user') DEFAULT 'user',
                profileImage VARCHAR(255),
                createdAt DATETIME NOT NULL,
                updatedAt DATETIME NOT NULL
            );
        `);

        // Products table
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS Products (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                category VARCHAR(255) NOT NULL,
                stock INT DEFAULT 0,
                image VARCHAR(255),
                thumbnail VARCHAR(255),
                imageMetadata JSON,
                status ENUM('active', 'inactive') DEFAULT 'active',
                sales INT DEFAULT 0,
                createdAt DATETIME NOT NULL,
                updatedAt DATETIME NOT NULL
            );
        `);

        // Orders table
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS Orders (
                id INT PRIMARY KEY AUTO_INCREMENT,
                userId INT NOT NULL,
                orderNumber VARCHAR(255) NOT NULL UNIQUE,
                totalAmount DECIMAL(10,2) NOT NULL,
                status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
                paymentStatus ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
                paymentMethod VARCHAR(255) NOT NULL,
                shippingAddress JSON NOT NULL,
                createdAt DATETIME NOT NULL,
                updatedAt DATETIME NOT NULL,
                FOREIGN KEY (userId) REFERENCES Users(id)
            );
        `);

        // OrderItems table
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS OrderItems (
                id INT PRIMARY KEY AUTO_INCREMENT,
                orderId INT NOT NULL,
                productId INT NOT NULL,
                quantity INT NOT NULL DEFAULT 1,
                price DECIMAL(10,2) NOT NULL,
                customization JSON,
                createdAt DATETIME NOT NULL,
                updatedAt DATETIME NOT NULL,
                FOREIGN KEY (orderId) REFERENCES Orders(id),
                FOREIGN KEY (productId) REFERENCES Products(id)
            );
        `);

        // Add indexes
        await sequelize.query('CREATE INDEX idx_orders_userId ON Orders(userId);');
        await sequelize.query('CREATE INDEX idx_orderitems_orderId ON OrderItems(orderId);');
        await sequelize.query('CREATE INDEX idx_orderitems_productId ON OrderItems(productId);');

        console.log('All tables created successfully!');
    } catch (error) {
        console.error('Error creating tables:', error);
    } finally {
        await sequelize.close();
    }
}

createTables(); 