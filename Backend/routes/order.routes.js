import express from 'express';
import { Order, Cart, CartItem, Product, User, OrderItem, Customer, Coupon } from '../models/index.js';
import { auth } from '../middleware/auth.js';
import { includePatterns } from '../utils/queryIncludes.js';
import { handleError, asyncHandler } from '../utils/errorHandler.js';
import { Op } from 'sequelize';
import sequelize from 'sequelize';

const router = express.Router();

// Generate unique order number
function generateOrderNumber() {
    return 'ORD' + Date.now() + Math.floor(Math.random() * 1000);
}

// Helper function to format order data
function formatOrder(order) {
    console.log(`Formatting order ${order.id}`);
    
    try {
        // Convert Sequelize model to plain object
        const plainOrder = order.toJSON ? order.toJSON() : order;
        
        // Format customer info if available
        if (plainOrder.user) {
            plainOrder.customer = {
                id: plainOrder.user.id,
                name: `${plainOrder.user.firstName || ''} ${plainOrder.user.lastName || ''}`.trim(),
                email: plainOrder.user.email,
                phone: plainOrder.user.phone || 'N/A',
                avatar: plainOrder.user.avatar || '/admin/img/default-avatar.png'
            };
            
            // Remove raw user data to avoid duplication
            delete plainOrder.user;
        } else {
            plainOrder.customer = {
                name: 'Guest User',
                email: 'N/A',
                phone: 'N/A',
                avatar: '/admin/img/default-avatar.png'
            };
        }
        
        // Ensure items are correctly formatted
        if (plainOrder.orderItems && Array.isArray(plainOrder.orderItems)) {
            plainOrder.items = plainOrder.orderItems.map(item => {
                const formattedItem = {
                    id: item.id,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.quantity * item.price,
                };
                
                if (item.product) {
                    formattedItem.product = {
                        id: item.product.id,
                        name: item.product.name,
                        sku: item.product.sku,
                        image: item.product.image || '/admin/img/default-product.png'
                    };
                } else {
                    formattedItem.product = {
                        name: 'Unknown Product',
                        sku: 'N/A',
                        image: '/admin/img/default-product.png'
                    };
                }
                
                return formattedItem;
            });
        }
        
        return plainOrder;
    } catch (error) {
        console.error('Error formatting order:', error);
        // Return the original order if formatting fails
        return order;
    }
}

// Get all orders with filtering and search (admin route)
router.get('/admin/all', auth, asyncHandler(async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }

        console.log('Admin requesting all orders with query:', req.query);
        
        const { search, status, startDate, endDate, sort, order } = req.query;
        
        // Build where clause
        const whereClause = {};
        
        if (status && status !== 'all') {
            whereClause.status = status;
        }
        
        if (startDate && endDate) {
            whereClause.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        } else if (startDate) {
            whereClause.createdAt = {
                [Op.gte]: new Date(startDate)
            };
        } else if (endDate) {
            whereClause.createdAt = {
                [Op.lte]: new Date(endDate)
            };
        }
        
        console.log('Using where clause:', JSON.stringify(whereClause));
        
        // Create a new array with a deep copy of the include patterns
        const includes = [...includePatterns.fullOrderIncludes.map(include => ({...include}))];
        
        // Add search functionality
        if (search) {
            // Add User model for searching by customer name or email
            includes.push({
                model: User,
                as: 'user',
                where: {
                    [Op.or]: [
                        { name: { [Op.like]: `%${search}%` } },
                        { email: { [Op.like]: `%${search}%` } }
                    ]
                },
                required: false
            });
            
            // Add Customer model for searching by customer name or email
            includes.push({
                model: Customer,
                as: 'customer',
                where: {
                    [Op.or]: [
                        { firstName: { [Op.like]: `%${search}%` } },
                        { lastName: { [Op.like]: `%${search}%` } },
                        { email: { [Op.like]: `%${search}%` } }
                    ]
                },
                required: false
            });
            
            // Also search by order number
            whereClause[Op.or] = [
                { orderNumber: { [Op.like]: `%${search}%` } }
            ];
        }

        const orders = await Order.findAll({
            where: whereClause,
            include: includes,
            order: [
                ['createdAt', 'DESC'] // Default to newest first
            ]
        });
        
        console.log(`Found ${orders.length} orders`);
        
        const formattedOrders = orders.map(order => formatOrder(order));
        res.json(formattedOrders);
    } catch (error) {
        console.error('Error getting admin orders:', error);
        res.status(500).json({ message: error.message });
    }
}));

