import { User, Product, OrderItem, Customer } from '../models/index.js';

// Common include patterns for different queries
export const includePatterns = {
    // User includes
    basicUser: {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'profileImage']
    },

    // Product includes with items
    orderItems: {
        model: OrderItem,
        as: 'orderItems',
        include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'price', 'image']
        }]
    },

    // Customer includes
    customerWithUser: {
        model: Customer,
        as: 'customer',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
    },

    // Full order includes
    fullOrderIncludes: [
        {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email', 'profileImage']
        },
        {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode', 'country']
        },
        {
            model: OrderItem,
            as: 'orderItems',
            include: [{
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'price', 'image']
            }]
        }
    ]
}; 