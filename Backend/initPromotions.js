import { Promotion, Product } from './models/index.js';
import { discountService } from './services/discountService.js';
import sequelize from './config/database.js';

async function initPromotions() {
    try {
        console.log('Initializing promotion system...');
        
        // Sync Promotion model with database
        await Promotion.sync();
        
        // Check if there are any existing promotions
        const count = await Promotion.count();
        console.log(`Found ${count} existing promotions`);
        
        // Create sample promotion if none exist
        if (count === 0) {
            console.log('Creating sample promotion...');
            
            // Create welcome promotion
            const welcomePromotion = await Promotion.create({
                name: 'Welcome Sale',
                description: 'Special discount for our grand opening!',
                discountType: 'percentage',
                discountValue: 15,
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                isActive: true,
                promotionType: 'store_wide',
                priority: 1,
                highlightColor: '#FF5722'
            });
            
            console.log('Sample promotion created:', welcomePromotion.name);
            
            // Update all product prices with the promotion
            await discountService.updateAllDiscountedPrices();
            console.log('All product discounted prices updated');
        }
        
        console.log('Promotion system initialization complete!');
    } catch (error) {
        console.error('Error initializing promotion system:', error);
    } finally {
        await sequelize.close();
    }
}

initPromotions(); 