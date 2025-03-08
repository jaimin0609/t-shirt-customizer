import { Router } from 'express';
import { Coupon, Order } from '../models/index.js';
import { auth, isAdmin } from '../middleware/auth.js';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { Sequelize } from 'sequelize';

const router = Router();

// ===== PUBLIC ENDPOINTS =====

// Get public coupons for promotional banner
router.get('/public', async (req, res) => {
    try {
        console.log('Fetching public coupons for banner');
        
        const publicCoupons = await Coupon.findAll({
            where: {
                isPublic: true,
                isActive: true,
                startDate: { [Op.lte]: new Date() },
                endDate: { [Op.gte]: new Date() }
            },
            attributes: ['id', 'code', 'bannerText', 'bannerColor', 'discountType', 'discountValue']
        });

        console.log(`Found ${publicCoupons.length} public coupons`);

        if (publicCoupons.length === 0) {
            return res.json([]);
        }

        res.json(publicCoupons);
    } catch (error) {
        console.error('Error fetching public coupons:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch public coupons',
            error: error.message
        });
    }
});

// PROMOTION TEST ENDPOINT - Returns a test coupon for frontend debugging
router.get('/debug/promotion-test', async (req, res) => {
    console.log('Promotion test endpoint accessed');
    res.set('Access-Control-Allow-Origin', '*'); // Allow from any origin for testing
    
    const testCoupon = {
        id: 'test-001',
        code: 'DEBUG20',
        discountType: 'percentage',
        discountValue: 20,
        bannerText: '🔧 DEBUG MODE: Test banner with 20% discount. Use code DEBUG20!',
        bannerColor: '#ff4081'
    };
    
    res.json([testCoupon]);
});

// ===== PROTECTED ENDPOINTS BELOW =====
// Apply auth middleware to all routes defined after this point
// This is important to make sure the /public endpoint above doesn't require auth

// ===== ADMIN ENDPOINTS =====

// Generate a new coupon (admin only)
router.post('/generate', auth, isAdmin, async (req, res) => {
    try {
        const {
            description,
            discountType,
            discountValue,
            startDate,
            endDate,
            usageLimit,
            minimumPurchase,
            isPublic,
            bannerText,
            bannerColor,
            codePrefix
        } = req.body;

        // Generate a unique coupon code
        const prefix = codePrefix ? `${codePrefix}-` : '';
        const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
        const code = `${prefix}${randomPart}`;

        const coupon = await Coupon.create({
            code,
            description,
            discountType: discountType || 'percentage',
            discountValue: discountValue || 10,
            startDate: startDate || new Date(),
            endDate: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            isActive: true,
            usageLimit,
            usageCount: 0,
            minimumPurchase,
            isPublic: isPublic || false,
            bannerText: bannerText || `Use code ${code} for ${discountValue}% off!`,
            bannerColor: bannerColor || '#3b82f6'
        });

        res.status(201).json({
            success: true,
            message: 'Coupon generated successfully',
            coupon
        });
    } catch (error) {
        console.error('Error generating coupon:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate coupon',
            error: error.message
        });
    }
});

// Get all coupons (admin only)
router.get('/admin', auth, isAdmin, async (req, res) => {
    try {
        const coupons = await Coupon.findAll({
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            coupons
        });
    } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch coupons',
            error: error.message
        });
    }
});

// Get a single coupon by ID (admin only)
router.get('/:id', auth, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const coupon = await Coupon.findByPk(id);
        
        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }
        
        res.json({
            success: true,
            coupon
        });
    } catch (error) {
        console.error('Error fetching coupon details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch coupon details',
            error: error.message
        });
    }
});

// Update a coupon (admin only)
router.put('/:id', auth, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            description,
            discountType,
            discountValue,
            startDate,
            endDate,
            isActive,
            usageLimit,
            minimumPurchase,
            isPublic,
            bannerText,
            bannerColor
        } = req.body;

        const coupon = await Coupon.findByPk(id);
        
        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        await coupon.update({
            description,
            discountType,
            discountValue,
            startDate,
            endDate,
            isActive,
            usageLimit,
            minimumPurchase,
            isPublic,
            bannerText,
            bannerColor
        });

        res.json({
            success: true,
            message: 'Coupon updated successfully',
            coupon
        });
    } catch (error) {
        console.error('Error updating coupon:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update coupon',
            error: error.message
        });
    }
});

// Delete a coupon (admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const coupon = await Coupon.findByPk(id);
        
        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        await coupon.destroy();

        res.json({
            success: true,
            message: 'Coupon deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting coupon:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete coupon',
            error: error.message
        });
    }
});

