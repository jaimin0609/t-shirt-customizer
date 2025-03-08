import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const paymentService = {
    createPaymentIntent: async (amount, currency = 'usd') => {
        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Convert to cents
                currency
            });
            return paymentIntent;
        } catch (error) {
            console.error('Stripe payment intent error:', error);
            throw error;
        }
    },

    confirmPayment: async (paymentIntentId) => {
        try {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            return paymentIntent;
        } catch (error) {
            console.error('Stripe payment confirmation error:', error);
            throw error;
        }
    }
};

export default paymentService; 