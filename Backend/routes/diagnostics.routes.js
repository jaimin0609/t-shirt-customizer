import express from 'express';
import { Customer, Order, User, OrderItem, Product } from '../models/index.js';
import { auth, isAdmin } from '../middleware/auth.js';
import { Op } from 'sequelize';

const router = express.Router();

// Get model structure and relationships
router.get('/models', auth, isAdmin, async (req, res) => {
    try {
        // Collect model metadata
        const modelInfo = {
            Customer: {
                associations: Object.keys(Customer.associations).map(key => ({
                    name: key,
                    type: Customer.associations[key].associationType,
                    target: Customer.associations[key].target.name
                })),
                attributes: Object.keys(Customer.rawAttributes)
            },
            Order: {
                associations: Object.keys(Order.associations).map(key => ({
                    name: key,
                    type: Order.associations[key].associationType,
                    target: Order.associations[key].target.name
                })),
                attributes: Object.keys(Order.rawAttributes)
            },
            User: {
                associations: Object.keys(User.associations).map(key => ({
                    name: key,
                    type: User.associations[key].associationType,
                    target: User.associations[key].target.name
                })),
                attributes: Object.keys(User.rawAttributes)
            }
        };

        res.json(modelInfo);
    } catch (error) {
        console.error('Error in diagnostic models route:', error);
        res.status(500).json({ 
            message: 'Error retrieving model information', 
            error: error.message,
            stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
        });
    }
});

// Test Customer-Order association
router.get('/test-associations', auth, isAdmin, async (req, res) => {
    try {
        // Try to find a customer with orders
        const customer = await Customer.findOne({
            include: [{
                model: Order,
                as: 'orders'
            }],
            logging: console.log
        });

        if (!customer) {
            return res.json({ 
                success: false, 
                message: 'No customers found with orders' 
            });
        }

        res.json({
            success: true,
            customer: {
                id: customer.id,
                firstName: customer.firstName,
                lastName: customer.lastName,
                ordersCount: customer.orders ? customer.orders.length : 0
            }
        });
    } catch (error) {
        console.error('Error testing associations:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error testing associations', 
            error: error.message,
            stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
        });
    }
});

export default router; 