// Bulk generate multiple coupons (admin only)
router.post('/bulk-generate', auth, isAdmin, async (req, res) => {
    try {
        const {
            count = 5,
            description,
            discountType,
            discountValue,
            startDate,
            endDate,
            usageLimit,
            minimumPurchase,
            isPublic,
            bannerText,
            bannerColor,
            codePrefix
        } = req.body;

        // Validate count
        if (count > 100) {
            return res.status(400).json({
                success: false,
                message: 'Maximum 100 coupons can be generated at once'
            });
        }

        const coupons = [];

        for (let i = 0; i < count; i++) {
            // Generate a unique coupon code
            const prefix = codePrefix ? `${codePrefix}-` : '';
            const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
            const code = `${prefix}${randomPart}`;

            const couponData = {
                code,
                description,
                discountType: discountType || 'percentage',
                discountValue: discountValue || 10,
                startDate: startDate || new Date(),
                endDate: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                isActive: true,
                usageLimit,
                usageCount: 0,
                minimumPurchase,
                isPublic: isPublic || false,
                bannerText: bannerText || `Use code ${code} for ${discountValue}% off!`,
                bannerColor: bannerColor || '#3b82f6'
            };

            const coupon = await Coupon.create(couponData);
            coupons.push(coupon);
        }

        res.status(201).json({
            success: true,
            message: `${count} coupons generated successfully`,
            coupons
        });
    } catch (error) {
        console.error('Error bulk generating coupons:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate coupons',
            error: error.message
        });
    }
});

// Get coupon usage statistics (admin only)
router.get('/stats', auth, isAdmin, async (req, res) => {
    try {
        console.log('Fetching coupon statistics for admin panel');
        const now = new Date();
        
        // Get basic statistics
        const totalCoupons = await Coupon.count();
        console.log(`Total coupons: ${totalCoupons}`);
        
        // Active coupons are those that:
        // 1. Have isActive flag set to true
        // 2. Start date is now or in the past
        // 3. End date is in the future
        const activeCoupons = await Coupon.count({ 
            where: { 
                isActive: true,
                startDate: { [Op.lte]: now },
                endDate: { [Op.gte]: now }
            } 
        });
        console.log(`Active coupons: ${activeCoupons}`);
        
        // Expired coupons (past end date)
        const expiredCoupons = await Coupon.count({
            where: {
                endDate: { [Op.lt]: now }
            }
        });
        console.log(`Expired coupons: ${expiredCoupons}`);
        
        // Public coupons that are active and current
        const publicCoupons = await Coupon.count({
            where: {
                isPublic: true,
                isActive: true,
                startDate: { [Op.lte]: now },
                endDate: { [Op.gte]: now }
            }
        });
        console.log(`Public coupons: ${publicCoupons}`);
        
        // Redeemed coupons (if there is usageLimit and usageCount >= usageLimit)
        const redeemedCoupons = await Coupon.count({
            where: {
                usageLimit: { [Op.ne]: null },
                usageCount: { [Op.gte]: Sequelize.col('usageLimit') }
            }
        });
        console.log(`Redeemed coupons: ${redeemedCoupons}`);
        
        // Send response with all statistics
        console.log('Successfully fetched coupon statistics');
        return res.status(200).json({
            success: true,
            totalCoupons,
            activeCoupons,
            expiredCoupons,
            redeemedCoupons,
            publicCoupons
        });
    } catch (error) {
        console.error('Error fetching coupon stats:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error fetching coupon statistics',
            error: error.message 
        });
    }
});

// Deactivate all expired coupons (admin only)
router.post('/deactivate-expired', auth, isAdmin, async (req, res) => {
    try {
        const result = await Coupon.update(
            { isActive: false },
            { 
                where: { 
                    endDate: { [Op.lt]: new Date() },
                    isActive: true
                } 
            }
        );
        
        const deactivatedCount = result[0]; // Number of rows affected
        
        res.json({
            success: true,
            message: `${deactivatedCount} expired coupons deactivated successfully`
        });
    } catch (error) {
        console.error('Error deactivating expired coupons:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to deactivate expired coupons',
            error: error.message
        });
    }
});

// Toggle a coupon's public status (admin only)
router.patch('/:id/toggle-public', auth, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const coupon = await Coupon.findByPk(id);
        
        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }
        
        coupon.isPublic = !coupon.isPublic;
        await coupon.save();
        
        res.json({
            success: true,
            message: `Coupon public status ${coupon.isPublic ? 'enabled' : 'disabled'} successfully`,
            coupon
        });
    } catch (error) {
        console.error('Error toggling coupon public status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle coupon public status',
            error: error.message
        });
    }
});

