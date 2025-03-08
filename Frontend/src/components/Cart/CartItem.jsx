import React from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

// Default placeholder image
const PLACEHOLDER_IMAGE = '/assets/placeholder-product.jpg';

const CartItem = ({ item, onRemove, onUpdateQuantity }) => {
    const { product, quantity, size, color, customizations } = item;

    // Handle image loading errors by using a placeholder
    const handleImageError = (e) => {
        console.error('Failed to load product image, using placeholder');
        e.target.src = PLACEHOLDER_IMAGE;
        e.target.onerror = null; // Prevent infinite error loops
    };

    // Properly resolve image path
    const getImageUrl = () => {
        // Handle nested structure for customizable products
        if (product.images && typeof product.images === 'object') {
            // If it's a nested structure with color options
            if (product.images[color]?.front) {
                const imagePath = product.images[color].front;
                // If it's a backend image path (starts with /uploads)
                if (imagePath.startsWith('/uploads')) {
                    return `http://localhost:5002${imagePath}`;
                }
                return imagePath;
            }
            // Try white as default color if the selected color isn't available
            else if (product.images.white?.front) {
                const imagePath = product.images.white.front;
                // If it's a backend image path (starts with /uploads)
                if (imagePath.startsWith('/uploads')) {
                    return `http://localhost:5002${imagePath}`;
                }
                return imagePath;
            }
            // If it has a different structure with array
            else if (Array.isArray(product.images) && product.images.length > 0) {
                const imagePath = product.images[0];
                // If it's a backend image path (starts with /uploads)
                if (imagePath.startsWith('/uploads')) {
                    return `http://localhost:5002${imagePath}`;
                }
                return imagePath;
            }
        }

        // If product has a single image property
        if (product.image) {
            // If it's a backend image path (starts with /uploads)
            if (product.image.startsWith('/uploads')) {
                return `http://localhost:5002${product.image}`;
            }
            return product.image;
        }

        // Fallback to placeholder
        return PLACEHOLDER_IMAGE;
    };

    // Format price with correct currency
    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price);
    };

    return (
        <div className="flex items-center py-4 border-b border-gray-200">
            {/* Product Image */}
            <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
                <img
                    src={getImageUrl()}
                    alt={product.name}
                    className="h-full w-full object-contain object-center p-1"
                    onError={handleImageError}
                />
            </div>

            {/* Product Details */}
            <div className="ml-4 flex flex-1 flex-col">
                <div>
                    <div className="flex justify-between">
                        <h3 className="text-base font-medium text-gray-900">
                            <Link to={`/product/${product.id}`} className="hover:text-blue-600">
                                {product.name}
                            </Link>
                        </h3>
                        <p className="ml-4 text-base font-medium text-gray-900">
                            {formatPrice(product.price * quantity)}
                        </p>
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                        {color && <span className="mr-2">Color: {color}</span>}
                        {size && <span>Size: {size}</span>}
                    </div>
                    {customizations && (
                        <div className="mt-1 text-xs text-gray-500">
                            <p>Customized</p>
                        </div>
                    )}
                </div>

                <div className="flex flex-1 items-end justify-between mt-2">
                    <div className="flex items-center space-x-2">
                        <label htmlFor={`quantity-${product.id}`} className="sr-only">
                            Quantity
                        </label>
                        <select
                            id={`quantity-${product.id}`}
                            name={`quantity-${product.id}`}
                            value={quantity}
                            onChange={(e) => onUpdateQuantity(product.id, parseInt(e.target.value), size, color)}
                            className="rounded-md border border-gray-300 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            {[...Array(10).keys()].map((x) => (
                                <option key={x + 1} value={x + 1}>
                                    {x + 1}
                                </option>
                            ))}
                        </select>

                        <button
                            type="button"
                            onClick={() => {
                                onRemove(product.id, size, color);
                                toast.success('Item removed from cart');
                            }}
                            className="text-sm font-medium text-red-600 hover:text-red-500"
                        >
                            Remove
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartItem; 