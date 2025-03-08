import express from 'express';
import { Cart, CartItem, Product } from '../models/index.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get cart
router.get('/', auth, async (req, res) => {
    try {
        const cart = await Cart.findOne({
            where: {
                userId: req.user.id,
                status: 'active'
            },
            include: [{
                model: CartItem,
                as: 'cartItems',
                include: [{
                    model: Product,
                    as: 'product'
                }]
            }]
        });

        res.json(cart || { items: [] });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ message: 'Error fetching cart', error: error.message });
    }
});

// Add item to cart
router.post('/items', auth, async (req, res) => {
    try {
        const { productId, quantity = 1, customization } = req.body;
        
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const userId = req.user.id;

        // Find or create cart
        let cart;
        try {
            [cart] = await Cart.findOrCreate({
                where: {
                    userId: userId,
                    status: 'active'
                },
                defaults: {
                    userId: userId,
                    total: 0
                }
            });
        } catch (error) {
            console.error('Error finding/creating cart:', error);
            return res.status(500).json({ message: 'Error finding/creating cart', error: error.message });
        }

        // Find product
        const product = await Product.findByPk(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Create cart item
        let cartItem;
        try {
            cartItem = await CartItem.create({
                cartId: cart.id,
                productId,
                quantity,
                price: product.price,
                customization: customization || {}
            });
        } catch (error) {
            console.error('Error creating cart item:', error);
            return res.status(500).json({ message: 'Error creating cart item', error: error.message });
        }

        // Update cart total
        try {
            cart.total = parseFloat(cart.total || 0) + (product.price * quantity);
            await cart.save();
        } catch (error) {
            console.error('Error updating cart total:', error);
            return res.status(500).json({ message: 'Error updating cart total', error: error.message });
        }

        // Return cart item with product details
        try {
            const cartItemWithProduct = await CartItem.findByPk(cartItem.id, {
                include: [{
                    model: Product,
                    as: 'product'
                }]
            });
            res.status(201).json(cartItemWithProduct);
        } catch (error) {
            console.error('Error fetching cart item details:', error);
            return res.status(500).json({ message: 'Error fetching cart item details', error: error.message });
        }
    } catch (error) {
        console.error('Error in cart item creation:', error);
        res.status(500).json({ message: 'Error adding item to cart', error: error.message });
    }
});

// Update cart item quantity
router.put('/items/:itemId', auth, async (req, res) => {
    try {
        const { itemId } = req.params;
        const { quantity } = req.body;

        const cartItem = await CartItem.findOne({
            where: { id: itemId },
            include: [{
                model: Cart,
                where: { userId: req.user.id }
            }]
        });

        if (!cartItem) {
            return res.status(404).json({ message: 'Cart item not found' });
        }

        // Update quantity
        cartItem.quantity = quantity;
        await cartItem.save();

        // Update cart total
        const cart = cartItem.Cart;
        const allCartItems = await CartItem.findAll({
            where: { cartId: cart.id },
            include: [{ model: Product, as: 'product' }]
        });

        cart.total = allCartItems.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);

        await cart.save();

        res.json(cartItem);
    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({ message: 'Error updating cart item', error: error.message });
    }
});

// Remove item from cart
router.delete('/items/:itemId', auth, async (req, res) => {
    try {
        const { itemId } = req.params;

        const cartItem = await CartItem.findOne({
            where: { id: itemId },
            include: [{
                model: Cart,
                where: { userId: req.user.id }
            }]
        });

        if (!cartItem) {
            return res.status(404).json({ message: 'Cart item not found' });
        }

        // Remove item
        await cartItem.destroy();

        // Update cart total
        const cart = cartItem.Cart;
        const allCartItems = await CartItem.findAll({
            where: { cartId: cart.id },
            include: [{ model: Product, as: 'product' }]
        });

        cart.total = allCartItems.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);

        await cart.save();

        res.json({ message: 'Cart item removed' });
    } catch (error) {
        console.error('Error removing cart item:', error);
        res.status(500).json({ message: 'Error removing cart item', error: error.message });
    }
});

export default router; 