// DEBUG ROUTE - Get all coupons with public/active status (for troubleshooting)
router.get('/debug-all', async (req, res) => {
    try {
        console.log('DEBUG: Fetching all coupons with status info');
        
        // Get current date for comparison
        const now = new Date();
        
        // Find all coupons
        const allCoupons = await Coupon.findAll({
            attributes: [
                'id', 'code', 'isPublic', 'isActive', 
                'startDate', 'endDate', 'bannerText', 'bannerColor'
            ]
        });
        
        // Add debug info about why each coupon would/wouldn't show
        const couponsWithDebugInfo = allCoupons.map(coupon => {
            const couponData = coupon.toJSON();
            
            // Check each condition
            const isPublicOk = couponData.isPublic === true;
            const isActiveOk = couponData.isActive === true;
            const startDateOk = couponData.startDate <= now;
            const endDateOk = couponData.endDate >= now;
            
            // Would this coupon be shown in banner?
            const wouldShow = isPublicOk && isActiveOk && startDateOk && endDateOk;
            
            return {
                ...couponData,
                debug: {
                    wouldShowInBanner: wouldShow,
                    currentDate: now.toISOString(),
                    checks: {
                        isPublic: isPublicOk,
                        isActive: isActiveOk,
                        startDatePassed: startDateOk,
                        endDateNotPassed: endDateOk
                    }
                }
            };
        });
        
        res.json({
            count: couponsWithDebugInfo.length,
            coupons: couponsWithDebugInfo
        });
    } catch (error) {
        console.error('Error in debug-all coupons route:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch debug coupon info',
            error: error.message
        });
    }
});

// Validate a coupon code
router.post('/validate', async (req, res) => {
    try {
        const { code, cartTotal } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code is required'
            });
        }

        const coupon = await Coupon.findOne({
            where: {
                code: code.toUpperCase(),
                isActive: true,
                startDate: { [Op.lte]: new Date() },
                endDate: { [Op.gte]: new Date() }
            }
        });

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Invalid or expired coupon code'
            });
        }

        // Check usage limit
        if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
            return res.status(400).json({
                success: false,
                message: 'This coupon has reached its usage limit'
            });
        }

        // Check minimum purchase requirement
        if (coupon.minimumPurchase && cartTotal < coupon.minimumPurchase) {
            const minPurchaseValue = parseFloat(coupon.minimumPurchase) || 0;
            return res.status(400).json({
                success: false,
                message: `This coupon requires a minimum purchase of $${minPurchaseValue.toFixed(2)}`,
                minimumPurchase: minPurchaseValue
            });
        }

        // Calculate discount
        let discountAmount = 0;
        if (coupon.discountType === 'percentage') {
            discountAmount = (cartTotal * parseFloat(coupon.discountValue)) / 100;
        } else {
            discountAmount = parseFloat(coupon.discountValue);
        }

        // Cap the discount at the cart total
        discountAmount = Math.min(discountAmount, cartTotal);

        const newTotal = cartTotal - discountAmount;

        res.json({
            success: true,
            coupon: {
                id: coupon.id,
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                discountAmount: discountAmount.toFixed(2),
                newTotal: newTotal.toFixed(2)
            }
        });
    } catch (error) {
        console.error('Error validating coupon:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to validate coupon',
            error: error.message
        });
    }
});

// Apply a coupon to an order
router.post('/apply/:orderId', auth, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { couponId } = req.body;

        const order = await Order.findByPk(orderId);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const coupon = await Coupon.findByPk(couponId);
        
        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        // Check if coupon is valid
        if (!coupon.isActive || 
            coupon.startDate > new Date() || 
            coupon.endDate < new Date() ||
            (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit)) {
            return res.status(400).json({
                success: false,
                message: 'Coupon is no longer valid'
            });
        }

        // Check minimum purchase requirement
        if (coupon.minimumPurchase && order.subtotal < coupon.minimumPurchase) {
            return res.status(400).json({
                success: false,
                message: `This coupon requires a minimum purchase of $${coupon.minimumPurchase.toFixed(2)}`,
                minimumPurchase: coupon.minimumPurchase
            });
        }

        // Calculate discount
        let discountAmount = 0;
        if (coupon.discountType === 'percentage') {
            discountAmount = (order.subtotal * coupon.discountValue) / 100;
        } else {
            discountAmount = coupon.discountValue;
        }

        // Cap the discount at the order subtotal
        discountAmount = Math.min(discountAmount, order.subtotal);
        const newTotal = order.subtotal - discountAmount + order.shippingCost + order.taxAmount;

        // Update the order
        await order.update({
            couponId: coupon.id,
            discountAmount,
            total: newTotal
        });

        // Increment usage count
        await coupon.update({
            usageCount: coupon.usageCount + 1
        });

        res.json({
            success: true,
            message: 'Coupon applied successfully',
            order: {
                id: order.id,
                subtotal: order.subtotal,
                discountAmount,
                shippingCost: order.shippingCost,
                taxAmount: order.taxAmount,
                total: newTotal
            }
        });
    } catch (error) {
        console.error('Error applying coupon:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to apply coupon',
            error: error.message
        });
    }
});

export default router; 