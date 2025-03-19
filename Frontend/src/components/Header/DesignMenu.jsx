import React from 'react';
import { Link } from 'react-router-dom';

const DesignMenu = () => {
    const designItems = [
        { name: 'Design Gallery', href: '/designs', description: 'Browse our collection of pre-made designs' },
        { name: 'Custom Design', href: '/custom-design', description: 'Create your own custom t-shirt design' },
        { name: '3D Designer', href: '/3d-designer', description: 'Use our 3D design tool for perfect visualization' }
    ];

    return (
        <div className="design-dropdown">
            <div className="design-dropdown-items">
                {designItems.map((item) => (
                    <Link
                        key={item.name}
                        to={item.href}
                        className="design-dropdown-item"
                    >
                        <div className="design-dropdown-item-name">{item.name}</div>
                        <div className="design-dropdown-item-description">{item.description}</div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default DesignMenu; 