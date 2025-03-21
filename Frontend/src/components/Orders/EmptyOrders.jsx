import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Component for displaying when no orders are found or user is not logged in
 */
const EmptyOrders = ({ isLoggedIn, message }) => {
    if (!isLoggedIn) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold mb-2">Please Log In</h2>
                    <p className="text-gray-600 mb-6">You need to be logged in to view your orders.</p>
                    <Link
                        to="/login"
                        className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Log In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">No Orders Found</h2>
                <p className="text-gray-600 mb-6">{message || "You haven't placed any orders yet."}</p>
                <Link
                    to="/products"
                    className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                    Browse Products
                </Link>
            </div>
        </div>
    );
};

export default EmptyOrders; 