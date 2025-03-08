/**
 * Diagnostic tool to check for public coupons in the database
 * This script can be used to diagnose issues with public coupons not appearing
 * in the promotion banner.
 * 
 * Run with: node check-public-coupons.js
 */

// ES Module imports
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Sequelize, Op } from 'sequelize';

// Get the directory path to resolve the .env file location
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

// Load environment variables from the proper path
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

console.log('Database Connection Details:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('Password provided:', process.env.DB_PASSWORD ? 'Yes' : 'No');

// Create a direct connection to the database
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false
    }
);

// Define the Coupon model directly for this script
const Coupon = sequelize.define('Coupon', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    description: {
        type: Sequelize.STRING,
        allowNull: true
    },
    discountType: {
        type: Sequelize.ENUM('percentage', 'fixed'),
        allowNull: false,
        defaultValue: 'percentage'
    },
    discountValue: {
        type: Sequelize.FLOAT,
        allowNull: false
    },
    startDate: {
        type: Sequelize.DATE,
        allowNull: false
    },
    endDate: {
        type: Sequelize.DATE,
        allowNull: false
    },
    isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    },
    usageLimit: {
        type: Sequelize.INTEGER,
        defaultValue: 1
    },
    usageCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    minimumPurchase: {
        type: Sequelize.FLOAT,
        defaultValue: 0
    },
    isPublic: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    bannerText: {
        type: Sequelize.STRING,
        allowNull: true
    },
    bannerColor: {
        type: Sequelize.STRING,
        allowNull: true
    }
}, {
    tableName: 'Coupons',
    timestamps: true
});

async function checkPublicCoupons() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ Database connection established');
        
        // Check for any coupons
        const allCoupons = await Coupon.findAll();
        console.log(`Total coupons in database: ${allCoupons.length}`);
        
        // Current date for comparison
        const now = new Date();
        console.log('Current date:', now.toISOString());
        
        // Check for public coupons (regardless of dates)
        const allPublicCoupons = await Coupon.findAll({
            where: {
                isPublic: true
            }
        });
        console.log(`\n🔍 Total public coupons: ${allPublicCoupons.length}`);
        if (allPublicCoupons.length > 0) {
            console.log('\nAll public coupons (regardless of active status or dates):');
            allPublicCoupons.forEach((coupon, index) => {
                console.log(`\n[${index + 1}] ${coupon.code}`);
                console.log(`   Banner Text: ${coupon.bannerText}`);
                console.log(`   Active: ${coupon.isActive}`);
                console.log(`   Date Range: ${new Date(coupon.startDate).toLocaleDateString()} to ${new Date(coupon.endDate).toLocaleDateString()}`);
                console.log(`   Current: ${new Date(coupon.startDate) <= now && new Date(coupon.endDate) >= now ? 'Yes' : 'No'}`);
            });
        }
        
        // Check for active public coupons (regardless of dates)
        const activePublicCoupons = await Coupon.findAll({
            where: {
                isPublic: true,
                isActive: true
            }
        });
        console.log(`\n🔍 Total active public coupons: ${activePublicCoupons.length}`);
        
        // Check for current public coupons (valid dates + active)
        const currentPublicCoupons = await Coupon.findAll({
            where: {
                isPublic: true,
                isActive: true,
                startDate: { [Op.lte]: now },
                endDate: { [Op.gte]: now }
            }
        });
        console.log(`\n🔍 Total current public coupons (active + valid dates): ${currentPublicCoupons.length}`);
        
        if (currentPublicCoupons.length > 0) {
            console.log('\nCurrently active public coupons that should display:');
            currentPublicCoupons.forEach((coupon, index) => {
                console.log(`\n[${index + 1}] ${coupon.code}`);
                console.log(`   Banner Text: ${coupon.bannerText}`);
                console.log(`   Discount: ${coupon.discountType === 'percentage' ? coupon.discountValue + '%' : '$' + coupon.discountValue}`);
                console.log(`   Min Purchase: $${coupon.minimumPurchase}`);
                console.log(`   Banner Color: ${coupon.bannerColor || 'Default'}`);
            });
        } else {
            console.log('\n❌ No active public coupons found for the current date.');
            console.log('This explains why no banners are showing on the frontend.');
        }
        
        if (currentPublicCoupons.length === 0 && allPublicCoupons.length > 0) {
            // Provide hints about why coupons aren't showing
            console.log('\n🔍 Possible reasons why public coupons are not showing:');
            
            allPublicCoupons.forEach((coupon, index) => {
                console.log(`\n[${index + 1}] Coupon ${coupon.code}:`);
                
                if (!coupon.isActive) {
                    console.log('   ❌ Coupon is not active (isActive = false)');
                }
                
                const startDate = new Date(coupon.startDate);
                const endDate = new Date(coupon.endDate);
                
                if (startDate > now) {
                    console.log(`   ❌ Start date (${startDate.toLocaleDateString()}) is in the future`);
                }
                
                if (endDate < now) {
                    console.log(`   ❌ End date (${endDate.toLocaleDateString()}) has passed`);
                }
                
                if (!coupon.bannerText) {
                    console.log('   ⚠️ Missing banner text');
                }
            });
            
            console.log('\n💡 Consider creating a new coupon or updating an existing one to be:');
            console.log('   - Active (isActive = true)');
            console.log('   - Public (isPublic = true)');
            console.log('   - Valid dates (startDate ≤ today ≤ endDate)');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        // Close the database connection
        if (sequelize) {
            await sequelize.close();
            console.log('\nDatabase connection closed');
        }
    }
}

// Run the function
checkPublicCoupons(); 