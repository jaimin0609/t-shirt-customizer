import React from 'react';
import { Link } from 'react-router-dom';

const EmptyCart = () => {
    return (
        <div className="max-w-6xl mx-auto px-4 py-8 mt-16">
            <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <svg
                    className="w-16 h-16 mx-auto mb-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                </svg>
                <h2 className="text-xl font-semibold mb-4">Your cart is empty</h2>
                <p className="text-gray-600 mb-6">
                    Looks like you haven't added any items to your cart yet.
                </p>
                <Link
                    to="/"
                    className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                    Start Shopping
                </Link>
            </div>
        </div>
    );
};

export default EmptyCart; 