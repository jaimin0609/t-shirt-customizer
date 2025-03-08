export default {
    up: async (queryInterface, Sequelize) => {
        // Drop the existing Orders table if it exists
        await queryInterface.dropTable('Orders', { cascade: true });
        
        // Create the Orders table with the new schema
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
            status: {
                type: Sequelize.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled'),
                defaultValue: 'pending'
            },
            total: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            subtotal: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            shipping: {
                type: Sequelize.DECIMAL(10, 2),
                defaultValue: 0.00
            },
            shippingAddress: {
                type: Sequelize.JSON,
                allowNull: false
            },
            paymentMethod: {
                type: Sequelize.STRING,
                allowNull: false
            },
            paymentStatus: {
                type: Sequelize.ENUM('pending', 'paid', 'failed'),
                defaultValue: 'pending'
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
        await queryInterface.addIndex('Orders', ['status']);
        await queryInterface.addIndex('Orders', ['createdAt']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('Orders');
    }
}; 