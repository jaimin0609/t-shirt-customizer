import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
    return (
        <div className="container mx-auto px-4 py-16 text-center">
            <div className="max-w-md mx-auto">
                <h1 className="text-6xl font-bold text-gray-800 mb-2">404</h1>
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
                <p className="text-gray-600 mb-8">
                    The page you are looking for doesn't exist or has been moved.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/"
                        className="bg-blue-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-300"
                    >
                        Go to Home
                    </Link>
                    <Link
                        to="/products"
                        className="bg-gray-200 text-gray-800 font-medium px-6 py-3 rounded-lg hover:bg-gray-300 transition duration-300"
                    >
                        Browse Products
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage; 