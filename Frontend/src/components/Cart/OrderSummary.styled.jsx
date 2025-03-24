import React from 'react';
import { Link } from 'react-router-dom';
import { FiX } from 'react-icons/fi';
import styleSystem from '../../styles/styleSystem';
import { withStyles } from '../../styles/withStyles';

const OrderSummaryBase = ({
  cartCount,
  subtotal,
  showCouponInput,
  setShowCouponInput,
  couponCode,
  setCouponCode,
  appliedCoupon,
  handleApplyCoupon,
  handleRemoveCoupon,
  isApplyingCoupon,
  couponError,
  discountAmount,
  shippingCost,
  taxEstimate,
  orderTotal,
  formatPrice,
  styles
}) => {
  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Order Summary</h2>

      <div className={styles.contentContainer}>
        <div className={styles.subtotalRow}>
          <span className={styles.subtotalLabel}>Subtotal ({cartCount} items)</span>
          <span className={styles.subtotalValue}>{formatPrice(subtotal)}</span>
        </div>

        {/* Coupon Code Section */}
        <div className={styles.couponSection}>
          {!showCouponInput && !appliedCoupon && (
            <button
              onClick={() => setShowCouponInput(true)}
              className={styles.addCouponButton}
            >
              + Add Coupon Code
            </button>
          )}

          {showCouponInput && !appliedCoupon && (
            <div className={styles.couponInputContainer}>
              <form onSubmit={handleApplyCoupon} className={styles.couponForm}>
                <div className={styles.couponInputGroup}>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code"
                    className={styles.couponInput}
                  />
                  <button
                    type="submit"
                    disabled={isApplyingCoupon}
                    className={styles.couponButton}
                  >
                    {isApplyingCoupon ? 'Applying...' : 'Apply'}
                  </button>
                </div>
                {couponError && (
                  <p className={styles.couponError}>{couponError}</p>
                )}
                <button
                  type="button"
                  onClick={() => setShowCouponInput(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
              </form>
            </div>
          )}

          {appliedCoupon && (
            <div className={styles.appliedCouponContainer}>
              <div className={styles.appliedCoupon}>
                <div>
                  <span className={styles.couponCode}>{appliedCoupon.code}</span>
                  <p className={styles.couponDiscount}>
                    {appliedCoupon.discountType === 'percentage'
                      ? `${appliedCoupon.discountValue}% off`
                      : `$${appliedCoupon.discountValue} off`}
                  </p>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className={styles.removeCouponButton}
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Display discount if a coupon is applied */}
        {appliedCoupon && (
          <div className={styles.discountRow}>
            <span>Discount</span>
            <span>-{formatPrice(discountAmount)}</span>
          </div>
        )}

        <div className={styles.shippingRow}>
          <span className={styles.costLabel}>Shipping</span>
          {shippingCost === 0 ? (
            <span className={styles.freeShipping}>Free</span>
          ) : (
            <span className={styles.costValue}>{formatPrice(shippingCost)}</span>
          )}
        </div>

        {shippingCost > 0 && (
          <div className={styles.shippingMessage}>
            Add ${Math.max(0, (50 - subtotal)).toFixed(2)} more to qualify for FREE shipping
          </div>
        )}

        <div className={styles.taxRow}>
          <span className={styles.costLabel}>Estimated Tax</span>
          <span className={styles.costValue}>{formatPrice(taxEstimate)}</span>
        </div>

        <div className={styles.totalSection}>
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Order Total</span>
            <span className={styles.totalValue}>{formatPrice(orderTotal)}</span>
          </div>

          {/* Show savings if applicable */}
          {(shippingCost === 0 || appliedCoupon) && (
            <div className={styles.savingsMessage}>
              You're saving ${(() => {
                // Calculate shipping savings
                const shippingSavings = shippingCost === 0 ? 5.99 : 0;

                // Calculate coupon discount (ensure it's a number)
                const couponSavings = appliedCoupon ? parseFloat(discountAmount) || 0 : 0;

                // Calculate total savings and format to 2 decimal places
                const totalSavings = shippingSavings + couponSavings;
                return totalSavings.toFixed(2);
              })()}!
            </div>
          )}
        </div>
      </div>

      <Link
        to="/checkout"
        className={styles.checkoutButton}
      >
        Proceed to Checkout
      </Link>

      <div className={styles.paymentMethodsContainer}>
        <div className={styles.paymentMethodsLabel}>We accept</div>
        <div className={styles.paymentMethods}>
          <div className={styles.paymentMethod}></div>
          <div className={styles.paymentMethod}></div>
          <div className={styles.paymentMethod}></div>
          <div className={styles.paymentMethod}></div>
        </div>
      </div>
    </div>
  );
};

