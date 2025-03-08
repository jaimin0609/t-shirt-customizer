import React from 'react';

const LoadingSpinner = ({ size = 'default', light = false }) => {
    const sizeClasses = {
        small: 'h-6 w-6',
        default: 'h-12 w-12',
        large: 'h-16 w-16'
    };

    const colorClasses = light
        ? 'border-white/20 border-t-white'
        : 'border-gray-200 border-t-blue-600';

    return (
        <div className="flex items-center justify-center min-h-[200px]">
            <div className="relative">
                <div
                    className={`
                        ${sizeClasses[size]}
                        border-4
                        ${colorClasses}
                        rounded-full
                        animate-spin
                    `}
                />
                <div className="mt-4 text-center text-gray-600">
                    Loading...
                </div>
            </div>
        </div>
    );
};

export default LoadingSpinner; 