import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { FiArrowLeft, FiTrash2 } from 'react-icons/fi';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import CartItemList from '../components/Cart/CartItemList.styled.jsx';
import OrderSummary from '../components/Cart/OrderSummary.styled.jsx';
import EmptyCart from '../components/Cart/EmptyCart.styled.jsx';
import { withStyles } from '../styles/withStyles';
import styleSystem from '../styles/styleSystem';

const CartPage = ({ styles }) => {
    const {
        cart,
        loading,
        updateQuantity,
        removeFromCart,
        clearCart,
        moveToWishlist,
        couponCode,
        setCouponCode,
        appliedCoupon,
        handleApplyCoupon,
        handleRemoveCoupon,
        isApplyingCoupon,
        couponError
    } = useCart();
    const navigate = useNavigate();

    // Calculate subtotal
    const subtotal = cart.reduce((total, item) => {
        const price = item.discountedPrice || item.price;
        return total + price * item.quantity;
    }, 0);

    // Simulate shipping calculation
    const shipping = subtotal > 50 ? 0 : 5.99;

    // Calculate tax (e.g., 8%)
    const tax = subtotal * 0.08;

    // Discount amount from coupon
    const discountAmount = appliedCoupon ? (subtotal * (appliedCoupon.discount / 100)) : 0;

    // Calculate total
    const total = subtotal + shipping + tax - discountAmount;

    // Format price helper
    const formatPrice = (price) => {
        return price.toFixed(2);
    };

    // Quantities state and handlers (in a real app this would be in the cart context)
    const [quantities, setQuantities] = React.useState({});

    React.useEffect(() => {
        // Initialize quantities from cart
        const initialQuantities = {};
        cart.forEach(item => {
            const itemKey = `${item.id}-${item.size}-${item.color}`;
            initialQuantities[itemKey] = item.quantity;
        });
        setQuantities(initialQuantities);
    }, [cart]);

    const handleQuantityChange = (item, action) => {
        const itemKey = `${item.id}-${item.size}-${item.color}`;
        const currentQty = quantities[itemKey] || item.quantity;
        let newQty;

        if (action === 'increment') {
            newQty = currentQty + 1;
        } else if (action === 'decrement') {
            newQty = Math.max(1, currentQty - 1);
        }

        setQuantities({
            ...quantities,
            [itemKey]: newQty
        });

        updateQuantity(item, newQty);
    };

    const handleInputQuantityChange = (item, event) => {
        const itemKey = `${item.id}-${item.size}-${item.color}`;
        const value = event.target.value;

        // Allow empty string for typing
        if (value === '') {
            setQuantities({
                ...quantities,
                [itemKey]: value
            });
            return;
        }

        // Only update if it's a number
        const qty = parseInt(value, 10);
        if (!isNaN(qty)) {
            setQuantities({
                ...quantities,
                [itemKey]: qty
            });
        }
    };

    const handleInputBlur = (item) => {
        const itemKey = `${item.id}-${item.size}-${item.color}`;
        const qty = quantities[itemKey];

        // Convert empty string or 0 to 1
        let newQty = qty;
        if (qty === '' || qty === 0) {
            newQty = 1;
            setQuantities({
                ...quantities,
                [itemKey]: newQty
            });
        }

        // Update cart if the quantity has changed
        if (item.quantity !== newQty) {
            updateQuantity(item, newQty);
        }
    };

    // Helper function to get image URL
    const getImageUrl = (item) => {
        return item.images?.[0] || '/images/product-placeholder.jpg';
    };

    // Show coupon input toggle
    const [showCouponInput, setShowCouponInput] = React.useState(false);

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <LoadingSpinner />
            </div>
        );
    }

    if (cart.length === 0) {
        return <EmptyCart />;
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Your Shopping Cart</h1>

            <div className={styles.content}>
                {/* Cart Items */}
                <div className={styles.cartSection}>
                    <div className={styles.cartBox}>
                        <div className={styles.cartHeader}>
                            <h2 className={styles.cartHeaderTitle}>Items ({cart.length})</h2>
                        </div>

                        <CartItemList
                            cart={cart}
                            quantities={quantities}
                            handleQuantityChange={handleQuantityChange}
                            handleInputQuantityChange={handleInputQuantityChange}
                            handleInputBlur={handleInputBlur}
                            moveToWishlist={moveToWishlist}
                            removeFromCart={removeFromCart}
                            formatPrice={formatPrice}
                            getImageUrl={getImageUrl}
                        />

                        <div className={styles.cartActions}>
                            <button
                                onClick={() => navigate('/products')}
                                className={styles.continueShoppingButton}
                            >
                                <FiArrowLeft className={styles.buttonIcon} />
                                Continue Shopping
                            </button>
                            <button
                                onClick={clearCart}
                                className={styles.clearCartButton}
                            >
                                <FiTrash2 className={styles.buttonIcon} />
                                Clear Cart
                            </button>
                        </div>
                    </div>
                </div>

                {/* Order Summary */}
                <div className={styles.summarySection}>
                    <OrderSummary
                        cartCount={cart.length}
                        subtotal={subtotal}
                        showCouponInput={showCouponInput}
                        setShowCouponInput={setShowCouponInput}
                        couponCode={couponCode}
                        setCouponCode={setCouponCode}
                        appliedCoupon={appliedCoupon}
                        handleApplyCoupon={handleApplyCoupon}
                        handleRemoveCoupon={handleRemoveCoupon}
                        isApplyingCoupon={isApplyingCoupon}
                        couponError={couponError}
                        discountAmount={discountAmount}
                        shippingCost={shipping}
                        taxEstimate={tax}
                        orderTotal={total}
                        formatPrice={formatPrice}
                    />
                </div>
            </div>
        </div>
    );
};

