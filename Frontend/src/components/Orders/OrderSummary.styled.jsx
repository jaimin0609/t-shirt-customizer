import React from 'react';
import { withStyles } from '../../styles/withStyles';
import { formatCurrency } from '../../utils/currencyUtils';

/**
 * Styled component that displays the order summary with pricing details
 */
const OrderSummaryBase = ({ subtotal, shipping, tax, total, styles }) => {
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Order Summary</h3>
      <div className={styles.content}>
        <div className={styles.row}>
          <span className={styles.label}>Subtotal:</span>
          <span className={styles.value}>{formatCurrency(subtotal)}</span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>Shipping:</span>
          <span className={styles.value}>
            {shipping === 0 ? 'Free' : formatCurrency(shipping)}
          </span>
        </div>

        {tax > 0 && (
          <div className={styles.row}>
            <span className={styles.label}>Tax:</span>
            <span className={styles.value}>{formatCurrency(tax)}</span>
          </div>
        )}

        <div className={styles.divider}></div>

        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>Total:</span>
          <span className={styles.totalValue}>{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
};

export default withStyles(OrderSummaryBase, (theme) => ({
  container: `
    border
    border-gray-200
    rounded-lg
    overflow-hidden
    bg-white
    shadow-sm
  `,
  title: `
    py-3
    px-4
    bg-gray-50
    border-b
    border-gray-200
    font-medium
    text-gray-800
  `,
  content: `
    p-4
    space-y-3
  `,
  row: `
    flex
    justify-between
    items-center
  `,
  label: `
    text-gray-600
  `,
  value: `
    text-gray-900
  `,
  divider: `
    my-3
    border-t
    border-gray-200
  `,
  totalRow: `
    flex
    justify-between
    items-center
    pt-2
  `,
  totalLabel: `
    font-medium
    text-gray-800
  `,
  totalValue: `
    font-bold
    text-xl
    text-primary-600
  `
})); 