import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Simplified header component to ensure there's always a visible navigation
 * This component is used as a fallback when the main header is not displaying
 */
const HeaderFix = () => {
    return (
        <header className="sticky top-0 z-50 bg-white shadow-md w-full" style={{ display: 'flex !important', visibility: 'visible !important' }}>
            <div className="container mx-auto px-4 py-4 flex justify-between items-center" style={{ display: 'flex !important' }}>
                {/* Logo */}
                <Link to="/" className="flex items-center">
                    <span className="text-xl font-bold text-purple-700">UniQVerse</span>
                </Link>

                {/* Navigation Links - Desktop */}
                <nav className="hidden md:flex space-x-8" style={{ display: 'flex !important' }}>
                    <Link to="/" className="text-gray-800 hover:text-purple-700">
                        Home
                    </Link>
                    <Link to="/designs" className="text-gray-800 hover:text-purple-700">
                        Designs
                    </Link>
                    <Link to="/products" className="text-gray-800 hover:text-purple-700">
                        Products
                    </Link>
                    <Link to="/about" className="text-gray-800 hover:text-purple-700">
                        About
                    </Link>
                    <Link to="/contact-us" className="text-gray-800 hover:text-purple-700">
                        Contact
                    </Link>
                </nav>

                {/* Right Side Icons */}
                <div className="flex items-center space-x-4" style={{ display: 'flex !important' }}>
                    <Link to="/wishlist" className="text-gray-800 hover:text-purple-700">
                        <span className="sr-only">Wishlist</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </Link>
                    <Link to="/cart" className="text-gray-800 hover:text-purple-700">
                        <span className="sr-only">Cart</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </Link>
                    <Link to="/login" className="text-gray-800 hover:text-purple-700">
                        <span className="sr-only">Profile</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </Link>
                </div>

                {/* Mobile menu button */}
                <button
                    className="md:hidden text-gray-800 hover:text-purple-700"
                    onClick={() => alert('Mobile menu is being worked on. Please use the desktop navigation.')}
                >
                    <span className="sr-only">Open menu</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>
        </header>
    );
};

export default HeaderFix; 