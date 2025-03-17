import { Product, ProductVariant, sequelize } from '../models/index.js';
import { Op } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

/**
 * Service for handling product-related business logic
 */
class ProductService {
    /**
     * Get all products with optional filtering
     * 
     * @param {Object} options - Query options
     * @param {number} options.page - Page number
     * @param {number} options.limit - Items per page
     * @param {string} options.search - Search term
     * @param {string} options.category - Category filter
     * @param {string} options.sortBy - Sort field
     * @param {string} options.sortOrder - Sort direction (asc/desc)
     * @returns {Promise<Object>} Paginated products
     */
    async getAllProducts(options = {}) {
        const {
            page = 1,
            limit = 10,
            search = '',
            category = '',
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = options;

        const offset = (page - 1) * limit;
        const where = {};

        // Add search filter if provided
        if (search) {
            where.name = { [Op.like]: `%${search}%` };
        }

        // Add category filter if provided
        if (category) {
            where.category = category;
        }

        // Get total count for pagination
        const count = await Product.count({ where });

        // Get products with pagination
        const products = await Product.findAll({
            where,
            limit,
            offset,
            order: [[sortBy, sortOrder]],
            include: [{ model: ProductVariant, as: 'variants' }]
        });

        return {
            products,
            pagination: {
                total: count,
                pages: Math.ceil(count / limit),
                currentPage: parseInt(page),
                limit: parseInt(limit)
            }
        };
    }

    /**
     * Get featured products
     * 
     * @param {number} limit - Number of products to return
     * @returns {Promise<Array>} Array of featured products
     */
    async getFeaturedProducts(limit = 6) {
        return Product.findAll({
            where: { featured: true },
            limit,
            include: [{ model: ProductVariant, as: 'variants' }]
        });
    }

    /**
     * Get a product by ID
     * 
     * @param {number} id - Product ID
     * @returns {Promise<Object>} Product object
     */
    async getProductById(id) {
        return Product.findByPk(id, {
            include: [{ model: ProductVariant, as: 'variants' }]
        });
    }

    /**
     * Create a new product
     * 
     * @param {Object} productData - Product data
     * @returns {Promise<Object>} Created product
     */
    async createProduct(productData) {
        // Start a transaction to ensure data consistency
        const transaction = await sequelize.transaction();

        try {
            // Create the product
            const product = await Product.create(productData, { transaction });

            // If variants are included, create them
            if (productData.variants && Array.isArray(productData.variants)) {
                const variants = productData.variants.map(variant => ({
                    ...variant,
                    productId: product.id
                }));

                await ProductVariant.bulkCreate(variants, { transaction });
            }

            // Commit the transaction
            await transaction.commit();

            // Return the product with variants
            return this.getProductById(product.id);
        } catch (error) {
            // Rollback in case of error
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Update a product
     * 
     * @param {number} id - Product ID
     * @param {Object} updateData - Updated product data
     * @returns {Promise<Object>} Updated product
     */
    async updateProduct(id, updateData) {
        // Start a transaction
        const transaction = await sequelize.transaction();

        try {
            // Update the product
            await Product.update(updateData, {
                where: { id },
                transaction
            });

            // If variants are included, handle them
            if (updateData.variants && Array.isArray(updateData.variants)) {
                // First, remove any variants not in the update
                if (updateData.replaceAllVariants) {
                    await ProductVariant.destroy({
                        where: { productId: id },
                        transaction
                    });
                }

                // Process each variant
                for (const variant of updateData.variants) {
                    if (variant.id) {
                        // Update existing variant
                        await ProductVariant.update(variant, {
                            where: { id: variant.id, productId: id },
                            transaction
                        });
                    } else {
                        // Create new variant
                        await ProductVariant.create({
                            ...variant,
                            productId: id
                        }, { transaction });
                    }
                }
            }

            // Commit the transaction
            await transaction.commit();

            // Return the updated product
            return this.getProductById(id);
        } catch (error) {
            // Rollback in case of error
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Delete a product
     * 
     * @param {number} id - Product ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteProduct(id) {
        // Start a transaction
        const transaction = await sequelize.transaction();

        try {
            // Delete associated variants first
            await ProductVariant.destroy({
                where: { productId: id },
                transaction
            });

            // Delete the product
            const result = await Product.destroy({
                where: { id },
                transaction
            });

            // Commit the transaction
            await transaction.commit();

            return result > 0;
        } catch (error) {
            // Rollback in case of error
            await transaction.rollback();
            throw error;
        }
    }
}

export default new ProductService(); 