import React from 'react';
import { FiTrash2, FiPlusCircle, FiMinusCircle, FiHeart } from 'react-icons/fi';
import withStyles from '../../styles/withStyles.jsx';
import styleSystem from '../../styles/styleSystem';

const CartItemListBase = ({
  cart,
  quantities,
  handleQuantityChange,
  handleInputQuantityChange,
  handleInputBlur,
  moveToWishlist,
  removeFromCart,
  formatPrice,
  getImageUrl,
  styles
}) => {
  return (
    <div className={styles.container}>
      {/* Cart Header - Desktop only */}
      <div className={styles.headerDesktop}>
        <div className={styles.headerProduct}>Product</div>
        <div className={styles.headerPrice}>Price</div>
        <div className={styles.headerQuantity}>Quantity</div>
        <div className={styles.headerTotal}>Total</div>
      </div>

      {/* Cart Items */}
      <div>
        {cart.map((item) => (
          <div key={`${item.productId}-${item.size}-${item.color}`} className={styles.cartItem}>
            {/* Mobile Layout */}
            <div className={styles.mobileLayout}>
              <div className={styles.mobileFlex}>
                {/* Product Image */}
                <div className={styles.productImage}>
                  <img
                    src={item.image || item.product?.image || 'https://placehold.co/200x200?text=No+Image'}
                    alt={item.name}
                    className={styles.productImageTag}
                    onError={(e) => {
                      e.target.onerror = null; // Prevent infinite loop
                      e.target.src = 'https://placehold.co/200x200?text=No+Image';
                    }}
                  />
                </div>

                {/* Product Details */}
                <div className={styles.mobileProductDetails}>
                  <h3 className={styles.productName}>{item.name}</h3>
                  {item.size && (
                    <p className={styles.productAttribute}>Size: {item.size}</p>
                  )}
                  {item.color && (
                    <p className={styles.productAttribute}>Color: {item.color}</p>
                  )}

                  {/* Price */}
                  <div className={styles.mobilePriceContainer}>
                    <span className={styles.mobilePrice}>{formatPrice(item.price)}</span>
                  </div>
                </div>
              </div>

              {/* Quantity Controls */}
              <div className={styles.mobileControls}>
                <div className={styles.quantityControls}>
                  <button
                    onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                    className={styles.quantityButtonLeft}
                    aria-label="Decrease quantity"
                  >
                    <FiMinusCircle size={16} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={quantities[item.productId] || item.quantity}
                    onChange={(e) => handleInputQuantityChange(item.productId, e)}
                    onBlur={() => handleInputBlur(item.productId)}
                    className={styles.quantityInput}
                    aria-label="Quantity"
                  />
                  <button
                    onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                    className={styles.quantityButtonRight}
                    aria-label="Increase quantity"
                  >
                    <FiPlusCircle size={16} />
                  </button>
                </div>

                {/* Action Buttons */}
                <div className={styles.mobileActionButtons}>
                  <button
                    onClick={() => moveToWishlist(item)}
                    className={styles.wishlistButton}
                  >
                    <FiHeart size={18} />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className={styles.removeButton}
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Subtotal for Mobile */}
              <div className={styles.mobileSubtotal}>
                <span className={styles.subtotalLabel}>Subtotal: </span>
                <span className={styles.subtotalValue}>{formatPrice(parseFloat(item.price) * item.quantity)}</span>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className={styles.desktopLayout}>
              {/* Product */}
              <div className={styles.desktopProduct}>
                <div className={styles.desktopProductContent}>
                  <div className={styles.productImage}>
                    <img
                      src={item.image || item.product?.image || 'https://placehold.co/200x200?text=No+Image'}
                      alt={item.name}
                      className={styles.productImageTag}
                      onError={(e) => {
                        e.target.onerror = null; // Prevent infinite loop
                        e.target.src = 'https://placehold.co/200x200?text=No+Image';
                      }}
                    />
                  </div>
                  <div className={styles.desktopProductDetails}>
                    <h3 className={styles.productName}>{item.name}</h3>
                    {item.size && (
                      <p className={styles.productAttribute}>Size: {item.size}</p>
                    )}
                    {item.color && (
                      <p className={styles.productAttribute}>Color: {item.color}</p>
                    )}

                    {/* Action Buttons */}
                    <div className={styles.desktopActionButtons}>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className={styles.desktopRemoveButton}
                      >
                        <FiTrash2 size={14} className={styles.buttonIcon} /> Remove
                      </button>
                      <span className={styles.actionDivider}>|</span>
                      <button
                        onClick={() => moveToWishlist(item)}
                        className={styles.desktopWishlistButton}
                      >
                        <FiHeart size={14} className={styles.buttonIcon} /> Save for later
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className={styles.desktopPrice}>
                <span className={styles.priceValue}>{formatPrice(item.price)}</span>
              </div>

              {/* Quantity */}
              <div className={styles.desktopQuantity}>
                <div className={styles.quantityControls}>
                  <button
                    onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                    className={styles.quantityButtonLeft}
                  >
                    <FiMinusCircle size={16} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={quantities[item.productId] || item.quantity}
                    onChange={(e) => handleInputQuantityChange(item.productId, e)}
                    onBlur={() => handleInputBlur(item.productId)}
                    className={styles.quantityInput}
                  />
                  <button
                    onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                    className={styles.quantityButtonRight}
                  >
                    <FiPlusCircle size={16} />
                  </button>
                </div>
              </div>

              {/* Total */}
              <div className={styles.desktopTotal}>
                <span className={styles.totalValue}>{formatPrice(parseFloat(item.price) * item.quantity)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Define component-specific styles
const cartItemListStyles = styleSystem.createStyles({
  container: `
    bg-white 
    rounded-lg 
    shadow-sm 
    overflow-hidden 
    mb-6
  `,
  headerDesktop: `
    hidden 
    md:grid 
    md:grid-cols-12 
    bg-gray-50 
    p-4 
    border-b 
    text-sm 
    font-medium 
    text-gray-600
  `,
  headerProduct: `
    col-span-6
  `,
  headerPrice: `
    col-span-2 
    text-center
  `,
  headerQuantity: `
    col-span-2 
    text-center
  `,
  headerTotal: `
    col-span-2 
    text-right
  `,
  cartItem: `
    cart-item 
    border-b 
    last:border-b-0 
    p-4 
    hover:bg-gray-50 
    transition-colors
  `,
  mobileLayout: `
    md:hidden
  `,
  mobileFlex: `
    flex 
    items-start
  `,
  productImage: `
    product-image
  `,
  productImageTag: `
    w-24 
    h-24 
    object-cover 
    rounded
  `,
  mobileProductDetails: `
    ml-4 
    flex-grow
  `,
  productName: `
    font-medium 
    text-gray-900
  `,
  productAttribute: `
    text-sm 
    text-gray-600
  `,
  mobilePriceContainer: `
    flex 
    justify-between 
    items-center 
    mt-2
  `,
  mobilePrice: `
    text-gray-900 
    font-medium
  `,
  mobileControls: `
    flex 
    justify-between 
    items-center 
    mt-4
  `,
  quantityControls: `
    flex 
    items-center 
    border 
    rounded-md
  `,
  quantityButtonLeft: `
    cart-qty-btn 
    px-2 
    py-1 
    border-r
  `,
  quantityInput: `
    cart-qty-input 
    w-12 
    text-center 
    py-1
  `,
  quantityButtonRight: `
    cart-qty-btn 
    px-2 
    py-1 
    border-l
  `,
  mobileActionButtons: `
    flex 
    items-center
  `,
  wishlistButton: `
    cart-action-btn 
    mr-3
  `,
  removeButton: `
    cart-action-btn 
    text-red-500
  `,
  mobileSubtotal: `
    mt-3 
    text-right
  `,
  subtotalLabel: `
    text-sm 
    text-gray-600
  `,
  subtotalValue: `
    text-lg 
    font-semibold
  `,
  desktopLayout: `
    hidden 
    md:grid 
    md:grid-cols-12 
    md:gap-4 
    md:items-center
  `,
  desktopProduct: `
    col-span-6
  `,
  desktopProductContent: `
    flex 
    items-center
  `,
  desktopProductDetails: `
    ml-4
  `,
  desktopActionButtons: `
    flex 
    items-center 
    mt-2 
    text-sm 
    text-gray-600
  `,
  desktopRemoveButton: `
    hover:text-red-500 
    transition-colors 
    flex 
    items-center
  `,
  buttonIcon: `
    mr-1
  `,
  actionDivider: `
    mx-2
  `,
  desktopWishlistButton: `
    hover:text-blue-500 
    transition-colors 
    flex 
    items-center
  `,
  desktopPrice: `
    col-span-2 
    text-center
  `,
  priceValue: `
    text-gray-900
  `,
  desktopQuantity: `
    col-span-2 
    flex 
    justify-center
  `,
  desktopTotal: `
    col-span-2 
    text-right
  `,
  totalValue: `
    font-semibold 
    text-gray-900
  `
});

// Create the styled component
const CartItemList = withStyles(CartItemListBase, cartItemListStyles);

export default CartItemList; 