// Get user's orders
router.get('/', auth, asyncHandler(async (req, res) => {
    // If the user is an admin, return all orders (similar to admin/all endpoint but with simpler formatting)
    // This helps support the admin UI that's calling /api/orders directly
    if (req.user.role === 'admin') {
        const orders = await Order.findAll({
            include: [...includePatterns.fullOrderIncludes.map(include => ({...include}))],
            order: [['createdAt', 'DESC']]
        });

        const formattedOrders = orders.map(order => formatOrder(order));
        return res.json(formattedOrders);
    }

    // For regular users, only return their own orders
    const orders = await Order.findAll({
        where: { userId: req.user.id },
        include: [
            includePatterns.basicUser,
            includePatterns.orderItems
        ],
        order: [['createdAt', 'DESC']]
    });

    const formattedOrders = orders.map(order => formatOrder(order));
    res.json(formattedOrders);
}));

// Get order details by order number
router.get('/by-number/:orderNumber', auth, asyncHandler(async (req, res) => {
    const order = await Order.findOne({
        where: { 
            orderNumber: req.params.orderNumber,
            userId: req.user.id
        },
        include: [...includePatterns.fullOrderIncludes.map(include => ({...include}))]
    });

    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }

    res.json(formatOrder(order));
}));

// Get order by ID
router.get('/:id', auth, asyncHandler(async (req, res) => {
    const order = await Order.findByPk(req.params.id, {
        include: [...includePatterns.fullOrderIncludes.map(include => ({...include}))]
    });

    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is authorized to view this order (admin or order owner)
    if (req.user.role !== 'admin' && order.userId !== req.user.id) {
        return res.status(403).json({ message: 'Unauthorized to view this order' });
    }

    res.json(formatOrder(order));
}));

// Create a new order
router.post('/', auth, asyncHandler(async (req, res) => {
    const { items = [], userId, total, subtotal, shipping, shippingAddress, paymentMethod, couponId } = req.body;

    try {
        // Create the order record
        const order = await Order.create({
            orderNumber: generateOrderNumber(),
            userId: userId || req.user.id,
            total,
            subtotal,
            shipping,
            shippingAddress,
            paymentMethod,
            status: 'pending',
            paymentStatus: 'pending',
            couponId
        });

        // Check if we have items to add to the order
        if (items && items.length > 0) {
            // Create order items
            await Promise.all(items.map(item => 
                OrderItem.create({
                    orderId: order.id,
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price,
                    customization: item.customization || null
                })
            ));

            // Update inventory (reduce stock)
            await Promise.all(items.map(async (item) => {
                const product = await Product.findByPk(item.productId);
                if (product) {
                    product.stock = Math.max(0, product.stock - item.quantity);
                    await product.save();
                }
            }));
        } else {
            console.log('No items provided with order:', order.id);
        }

        // Return the created order
        res.status(201).json({ 
            message: 'Order created successfully', 
            order: { 
                id: order.id, 
                orderNumber: order.orderNumber 
            } 
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ 
            message: 'Error processing request', 
            error: error.message,
            stack: error.stack
        });
    }
}));

// Cancel order
router.post('/:orderNumber/cancel', auth, asyncHandler(async (req, res) => {
    const order = await Order.findOne({
        where: { 
            orderNumber: req.params.orderNumber,
            userId: req.user.id,
            status: 'pending'
        }
    });

    if (!order) {
        return res.status(404).json({ message: 'Order not found or cannot be cancelled' });
    }

    await order.update({ 
        status: 'cancelled',
        paymentStatus: order.paymentStatus === 'paid' ? 'refunded' : 'cancelled'
    });

    // Restore inventory (add back to stock)
    const orderItems = await OrderItem.findAll({
        where: { orderId: order.id },
        include: [{ model: Product, as: 'product' }]
    });

    await Promise.all(orderItems.map(async (item) => {
        if (item.product) {
            await item.product.update({
                stock: item.product.stock + item.quantity
            });
        }
    }));

    const updatedOrder = await Order.findByPk(order.id, {
        include: [...includePatterns.fullOrderIncludes.map(include => ({...include}))]
    });

    res.json(formatOrder(updatedOrder));
}));

// Get admin order details by ID
router.get('/admin/:id', auth, asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized access' });
    }

    const order = await Order.findByPk(req.params.id, {
        include: [...includePatterns.fullOrderIncludes.map(include => ({...include}))]
    });

    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }

    res.json(formatOrder(order));
}));

