import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { HiOutlineUser } from 'react-icons/hi';

const UserDropdown = ({ user }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { logout } = useAuth();
    const navigate = useNavigate();

    const userNavItems = [
        { name: 'My Profile', href: '/profile' },
        { name: 'My Orders', href: '/orders' },
        { name: 'Notifications', href: '/notifications' },
        { name: 'Settings', href: '/settings' }
    ];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            setIsOpen(false);
            navigate('/');
        } catch (error) {
            console.error('Logout failed:', error);
            // Force a clean logout even if the API call fails
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        }
    };

    return (
        <div className="user-dropdown" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="icon-button"
                aria-label="User menu"
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <HiOutlineUser className="icon" />
            </button>

            {isOpen && (
                <div className="user-dropdown-menu">
                    <div className="user-dropdown-header">
                        <div className="user-dropdown-name">
                            {user?.name || 'User'}
                        </div>
                        <div className="user-dropdown-email">
                            {user?.email || 'No email'}
                        </div>
                    </div>

                    <div className="user-dropdown-items">
                        {userNavItems.map((item) => (
                            <Link
                                key={item.name}
                                to={item.href}
                                className="user-dropdown-item"
                                onClick={() => setIsOpen(false)}
                            >
                                {item.name}
                            </Link>
                        ))}

                        <button
                            className="user-dropdown-item user-dropdown-logout"
                            onClick={handleLogout}
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDropdown; 