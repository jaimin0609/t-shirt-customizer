import React from 'react';
import withStyles from '../../styles/withStyles';
import { formatCurrency } from '../../utils/currencyUtils';

/**
 * Styled component that displays a list of ordered items
 */
const OrderItemsListBase = ({ items, getImageUrl, styles }) => {
  if (!items || items.length === 0) {
    return <p className={styles.emptyMessage}>No items in this order.</p>;
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Order Items</h3>
      <div className={styles.list}>
        {items.map((item, index) => (
          <div key={index} className={styles.item}>
            <div className={styles.imageContainer}>
              <img
                src={getImageUrl(item.design)}
                alt={item.productName}
                className={styles.image}
              />
            </div>
            <div className={styles.details}>
              <h4 className={styles.productName}>{item.productName}</h4>
              <div className={styles.attributes}>
                <p className={styles.attribute}>Size: {item.size}</p>
                <p className={styles.attribute}>Color: {item.color}</p>
                {item.customText && (
                  <p className={styles.attribute}>Custom Text: {item.customText}</p>
                )}
              </div>
            </div>
            <div className={styles.pricing}>
              <p className={styles.quantity}>Qty: {item.quantity}</p>
              <p className={styles.price}>{formatCurrency(item.price)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default withStyles(OrderItemsListBase, (theme) => ({
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
  list: `
    divide-y
    divide-gray-200
  `,
  item: `
    flex
    items-center
    py-4
    px-4
  `,
  emptyMessage: `
    p-4
    text-center
    text-gray-600
  `,
  imageContainer: `
    w-16
    h-16
    rounded
    overflow-hidden
    bg-gray-100
    flex-shrink-0
  `,
  image: `
    w-full
    h-full
    object-cover
    object-center
  `,
  details: `
    ml-4
    flex-grow
  `,
  productName: `
    font-medium
    text-gray-900
  `,
  attributes: `
    mt-1
    text-sm
    text-gray-600
    space-y-0.5
  `,
  attribute: `
    text-sm
  `,
  pricing: `
    text-right
    flex-shrink-0
    ml-4
  `,
  quantity: `
    text-sm
    text-gray-600
  `,
  price: `
    font-medium
    text-gray-900
    mt-1
  `
})); 