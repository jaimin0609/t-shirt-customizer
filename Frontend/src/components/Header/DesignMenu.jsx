import React from 'react';
import { Link } from 'react-router-dom';
import {
    PaintBrushIcon,
    CursorArrowRippleIcon,
    CubeIcon
} from '@heroicons/react/24/outline';

const DesignMenu = () => {
    const designItems = [
        {
            name: 'Design Gallery',
            href: '/designs',
            icon: PaintBrushIcon
        },
        {
            name: 'Custom Design',
            href: '/custom-design',
            icon: CursorArrowRippleIcon
        },
        {
            name: '3D Designer',
            href: '/3d-designer',
            icon: CubeIcon
        }
    ];

    return (
        <div className="design-dropdown active">
            <div className="design-dropdown-items">
                {designItems.map((item) => (
                    <Link
                        key={item.name}
                        to={item.href}
                        className="dropdown-item"
                    >
                        {item.icon && (
                            <item.icon className="dropdown-item-icon" aria-hidden="true" />
                        )}
                        <span>{item.name}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default DesignMenu; 