import express from 'express';
import { Customer, Order, User, OrderItem, Product } from '../models/index.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get all customers
router.get('/', auth, async (req, res) => {
    console.log('GET /customers - Received request from:', req.ip);
    try {
        // Log auth info for debugging
        console.log('User auth info:', {
            userId: req.user?.id,
            role: req.user?.role,
            tokenPresent: !!req.headers.authorization
        });

        const customers = await Customer.findAll({
            include: [{
                model: User,
                as: 'user',
                attributes: ['username', 'email', 'status']
            }],
            order: [['createdAt', 'DESC']]
        });
        
        // Ensure totalSpent is a number
        const processedCustomers = customers.map(customer => {
            const plainCustomer = customer.get({ plain: true });
            // Convert totalSpent to a number
            plainCustomer.totalSpent = Number(plainCustomer.totalSpent || 0);
            return plainCustomer;
        });
        
        console.log(`GET /customers - Found ${customers.length} customers`);
        console.log('First customer totalSpent:', processedCustomers[0]?.totalSpent, 
                    'type:', typeof processedCustomers[0]?.totalSpent);
        
        res.json(processedCustomers);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ 
            message: 'Error fetching customers', 
            error: error.message,
            stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
        });
    }
});

// Get single customer
router.get('/:id', auth, async (req, res) => {
    console.log(`GET /customers/${req.params.id} - Received request`);
    try {
        // Check if we should skip associations (for troubleshooting association issues)
        const skipAssociations = req.query.skipAssociations === 'true';
        console.log(`Skip associations: ${skipAssociations}`);
        
        // Define query options
        const queryOptions = {
            where: { id: req.params.id }
        };
        
        // Include associations unless skipped
        if (!skipAssociations) {
            queryOptions.include = [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'email', 'status']
                },
                {
                    model: Order,
                    as: 'orders',
                    include: [
                        {
                            model: OrderItem,
                            as: 'items',
                            include: [
                                {
                                    model: Product,
                                    as: 'product',
                                    attributes: ['id', 'name', 'price', 'imageUrl']
                                }
                            ]
                        }
                    ]
                }
            ];
        } else {
            // If skipping associations, include only user data
            queryOptions.include = [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'email', 'status']
                }
            ];
        }
        
        const customer = await Customer.findOne(queryOptions);
        
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        
        const plainCustomer = customer.get({ plain: true });
        
        // Ensure totalSpent is a number
        plainCustomer.totalSpent = Number(plainCustomer.totalSpent || 0);
        
        console.log(`GET /customers/${req.params.id} - Found customer`);
        
        // Return only the customer object (not wrapped in another object)
        // This matches what the frontend expects
        res.json(plainCustomer);
    } catch (error) {
        console.error(`Error fetching customer ${req.params.id}:`, error);
        res.status(500).json({ 
            message: 'Error fetching customer', 
            error: error.message,
            stack: process.env.NODE_ENV === 'production' ? undefined : error.stack 
        });
    }
});

// Create customer
router.post('/', auth, async (req, res) => {
    try {
        const {
            firstName, lastName, email, phone, address,
            city, state, zipCode, country, notes
        } = req.body;

        // Create user first
        const user = await User.create({
            username: email,
            email,
            password: Math.random().toString(36).slice(-8), // Generate random password
            role: 'user',
            name: `${firstName} ${lastName}`
        });

        // Create customer profile
        const customer = await Customer.create({
            userId: user.id,
            firstName,
            lastName,
            email,
            phone,
            address,
            city,
            state,
            zipCode,
            country,
            notes,
            isDefaultShippingAddress: true
        });

        res.status(201).json(customer);
    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({ message: 'Error creating customer', error: error.message });
    }
});

// Update customer
router.put('/:id', auth, async (req, res) => {
    try {
        const customer = await Customer.findByPk(req.params.id);

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        const {
            firstName, lastName, email, phone, address,
            city, state, zipCode, country, notes, status,
            isDefaultShippingAddress
        } = req.body;

        await customer.update({
            firstName,
            lastName,
            email,
            phone,
            address,
            city,
            state,
            zipCode,
            country,
            notes,
            status,
            isDefaultShippingAddress
        });

        // Update associated user if email changed
        if (email && email !== customer.email) {
            await User.update(
                { email, username: email },
                { where: { id: customer.userId } }
            );
        }

        const updatedCustomer = await Customer.findByPk(req.params.id, {
            include: [{
                model: User,
                as: 'user',
                attributes: ['username', 'email', 'status']
            }]
        });

        res.json(updatedCustomer);
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ message: 'Error updating customer', error: error.message });
    }
});

// Delete customer
router.delete('/:id', auth, async (req, res) => {
    try {
        const customer = await Customer.findByPk(req.params.id);

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Instead of deleting, mark as inactive
        await customer.update({ status: 'inactive' });
        await User.update(
            { status: 'inactive' },
            { where: { id: customer.userId } }
        );

        res.json({ message: 'Customer deactivated successfully' });
    } catch (error) {
        console.error('Error deactivating customer:', error);
        res.status(500).json({ message: 'Error deactivating customer', error: error.message });
    }
});

// Get customer orders
router.get('/:id/orders', auth, async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: { userId: req.params.id },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email', 'profileImage']
                },
                {
                    model: OrderItem,
                    as: 'items',
                    include: [{
                        model: Product,
                        as: 'product',
                        attributes: ['id', 'name', 'price', 'image']
                    }]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json(orders);
    } catch (error) {
        console.error('Error fetching customer orders:', error);
        res.status(500).json({ 
            message: 'Error fetching customer orders',
            error: error.message 
        });
    }
});

export default router; 