// Define component-specific styles
const orderSummaryStyles = styleSystem.createStyles({
  container: `
    bg-white 
    rounded-lg 
    shadow-sm 
    p-6 
    sticky 
    top-24
  `,
  heading: `
    text-xl 
    font-bold 
    mb-4
  `,
  contentContainer: `
    space-y-4
  `,
  subtotalRow: `
    flex 
    justify-between 
    pb-4 
    border-b
  `,
  subtotalLabel: `
    text-gray-600
  `,
  subtotalValue: `
    font-medium
  `,
  couponSection: `
    pb-4 
    border-b
  `,
  addCouponButton: `
    text-blue-600 
    hover:text-blue-800 
    font-medium 
    text-sm 
    flex 
    items-center
  `,
  couponInputContainer: `
    mt-2
  `,
  couponForm: `
    flex 
    flex-col
  `,
  couponInputGroup: `
    flex 
    mb-2
  `,
  couponInput: `
    flex-grow 
    border 
    border-gray-300 
    rounded-l-md 
    px-3 
    py-2 
    text-sm 
    focus:outline-none 
    focus:border-blue-500
  `,
  couponButton: `
    bg-blue-600 
    text-white 
    px-3 
    py-2 
    rounded-r-md 
    text-sm 
    hover:bg-blue-700 
    disabled:opacity-50
  `,
  couponError: `
    text-red-500 
    text-xs 
    mb-2
  `,
  cancelButton: `
    text-gray-500 
    text-xs 
    hover:text-gray-700
  `,
  appliedCouponContainer: `
    mt-2
  `,
  appliedCoupon: `
    flex 
    justify-between 
    items-center 
    bg-green-50 
    px-3 
    py-2 
    rounded-md 
    border 
    border-green-200
  `,
  couponCode: `
    text-green-700 
    font-medium 
    text-sm
  `,
  couponDiscount: `
    text-green-600 
    text-xs
  `,
  removeCouponButton: `
    text-gray-500 
    hover:text-red-500
  `,
  discountRow: `
    flex 
    justify-between 
    text-green-600
  `,
  shippingRow: `
    flex 
    justify-between
  `,
  costLabel: `
    text-gray-600
  `,
  freeShipping: `
    font-medium 
    text-green-600
  `,
  costValue: `
    font-medium
  `,
  shippingMessage: `
    text-sm 
    text-green-600
  `,
  taxRow: `
    flex 
    justify-between
  `,
  totalSection: `
    pt-4 
    border-t
  `,
  totalRow: `
    flex 
    justify-between 
    mb-2
  `,
  totalLabel: `
    font-bold 
    text-lg
  `,
  totalValue: `
    font-bold 
    text-lg
  `,
  savingsMessage: `
    text-green-600 
    text-sm 
    text-right 
    mb-4
  `,
  checkoutButton: `
    w-full 
    mt-6 
    bg-blue-600 
    hover:bg-blue-700 
    text-white 
    font-bold 
    py-3 
    px-4 
    rounded-md 
    transition-colors 
    duration-300 
    block 
    text-center
  `,
  paymentMethodsContainer: `
    mt-4 
    text-center
  `,
  paymentMethodsLabel: `
    text-sm 
    text-gray-500 
    mb-2
  `,
  paymentMethods: `
    flex 
    justify-center 
    space-x-2
  `,
  paymentMethod: `
    w-10 
    h-6 
    bg-gray-200 
    rounded
  `
});

// Create the styled component
const OrderSummary = withStyles(OrderSummaryBase, orderSummaryStyles);

export default OrderSummary; 