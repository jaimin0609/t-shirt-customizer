'use strict';

export default {
    async up(queryInterface, Sequelize) {
        // Users table
        await queryInterface.createTable('Users', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            email: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },
            password: {
                type: Sequelize.STRING,
                allowNull: false
            },
            role: {
                type: Sequelize.ENUM('admin', 'user'),
                defaultValue: 'user'
            },
            profileImage: {
                type: Sequelize.STRING,
                allowNull: true
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false
            }
        });

        // Products table
        await queryInterface.createTable('Products', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            price: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            category: {
                type: Sequelize.STRING,
                allowNull: false
            },
            stock: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            image: {
                type: Sequelize.STRING,
                allowNull: true
            },
            thumbnail: {
                type: Sequelize.STRING,
                allowNull: true
            },
            imageMetadata: {
                type: Sequelize.JSON,
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM('active', 'inactive'),
                defaultValue: 'active'
            },
            sales: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false
            }
        });

        // Orders table
        await queryInterface.createTable('Orders', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            orderNumber: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },
            totalAmount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            status: {
                type: Sequelize.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled'),
                defaultValue: 'pending'
            },
            paymentStatus: {
                type: Sequelize.ENUM('pending', 'paid', 'failed', 'refunded'),
                defaultValue: 'pending'
            },
            paymentMethod: {
                type: Sequelize.STRING,
                allowNull: false
            },
            shippingAddress: {
                type: Sequelize.JSON,
                allowNull: false
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false
            }
        });

        // OrderItems table
        await queryInterface.createTable('OrderItems', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            orderId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Orders',
                    key: 'id'
                }
            },
            productId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Products',
                    key: 'id'
                }
            },
            quantity: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 1
            },
            price: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            customization: {
                type: Sequelize.JSON,
                allowNull: true
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false
            }
        });

        // Add indexes
        await queryInterface.addIndex('Orders', ['userId']);
        await queryInterface.addIndex('OrderItems', ['orderId']);
        await queryInterface.addIndex('OrderItems', ['productId']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('OrderItems');
        await queryInterface.dropTable('Orders');
        await queryInterface.dropTable('Products');
        await queryInterface.dropTable('Users');
    }
}; 