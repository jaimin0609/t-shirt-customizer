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
import { HiOutlineHeart, HiOutlineShoppingCart, HiOutlineUser, HiMenu, HiSearch } from 'react-icons/hi';

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
            className={`site-header ${scrolled ? 'scrolled' : ''}`}
            data-testid="main-header"
        >
            <div className="header-container">
                {/* Logo */}
                <div className="header-logo">
                    <Link to="/" aria-label="Home page">
                        <Logo />
                    </Link>
                </div>

                {/* Desktop Navigation */}
                <nav className="desktop-nav">
                    <ul className="nav-links">
                        <li>
                            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                                Home
                            </Link>
                        </li>
                        <li ref={designMenuRef}>
                            <button
                                onClick={() => setShowDesignMenu(!showDesignMenu)}
                                className={`nav-dropdown-trigger ${showDesignMenu ? 'active' : ''} ${location.pathname.includes('/design') ? 'active' : ''}`}
                                aria-expanded={showDesignMenu}
                                aria-haspopup="true"
                            >
                                Designs
                                <span className="dropdown-arrow">▼</span>
                            </button>
                            {showDesignMenu && <DesignMenu />}
                        </li>
                        <li>
                            <Link to="/products" className={location.pathname === '/products' ? 'active' : ''}>
                                Products
                            </Link>
                        </li>
                        <li>
                            <Link to="/about" className={location.pathname === '/about' ? 'active' : ''}>
                                About
                            </Link>
                        </li>
                        <li>
                            <Link to="/contact-us" className={location.pathname === '/contact-us' ? 'active' : ''}>
                                Contact
                            </Link>
                        </li>
                    </ul>
                </nav>

                {/* Desktop Search */}
                <div className="desktop-search">
                    <SearchBar />
                </div>

                {/* Right Side Icons */}
                <div className="header-icons">
                    {isAuthenticated && (
                        <Link to="/wishlist" className="icon-button" aria-label="Wishlist">
                            <HiOutlineHeart className="icon" />
                            {wishlistCount > 0 && (
                                <span className="count-badge">{wishlistCount}</span>
                            )}
                        </Link>
                    )}

                    <Link to="/cart" className="icon-button" aria-label="Shopping Cart">
                        <HiOutlineShoppingCart className="icon" />
                        {cartCount > 0 && (
                            <span className="count-badge">{cartCount}</span>
                        )}
                    </Link>

                    {isAuthenticated ? (
                        <UserDropdown user={user} />
                    ) : (
                        <Link to="/login" className="icon-button" aria-label="Login">
                            <HiOutlineUser className="icon" />
                        </Link>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <div className="mobile-controls">
                    <button
                        className="mobile-search-trigger icon-button"
                        onClick={() => setShowMobileSearch(!showMobileSearch)}
                        aria-label="Search"
                    >
                        <HiSearch className="icon" />
                    </button>

                    <button
                        ref={mobileMenuRef}
                        className="mobile-menu-trigger icon-button"
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                        aria-label="Menu"
                        aria-expanded={showMobileMenu}
                        aria-controls="mobile-menu"
                    >
                        <HiMenu className="icon" />
                    </button>
                </div>

                {/* Mobile Search Panel */}
                {showMobileSearch && (
                    <div className="mobile-search-panel">
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
            </div>
        </header>
    );
};

export default Header; 