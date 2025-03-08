import express from 'express';
import paymentService from '../services/payment.service.js';
import { Order } from '../models/index.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Create payment intent
router.post('/create-payment-intent', auth, async (req, res) => {
    try {
        const { orderNumber } = req.body;
        
        const order = await Order.findOne({
            where: { 
                orderNumber,
                userId: req.user.id,
                paymentStatus: 'pending'
            }
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const paymentIntent = await paymentService.createPaymentIntent(order.total);
        
        // Update order with payment intent ID
        await order.update({
            stripePaymentIntentId: paymentIntent.id
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
        });
    } catch (error) {
        console.error('Payment intent error:', error);
        res.status(500).json({ message: 'Error creating payment intent' });
    }
});

// Webhook to handle Stripe events
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            
            // Update order status
            const order = await Order.findOne({
                where: { stripePaymentIntentId: paymentIntent.id }
            });
            
            if (order) {
                await order.update({
                    paymentStatus: 'paid',
                    status: 'processing'
                });
            }
            break;
            
        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;
            
            // Update order status
            const failedOrder = await Order.findOne({
                where: { stripePaymentIntentId: failedPayment.id }
            });
            
            if (failedOrder) {
                await failedOrder.update({
                    paymentStatus: 'failed'
                });
            }
            break;
    }

    res.json({received: true});
});

export default router; 