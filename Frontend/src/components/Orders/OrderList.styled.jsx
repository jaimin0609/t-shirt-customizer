import React from 'react';
import styleSystem from '../../styles/styleSystem';
import withStyles from '../../styles/withStyles';
import OrderItem from './OrderItem.styled';

/**
 * Styled component that displays a list of orders
 */
const OrderListBase = ({ orders, handleCancelOrder, getImageUrl, styles }) => {
    if (orders.length === 0) {
        return <p className={styles.emptyMessage}>No orders found.</p>;
    }

    return (
        <div className={styles.container}>
            {orders.map(order => (
                <OrderItem
                    key={order.id}
                    order={order}
                    handleCancelOrder={handleCancelOrder}
                    getImageUrl={getImageUrl}
                />
            ))}
        </div>
    );
};

export default withStyles(OrderListBase, (theme) => ({
    container: `
    space-y-6
  `,
    emptyMessage: `
    text-center 
    text-gray-600 
    py-8
  `
})); 