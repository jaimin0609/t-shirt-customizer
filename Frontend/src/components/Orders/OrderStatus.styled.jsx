import React from 'react';
import withStyles from '../../styles/withStyles';

/**
 * Styled component that displays the status of an order with appropriate styling
 */
const OrderStatusBase = ({ status, styles }) => {
  const statusMap = {
    pending: { label: 'Pending', className: styles.pending },
    processing: { label: 'Processing', className: styles.processing },
    shipped: { label: 'Shipped', className: styles.shipped },
    delivered: { label: 'Delivered', className: styles.delivered },
    cancelled: { label: 'Cancelled', className: styles.cancelled },
  };

  const statusInfo = statusMap[status.toLowerCase()] || {
    label: status,
    className: styles.default
  };

  return (
    <span className={`${styles.badge} ${statusInfo.className}`}>
      {statusInfo.label}
    </span>
  );
};

export default withStyles(OrderStatusBase, (theme) => ({
  badge: `
    inline-flex
    items-center
    px-2.5
    py-0.5
    rounded-full
    text-xs
    font-medium
  `,
  pending: `
    bg-yellow-100
    text-yellow-800
  `,
  processing: `
    bg-blue-100
    text-blue-800
  `,
  shipped: `
    bg-indigo-100
    text-indigo-800
  `,
  delivered: `
    bg-green-100
    text-green-800
  `,
  cancelled: `
    bg-red-100
    text-red-800
  `,
  default: `
    bg-gray-100
    text-gray-800
  `
})); 