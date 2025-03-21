import React from 'react';
import { withStyles } from '../../styles/withStyles';
import { Link } from 'react-router-dom';
import OrderStatus from './OrderStatus.styled';
import { formatDate } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/currencyUtils';

/**
 * Styled component that displays a single order item with its details
 */
const OrderItemBase = ({ order, handleCancelOrder, getImageUrl, styles }) => {
    // Get first item image to display as thumbnail
    const thumbnailImage = order.items && order.items.length > 0
        ? getImageUrl(order.items[0].design)
        : null;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.orderInfo}>
                    <h3 className={styles.orderNumber}>
                        Order #{order.id}
                    </h3>
                    <p className={styles.orderDate}>
                        Placed on {formatDate(order.orderDate)}
                    </p>
                </div>
                <div className={styles.statusContainer}>
                    <OrderStatus status={order.status} />
                    {order.status === 'pending' && (
                        <button
                            onClick={() => handleCancelOrder(order.id)}
                            className={styles.cancelButton}
                        >
                            Cancel Order
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.content}>
                <div className={styles.thumbnail}>
                    {thumbnailImage && (
                        <img
                            src={thumbnailImage}
                            alt="Order thumbnail"
                            className={styles.image}
                        />
                    )}
                </div>
                <div className={styles.details}>
                    <p className={styles.itemCount}>
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                    </p>
                    <p className={styles.total}>
                        Total: {formatCurrency(order.totalAmount)}
                    </p>
                </div>
                <div className={styles.actions}>
                    <Link to={`/orders/${order.id}`} className={styles.viewButton}>
                        View Details
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default withStyles(OrderItemBase, (theme) => ({
    container: `
    border
    border-gray-200
    rounded-lg
    overflow-hidden
    bg-white
    shadow-sm
    hover:shadow-md
    transition-shadow
    duration-200
  `,
    header: `
    flex
    justify-between
    items-start
    p-4
    border-b
    border-gray-200
    bg-gray-50
  `,
    orderInfo: `
    flex
    flex-col
  `,
    orderNumber: `
    text-lg
    font-medium
    text-gray-900
  `,
    orderDate: `
    text-sm
    text-gray-600
  `,
    statusContainer: `
    flex
    flex-col
    items-end
    gap-2
  `,
    cancelButton: `
    text-sm
    text-red-600
    hover:text-red-800
    transition-colors
  `,
    content: `
    p-4
    flex
    items-center
    gap-4
  `,
    thumbnail: `
    w-20
    h-20
    flex-shrink-0
    bg-gray-100
    rounded
    overflow-hidden
  `,
    image: `
    w-full
    h-full
    object-cover
    object-center
  `,
    details: `
    flex-grow
  `,
    itemCount: `
    text-sm
    text-gray-600
  `,
    total: `
    text-base
    font-medium
    text-gray-900
    mt-1
  `,
    actions: `
    flex
    items-center
  `,
    viewButton: `
    px-4
    py-2
    bg-primary-600
    hover:bg-primary-700
    text-white
    rounded
    text-sm
    font-medium
    transition-colors
  `
})); 