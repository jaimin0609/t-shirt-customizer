import React from 'react';
import withStyles from '../../styles/withStyles.jsx';

/**
 * Styled component that displays order details like shipping address and payment info
 */
const OrderDetailsBase = ({
  shippingAddress,
  paymentMethod,
  trackingNumber,
  trackingCarrier,
  styles
}) => {
  const renderShippingAddress = () => {
    if (!shippingAddress) return <p className={styles.empty}>No shipping information available</p>;

    return (
      <div className={styles.addressBlock}>
        <p className={styles.addressName}>
          {shippingAddress.firstName} {shippingAddress.lastName}
        </p>
        <p className={styles.addressLine}>{shippingAddress.street}</p>
        {shippingAddress.street2 && (
          <p className={styles.addressLine}>{shippingAddress.street2}</p>
        )}
        <p className={styles.addressLine}>
          {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
        </p>
        <p className={styles.addressLine}>{shippingAddress.country}</p>
        {shippingAddress.phone && (
          <p className={styles.addressPhone}>{shippingAddress.phone}</p>
        )}
      </div>
    );
  };

  const renderTrackingInfo = () => {
    if (!trackingNumber) return null;

    return (
      <div className={styles.trackingInfo}>
        <p className={styles.trackingLabel}>Tracking Number:</p>
        <p className={styles.trackingValue}>
          {trackingCarrier ? `${trackingCarrier}: ` : ''}{trackingNumber}
        </p>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Order Details</h3>
      <div className={styles.content}>
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Shipping Address</h4>
          {renderShippingAddress()}
        </div>

        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Payment Method</h4>
          <p className={styles.paymentMethod}>
            {paymentMethod || 'No payment information available'}
          </p>
        </div>

        {trackingNumber && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Shipping Information</h4>
            {renderTrackingInfo()}
          </div>
        )}
      </div>
    </div>
  );
};

export default withStyles(OrderDetailsBase, (theme) => ({
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
    space-y-4
  `,
  section: `
    pb-3
    last:pb-0
    border-b
    last:border-b-0
    border-gray-200
  `,
  sectionTitle: `
    font-medium
    text-gray-800
    mb-2
  `,
  addressBlock: `
    text-gray-600
    space-y-1
  `,
  addressName: `
    font-medium
  `,
  addressLine: `
    text-sm
  `,
  addressPhone: `
    text-sm
    mt-1
  `,
  empty: `
    text-gray-500
    italic
  `,
  paymentMethod: `
    text-sm
    text-gray-600
  `,
  trackingInfo: `
    mt-2
  `,
  trackingLabel: `
    text-sm
    text-gray-600
  `,
  trackingValue: `
    text-sm
    font-medium
  `
})); 