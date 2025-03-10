import { Sequelize } from 'sequelize';
import sequelize from '../config/database.js';
import Product from './Product.js';
import Cart from './Cart.js';
import CartItem from './CartItem.js';
import Order from './Order.js';
import User from './user.js';
import OrderItem from './OrderItem.js';
import Customer from './Customer.js';
import Coupon from './Coupon.js';
import Promotion from './Promotion.js';
import ProductVariant from './ProductVariant.js';
import Analytics from './Analytics.js';
// Import Product model patch
import { applyProductModelPatch } from './ProductPatch.js';

// Initialize models with sequelize instance
const models = {
    User,
    Product,
    Cart,
    CartItem,
    Order,
    OrderItem,
    Customer,
    Coupon,
    Promotion,
    Analytics,
    sequelize,
    Sequelize
};

// Apply patch to handle image/images compatibility
applyProductModelPatch(Product);

// Define relationships
models.User.hasMany(models.Order, {
    foreignKey: 'userId',
    as: 'userOrders'
});

models.Order.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
});

// Order-OrderItem associations
models.Order.hasMany(models.OrderItem, {
    foreignKey: 'orderId',
    as: 'orderItems'
});

models.OrderItem.belongsTo(models.Order, {
    foreignKey: 'orderId',
    as: 'order'
});

// Product-OrderItem associations
models.Product.hasMany(models.OrderItem, {
    foreignKey: 'productId',
    as: 'orderItems'
});

models.OrderItem.belongsTo(models.Product, {
    foreignKey: 'productId',
    as: 'product'
});

// Product-Promotion association
models.Product.belongsTo(models.Promotion, {
    foreignKey: 'promotionId',
    as: 'promotion'
});

models.Promotion.hasMany(models.Product, {
    foreignKey: 'promotionId',
    as: 'promotionProducts'
});

// Cart-CartItem associations
models.Cart.hasMany(models.CartItem, {
    foreignKey: 'cartId',
    as: 'cartItems'
});

models.CartItem.belongsTo(models.Cart, {
    foreignKey: 'cartId',
    as: 'cart'
});

// User-Cart associations
models.User.hasOne(models.Cart, {
    foreignKey: 'userId',
    as: 'userCart'
});

models.Cart.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'cartUser'
});

// Product-CartItem associations
models.Product.hasMany(models.CartItem, {
    foreignKey: 'productId',
    as: 'productCarts'
});

models.CartItem.belongsTo(models.Product, {
    foreignKey: 'productId',
    as: 'product'
});

// Order-Coupon association (new)
models.Order.belongsTo(models.Coupon, {
    foreignKey: 'couponId',
    as: 'appliedCoupon'
});

models.Coupon.hasMany(models.Order, {
    foreignKey: 'couponId',
    as: 'ordersWithCoupon'
});

// Customer relationships
models.User.hasOne(models.Customer, {
    foreignKey: 'userId',
    as: 'customerProfile'
});

models.Customer.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
});

// Add Customer-Order association
models.Customer.hasMany(models.Order, {
    foreignKey: 'userId',
    sourceKey: 'userId',
    as: 'customerOrders'
});

models.Order.belongsTo(models.Customer, {
    foreignKey: 'userId',
    targetKey: 'userId',
    as: 'customer'
});

// Apply Promotion associations if they exist
if (typeof Promotion.associate === 'function') {
    Promotion.associate(models);
}

export default models;
export { 
    sequelize,
    User,
    Product,
    Cart,
    CartItem,
    Order,
    OrderItem,
    Customer,
    Coupon,
    Promotion,
    ProductVariant,
    Analytics
};

// No additional exports needed - we already exported User above 