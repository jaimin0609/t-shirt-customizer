import React from 'react';
import { Link } from 'react-router-dom';
import styleSystem from '../../../styles/styleSystem';
import { withStyles } from '../../../styles/withStyles';

const ProductCardBase = ({ product, getImageUrl, styles }) => {
  // Format price with proper currency symbol and decimals
  const formatPrice = (price) => {
    if (typeof price !== 'number') {
      // Try to convert to number if it's a string
      price = parseFloat(price);
    }

    if (isNaN(price)) {
      return '$0.00';
    }

    return `$${price.toFixed(2)}`;
  };

  // Calculate discount percentage
  const calculateDiscount = (originalPrice, currentPrice) => {
    if (!originalPrice || !currentPrice) return null;

    const original = parseFloat(originalPrice);
    const current = parseFloat(currentPrice);

    if (isNaN(original) || isNaN(current) || original <= current) {
      return null;
    }

    const discount = Math.round(((original - current) / original) * 100);
    return discount;
  };

  const discount = calculateDiscount(product.originalPrice, product.price);

  return (
    <div className={styles.card}>
      <Link to={`/product/${product.id}`} className={styles.imageContainer}>
        <img
          src={getImageUrl(product)}
          alt={product.name}
          className={styles.image}
          loading="lazy"
          onError={(e) => {
            e.target.src = '/assets/placeholder-product.jpg';
          }}
        />
        {discount && (
          <div className={styles.discountBadge}>
            {discount}% OFF
          </div>
        )}
      </Link>
      <div className={styles.contentContainer}>
        <Link to={`/product/${product.id}`} className={styles.titleLink}>
          <h3 className={styles.title}>
            {product.name}
          </h3>
        </Link>
        <p className={styles.description}>{product.shortDescription || product.description}</p>
        <div className={styles.pricingContainer}>
          <div>
            <span className={styles.price}>
              {formatPrice(product.price)}
            </span>
            {discount && (
              <span className={styles.originalPrice}>
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          {product.rating && (
            <div className={styles.ratingContainer}>
              <svg className={styles.starIcon} viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
              <span className={styles.rating}>{product.rating}</span>
            </div>
          )}
        </div>
        <div className={styles.buttonContainer}>
          <Link
            to={`/product/${product.id}`}
            className={styles.viewButton}
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

// Define component-specific styles
const productCardStyles = styleSystem.createStyles({
  card: `
    bg-white 
    rounded-lg 
    overflow-hidden 
    shadow-sm 
    border 
    border-gray-100 
    transition-transform 
    duration-300 
    hover:shadow-md 
    hover:-translate-y-1
  `,
  imageContainer: `
    block 
    relative 
    h-48 
    overflow-hidden
  `,
  image: `
    object-cover 
    object-center 
    w-full 
    h-full
  `,
  discountBadge: `
    absolute 
    top-2 
    right-2 
    bg-red-500 
    text-white 
    text-xs 
    font-bold 
    px-2 
    py-1 
    rounded
  `,
  contentContainer: `
    p-4
  `,
  titleLink: `
    block
  `,
  title: `
    text-gray-900 
    font-medium 
    text-lg 
    mb-1 
    hover:text-blue-600 
    transition-colors
  `,
  description: `
    text-gray-500 
    text-sm 
    mb-2 
    line-clamp-2
  `,
  pricingContainer: `
    flex 
    items-center 
    justify-between 
    mt-2
  `,
  price: `
    text-gray-900 
    font-bold
  `,
  originalPrice: `
    text-gray-500 
    text-sm 
    line-through 
    ml-2
  `,
  ratingContainer: `
    flex 
    items-center
  `,
  starIcon: `
    w-4 
    h-4 
    text-yellow-500 
    fill-current
  `,
  rating: `
    text-gray-600 
    text-sm 
    ml-1
  `,
  buttonContainer: `
    mt-3
  `,
  viewButton: `
    w-full 
    inline-flex 
    justify-center 
    items-center 
    px-4 
    py-2 
    border 
    border-transparent 
    text-sm 
    font-medium 
    rounded-md 
    text-white 
    bg-blue-600 
    hover:bg-blue-700 
    focus:outline-none 
    focus:ring-2 
    focus:ring-offset-2 
    focus:ring-blue-500
  `,
});

// Create the styled component
const ProductCard = withStyles(ProductCardBase, productCardStyles);

export default ProductCard; 