import React from 'react';
import { Link } from 'react-router-dom';
import { withStyles } from '../../styles/withStyles';

/**
 * Styled component for displaying when no orders are found or user is not logged in
 */
const EmptyOrdersBase = ({ isLoggedIn, message, styles }) => {
    if (!isLoggedIn) {
        return (
            <div className={styles.container}>
                <div className={styles.content}>
                    <h2 className={styles.title}>Please Log In</h2>
                    <p className={styles.message}>You need to be logged in to view your orders.</p>
                    <Link to="/login" className={styles.button}>
                        Log In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <h2 className={styles.title}>No Orders Found</h2>
                <p className={styles.message}>{message || "You haven't placed any orders yet."}</p>
                <Link to="/products" className={styles.button}>
                    Browse Products
                </Link>
            </div>
        </div>
    );
};

export default withStyles(EmptyOrdersBase, (theme) => ({
    container: `
    flex 
    flex-col 
    items-center 
    justify-center 
    py-12
  `,
    content: `
    text-center
  `,
    title: `
    text-2xl 
    font-semibold 
    mb-2
  `,
    message: `
    text-gray-600 
    mb-6
  `,
    button: `
    inline-block 
    bg-blue-600 
    text-white 
    px-6 
    py-2 
    rounded-md 
    hover:bg-blue-700 
    transition-colors
  `
})); 