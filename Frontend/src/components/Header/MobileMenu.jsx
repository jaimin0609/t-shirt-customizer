import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    HiX,
    HiOutlineUser,
    HiOutlineHeart,
    HiOutlineShoppingCart,
    HiOutlineChevronDown
} from 'react-icons/hi';

const MobileMenu = ({ isAuthenticated, user, cartCount, wishlistCount, onClose }) => {
    const [showDesignSubmenu, setShowDesignSubmenu] = useState(false);
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const mainLinks = [
        { name: 'Home', href: '/' },
        { name: 'Products', href: '/products' },
        { name: 'About', href: '/about' },
        { name: 'Contact', href: '/contact-us' }
    ];

    const designLinks = [
        { name: 'Design Gallery', href: '/designs' },
        { name: 'Custom Design', href: '/custom-design' },
        { name: '3D Designer', href: '/3d-designer' }
    ];

    const userLinks = [
        { name: 'My Profile', href: '/profile' },
        { name: 'My Orders', href: '/orders' },
        { name: 'Notifications', href: '/notifications' },
        { name: 'Settings', href: '/settings' }
    ];

    const handleLogout = async () => {
        try {
            await logout();
            onClose();
            navigate('/');
        } catch (error) {
            console.error('Logout failed:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        }
    };

    const handleLinkClick = () => {
        onClose();
    };

    return (
        <div className="mobile-menu">
            <div className="mobile-menu-header">
                <button
                    className="mobile-menu-close"
                    onClick={onClose}
                    aria-label="Close menu"
                >
                    <HiX className="icon" />
                </button>
            </div>

            <div className="mobile-menu-content">
                <nav className="mobile-nav">
                    <ul className="mobile-nav-links">
                        {mainLinks.map(link => (
                            <li key={link.name}>
                                <Link
                                    to={link.href}
                                    className={location.pathname === link.href ? 'active' : ''}
                                    onClick={handleLinkClick}
                                >
                                    {link.name}
                                </Link>
                            </li>
                        ))}
                        <li>
                            <button
                                className={`dropdown-trigger ${showDesignSubmenu ? 'active' : ''} ${location.pathname.includes('/design') ? 'active' : ''}`}
                                onClick={() => setShowDesignSubmenu(!showDesignSubmenu)}
                                aria-expanded={showDesignSubmenu}
                            >
                                Designs
                                <HiOutlineChevronDown className={`icon ${showDesignSubmenu ? 'rotate' : ''}`} />
                            </button>

                            {showDesignSubmenu && (
                                <ul className="submenu">
                                    {designLinks.map(link => (
                                        <li key={link.name}>
                                            <Link
                                                to={link.href}
                                                className={location.pathname === link.href ? 'active' : ''}
                                                onClick={handleLinkClick}
                                            >
                                                {link.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    </ul>
                </nav>

                <div className="mobile-user-section">
                    {isAuthenticated ? (
                        <>
                            <div className="mobile-user-info">
                                <div className="mobile-user-avatar">
                                    <HiOutlineUser className="icon" />
                                </div>
                                <div className="mobile-user-details">
                                    <div className="mobile-user-name">{user?.name || 'User'}</div>
                                    <div className="mobile-user-email">{user?.email || ''}</div>
                                </div>
                            </div>

                            <div className="mobile-quick-links">
                                <Link
                                    to="/wishlist"
                                    className="mobile-icon-link"
                                    onClick={handleLinkClick}
                                >
                                    <HiOutlineHeart className="icon" />
                                    <span>Wishlist</span>
                                    {wishlistCount > 0 && (
                                        <span className="count-badge">{wishlistCount}</span>
                                    )}
                                </Link>

                                <Link
                                    to="/cart"
                                    className="mobile-icon-link"
                                    onClick={handleLinkClick}
                                >
                                    <HiOutlineShoppingCart className="icon" />
                                    <span>Cart</span>
                                    {cartCount > 0 && (
                                        <span className="count-badge">{cartCount}</span>
                                    )}
                                </Link>
                            </div>

                            <nav className="mobile-user-nav">
                                <ul>
                                    {userLinks.map(link => (
                                        <li key={link.name}>
                                            <Link
                                                to={link.href}
                                                onClick={handleLinkClick}
                                            >
                                                {link.name}
                                            </Link>
                                        </li>
                                    ))}
                                    <li>
                                        <button
                                            className="logout-button"
                                            onClick={handleLogout}
                                        >
                                            Sign out
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        </>
                    ) : (
                        <div className="mobile-auth-buttons">
                            <Link
                                to="/login"
                                className="mobile-login-button"
                                onClick={handleLinkClick}
                            >
                                Sign in
                            </Link>
                            <Link
                                to="/register"
                                className="mobile-register-button"
                                onClick={handleLinkClick}
                            >
                                Create account
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MobileMenu; 