// Update order status
router.put('/admin/status/:id', auth, asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized access' });
    }

    const { status } = req.body;
    if (!status) {
        return res.status(400).json({ message: 'Status is required' });
    }

    const order = await Order.findByPk(req.params.id);
    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    await order.save();

    // Return updated order with all details
    const updatedOrder = await Order.findByPk(req.params.id, {
        include: [...includePatterns.fullOrderIncludes.map(include => ({...include}))]
    });

    res.json(formatOrder(updatedOrder));
}));

// Update tracking information
router.put('/admin/tracking/:id', auth, asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized access' });
    }

    const { trackingNumber, trackingCarrier, estimatedDeliveryDate } = req.body;
    
    const order = await Order.findByPk(req.params.id);
    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }

    // Update tracking information
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (trackingCarrier) order.trackingCarrier = trackingCarrier;
    if (estimatedDeliveryDate) order.estimatedDeliveryDate = new Date(estimatedDeliveryDate);
    
    await order.save();

    // Return updated order with all details
    const updatedOrder = await Order.findByPk(req.params.id, {
        include: [...includePatterns.fullOrderIncludes.map(include => ({...include}))]
    });

    res.json(formatOrder(updatedOrder));
}));

// Process refund
router.put('/admin/refund/:id', auth, asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized access' });
    }

    const { refundAmount, refundReason } = req.body;
    
    if (!refundAmount || !refundReason) {
        return res.status(400).json({ message: 'Refund amount and reason are required' });
    }

    const order = await Order.findByPk(req.params.id);
    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }

    // Process refund logic here (e.g., call to payment gateway)
    // For now, just update the order record
    order.refundAmount = refundAmount;
    order.refundReason = refundReason;
    order.paymentStatus = 'refunded';
    
    await order.save();

    // Return updated order with all details
    const updatedOrder = await Order.findByPk(req.params.id, {
        include: [...includePatterns.fullOrderIncludes.map(include => ({...include}))]
    });

    res.json(formatOrder(updatedOrder));
}));

// Update order notes
router.put('/admin/notes/:id', auth, asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized access' });
    }

    const { notes } = req.body;
    
    const order = await Order.findByPk(req.params.id);
    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }

    order.notes = notes;
    await order.save();

    // Return updated order with all details
    const updatedOrder = await Order.findByPk(req.params.id, {
        include: [...includePatterns.fullOrderIncludes.map(include => ({...include}))]
    });

    res.json(formatOrder(updatedOrder));
}));

// Get order statistics (admin route)
router.get('/admin/stats/overview', auth, asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    const totalOrders = await Order.count();
    const pendingOrders = await Order.count({ where: { status: 'pending' } });
    const processingOrders = await Order.count({ where: { status: 'processing' } });
    const shippedOrders = await Order.count({ where: { status: 'shipped' } });
    const deliveredOrders = await Order.count({ where: { status: 'delivered' } });
    const cancelledOrders = await Order.count({ where: { status: 'cancelled' } });
    
    // Calculate total revenue from completed orders
    const completedOrders = await Order.findAll({
        where: { 
            status: 'delivered',
            paymentStatus: 'paid'
        },
        attributes: [
            [sequelize.fn('SUM', sequelize.col('total')), 'totalRevenue']
        ],
        raw: true
    });
    
    const totalRevenue = completedOrders[0].totalRevenue || 0;
    
    res.json({
        totalOrders,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue
    });
}));

// Update an order
router.put('/:id', auth, asyncHandler(async (req, res) => {
    const { status, trackingNumber, trackingCarrier, estimatedDeliveryDate, refundAmount, refundReason, notes } = req.body;

    const order = await Order.findByPk(req.params.id);
    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }

    if (status) order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (trackingCarrier) order.trackingCarrier = trackingCarrier;
    if (estimatedDeliveryDate) order.estimatedDeliveryDate = new Date(estimatedDeliveryDate);
    if (refundAmount) order.refundAmount = refundAmount;
    if (refundReason) order.refundReason = refundReason;
    if (notes) order.notes = notes;

    await order.save();

    const updatedOrder = await Order.findByPk(order.id, {
        include: [...includePatterns.fullOrderIncludes.map(include => ({...include}))]
    });

    res.json(formatOrder(updatedOrder));
}));

export default router; 