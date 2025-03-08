/**
 * Direct database insertion script for creating a public coupon
 * Run with: node insert-coupon.js
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

async function insertPublicCoupon() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ Database connection established');

        // Generate a coupon code
        const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
        const code = `DIRECT-${randomPart}`;
        
        // Current date and end date (7 days from now)
        const now = new Date();
        const endDate = new Date();
        endDate.setDate(now.getDate() + 7);
        
        console.log('Creating public coupon directly in database...');
        const coupon = await Coupon.create({
            code,
            description: 'Special Direct DB Coupon',
            discountType: 'percentage',
            discountValue: 20,
            startDate: now,
            endDate: endDate,
            isActive: true,
            usageLimit: 100,
            usageCount: 0,
            minimumPurchase: 15,
            isPublic: true,
            bannerText: `🎁 Special Offer! Use code ${code} for 20% off orders over $15!`,
            bannerColor: '#9c27b0'
        });
        
        console.log('✅ Public coupon created successfully!');
        console.log('Coupon details:');
        console.log(JSON.stringify(coupon.toJSON(), null, 2));
        
        // Verify coupon was created by fetching all public coupons
        console.log('Verifying public coupons...');
        const publicCoupons = await Coupon.findAll({
            where: {
                isPublic: true,
                isActive: true,
                startDate: { [Op.lte]: new Date() },
                endDate: { [Op.gte]: new Date() }
            }
        });
        
        console.log(`Found ${publicCoupons.length} public coupons`);
        publicCoupons.forEach(c => {
            console.log(`- ${c.code}: ${c.bannerText}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        // Close the database connection
        if (sequelize) {
            await sequelize.close();
            console.log('Database connection closed');
        }
    }
}

// Run the function
insertPublicCoupon(); 