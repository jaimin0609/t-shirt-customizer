import React from 'react';
import { Link } from 'react-router-dom';
import {
    PaintBrushIcon,
    CursorArrowRippleIcon,
    Cube3dIcon
} from '@heroicons/react/24/outline';

const DesignMenu = () => {
    const designItems = [
        {
            name: 'Design Gallery',
            href: '/designs',
            description: 'Browse our collection of pre-made designs',
            icon: PaintBrushIcon
        },
        {
            name: 'Custom Design',
            href: '/custom-design',
            description: 'Create your own custom t-shirt design',
            icon: CursorArrowRippleIcon
        },
        {
            name: '3D Designer',
            href: '/3d-designer',
            description: 'Use our 3D design tool for perfect visualization',
            icon: Cube3dIcon
        }
    ];

    return (
        <div className="design-dropdown">
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
    );
};

export default DesignMenu; 