export default withStyles(CartPage, () => {
    return {
        container: {
            maxWidth: styleSystem.sizes.container,
            margin: '0 auto',
            padding: `${styleSystem.spacing.lg} ${styleSystem.spacing.md}`,
        },
        title: {
            fontSize: styleSystem.fontSizes.xxl,
            fontWeight: styleSystem.fontWeights.bold,
            marginBottom: styleSystem.spacing.lg,
            color: styleSystem.colors.gray[800],
        },
        content: {
            display: 'flex',
            flexDirection: 'column',
            gap: styleSystem.spacing.lg,
            [styleSystem.mediaQueries.lg]: {
                flexDirection: 'row',
            },
        },
        cartSection: {
            width: '100%',
            [styleSystem.mediaQueries.lg]: {
                width: '66%',
            },
        },
        summarySection: {
            width: '100%',
            [styleSystem.mediaQueries.lg]: {
                width: '33%',
            },
        },
        cartBox: {
            backgroundColor: styleSystem.colors.white,
            borderRadius: styleSystem.borderRadius.md,
            boxShadow: styleSystem.shadows.md,
            overflow: 'hidden',
        },
        cartHeader: {
            padding: styleSystem.spacing.md,
            borderBottom: `1px solid ${styleSystem.colors.gray[200]}`,
        },
        cartHeaderTitle: {
            fontSize: styleSystem.fontSizes.lg,
            fontWeight: styleSystem.fontWeights.semibold,
            color: styleSystem.colors.gray[800],
        },
        cartActions: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: styleSystem.spacing.md,
            borderTop: `1px solid ${styleSystem.colors.gray[200]}`,
        },
        continueShoppingButton: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: styleSystem.spacing.xs,
            color: styleSystem.colors.blue[600],
            backgroundColor: 'transparent',
            padding: styleSystem.spacing.sm,
            borderRadius: styleSystem.borderRadius.sm,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            border: 'none',
            fontWeight: styleSystem.fontWeights.medium,
            '&:hover': {
                color: styleSystem.colors.blue[800],
            },
        },
        clearCartButton: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: styleSystem.spacing.xs,
            color: styleSystem.colors.red[500],
            backgroundColor: 'transparent',
            padding: styleSystem.spacing.sm,
            borderRadius: styleSystem.borderRadius.sm,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            border: 'none',
            fontWeight: styleSystem.fontWeights.medium,
            '&:hover': {
                color: styleSystem.colors.red[700],
            },
        },
        buttonIcon: {
            marginRight: styleSystem.spacing.xxs,
        },
        loadingContainer: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '50vh',
        },
    };
}); 