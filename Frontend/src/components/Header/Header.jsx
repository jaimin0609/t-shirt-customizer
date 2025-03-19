import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import Logo from './Logo';
import DesignMenu from './DesignMenu';
import UserDropdown from './UserDropdown';
import SearchBar from './SearchBar';
import MobileMenu from './MobileMenu';
import {
    HeartIcon,
    ShoppingCartIcon,
    UserIcon,
    Bars3Icon,
    MagnifyingGlassIcon,
    ChevronDownIcon
} from '@heroicons/react/24/outline';

const Header = () => {
    const [showDesignMenu, setShowDesignMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { user, isAuthenticated, authError } = useAuth();
    const { cartCount } = useCart();
    const { wishlistCount } = useWishlist ? useWishlist() : { wishlistCount: 0 };
    const navigate = useNavigate();
    const location = useLocation();
    const headerRef = useRef(null);
    const mobileMenuRef = useRef(null);
    const designMenuRef = useRef(null);

    // Update scroll state for header appearance
    useEffect(() => {
        const handleScroll = () => {
            const isScrolled = window.scrollY > 10;
            if (isScrolled !== scrolled) {
                setScrolled(isScrolled);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [scrolled]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (designMenuRef.current && !designMenuRef.current.contains(event.target)) {
                setShowDesignMenu(false);
            }

            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
                setShowMobileMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Reset mobile menu when location changes
    useEffect(() => {
        setShowMobileMenu(false);
        setShowMobileSearch(false);
    }, [location.pathname]);

    // Check for auth errors and log them
    useEffect(() => {
        if (authError) {
            console.error('Auth error in header:', authError);
        }
    }, [authError]);

    // Log render for debugging
    useEffect(() => {
        console.log('Header rendered. Auth state:', { isAuthenticated, userExists: !!user });
    }, [isAuthenticated, user]);

    return (
        <header
            ref={headerRef}
            className={`header ${scrolled ? 'scrolled' : ''}`}
            data-testid="main-header"
        >
            <div className="container mx-auto px-4 flex items-center justify-between h-16">
                {/* Logo */}
                <Link to="/" className="logo" aria-label="Home page">
                    <Logo />
                </Link>

                {/* Navigation */}
                <nav className="hidden md:block">
                    <ul className="nav-links">
                        <li>
                            <Link
                                to="/"
                                className={location.pathname === '/' ? 'text-primary' : ''}
                            >
                                Home
                            </Link>
                        </li>
                        <li ref={designMenuRef}>
                            <button
                                onClick={() => setShowDesignMenu(!showDesignMenu)}
                                className={`nav-dropdown-trigger ${showDesignMenu ? 'text-primary' : ''} ${location.pathname.includes('/design') ? 'text-primary' : ''}`}
                                aria-expanded={showDesignMenu}
                                aria-haspopup="true"
                            >
                                Designs
                                <ChevronDownIcon className="h-4 w-4 ml-1" aria-hidden="true" />
                            </button>
                            <div className={`design-dropdown ${showDesignMenu ? 'active' : ''}`}>
                                <DesignMenu />
                            </div>
                        </li>
                        <li>
                            <Link
                                to="/products"
                                className={location.pathname === '/products' ? 'text-primary' : ''}
                            >
                                Products
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/about"
                                className={location.pathname === '/about' ? 'text-primary' : ''}
                            >
                                About
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/contact-us"
                                className={location.pathname === '/contact-us' ? 'text-primary' : ''}
                            >
                                Contact
                            </Link>
                        </li>
                    </ul>
                </nav>

                {/* Search Bar */}
                <div className="hidden md:block search-container">
                    <SearchBar />
                </div>

                {/* Right Side Icons */}
                <div className="right-nav">
                    {isAuthenticated && (
                        <Link to="/wishlist" className="icon-btn" aria-label="Wishlist">
                            <HeartIcon className="h-6 w-6" />
                            {wishlistCount > 0 && (
                                <span className="icon-btn-badge">{wishlistCount}</span>
                            )}
                        </Link>
                    )}

                    <Link to="/cart" className="icon-btn" aria-label="Shopping Cart">
                        <ShoppingCartIcon className="h-6 w-6" />
                        {cartCount > 0 && (
                            <span className="icon-btn-badge">{cartCount}</span>
                        )}
                    </Link>

                    {isAuthenticated ? (
                        <UserDropdown user={user} />
                    ) : (
                        <Link to="/login" className="icon-btn" aria-label="Login">
                            <UserIcon className="h-6 w-6" />
                        </Link>
                    )}

                    {/* Mobile Search Toggle */}
                    <button
                        className="icon-btn md:hidden"
                        onClick={() => setShowMobileSearch(!showMobileSearch)}
                        aria-label="Search"
                    >
                        <MagnifyingGlassIcon className="h-6 w-6" />
                    </button>

                    {/* Mobile Menu Toggle */}
                    <button
                        ref={mobileMenuRef}
                        className="mobile-menu-button md:hidden"
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                        aria-label="Menu"
                        aria-expanded={showMobileMenu}
                        aria-controls="mobile-menu"
                    >
                        <Bars3Icon className="h-6 w-6" />
                    </button>
                </div>
            </div>

            {/* Mobile Search Panel */}
            {showMobileSearch && (
                <div className="md:hidden p-4 bg-gray-50 border-t border-gray-200">
                    <SearchBar
                        onSearch={() => setShowMobileSearch(false)}
                        placeholder="Search products..."
                        fullWidth
                    />
                </div>
            )}

            {/* Mobile Menu Panel */}
            {showMobileMenu && (
                <MobileMenu
                    isAuthenticated={isAuthenticated}
                    user={user}
                    cartCount={cartCount}
                    wishlistCount={wishlistCount}
                    onClose={() => setShowMobileMenu(false)}
                />
            )}
        </header>
    );
};

export default Header; 