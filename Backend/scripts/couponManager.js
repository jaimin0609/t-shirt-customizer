#!/usr/bin/env node

import readline from 'readline';
import { Coupon } from '../models/index.js';
import sequelize from '../config/database.js';
import { Op } from 'sequelize';
import chalk from 'chalk';

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Helper function to ask questions
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Generate a unique coupon code
const generateCouponCode = (prefix = '') => {
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${randomPart}`;
};

// Main menu
async function showMainMenu() {
    console.clear();
    console.log(chalk.blue.bold('=========================================='));
    console.log(chalk.blue.bold('         COUPON MANAGEMENT SYSTEM        '));
    console.log(chalk.blue.bold('=========================================='));
    console.log('');
    console.log('1. View all coupons');
    console.log('2. Create a new coupon');
    console.log('3. Update a coupon');
    console.log('4. Delete a coupon');
    console.log('5. Generate bulk coupons');
    console.log('6. View coupon statistics');
    console.log('7. Deactivate expired coupons');
    console.log('8. Exit');
    console.log('');

    const choice = await question('Enter your choice (1-8): ');
    
    switch (choice) {
        case '1':
            await viewAllCoupons();
            break;
        case '2':
            await createCoupon();
            break;
        case '3':
            await updateCoupon();
            break;
        case '4':
            await deleteCoupon();
            break;
        case '5':
            await generateBulkCoupons();
            break;
        case '6':
            await viewCouponStats();
            break;
        case '7':
            await deactivateExpiredCoupons();
            break;
        case '8':
            console.log(chalk.green('Thank you for using the Coupon Management System.'));
            rl.close();
            process.exit(0);
            break;
        default:
            console.log(chalk.red('Invalid choice. Please try again.'));
            await pressAnyKey();
            showMainMenu();
    }
}

// View all coupons
async function viewAllCoupons() {
    console.clear();
    console.log(chalk.blue.bold('=========================================='));
    console.log(chalk.blue.bold('              ALL COUPONS                '));
    console.log(chalk.blue.bold('=========================================='));
    
    try {
        const coupons = await Coupon.findAll({
            order: [['createdAt', 'DESC']]
        });
        
        if (coupons.length === 0) {
            console.log(chalk.yellow('No coupons found in the database.'));
        } else {
            console.log(chalk.cyan(`Found ${coupons.length} coupons:`));
            console.log('');
            
            coupons.forEach((coupon, index) => {
                console.log(chalk.white.bold(`${index + 1}. Code: ${chalk.green(coupon.code)}`));
                console.log(`   Description: ${coupon.description || 'N/A'}`);
                console.log(`   Discount: ${coupon.discountType === 'percentage' ? coupon.discountValue + '%' : '$' + coupon.discountValue}`);
                console.log(`   Valid: ${new Date(coupon.startDate).toLocaleDateString()} to ${new Date(coupon.endDate).toLocaleDateString()}`);
                console.log(`   Status: ${coupon.isActive ? chalk.green('Active') : chalk.red('Inactive')}`);
                console.log(`   Public: ${coupon.isPublic ? chalk.green('Yes') : chalk.red('No')}`);
                console.log(`   Uses: ${coupon.usageCount}${coupon.usageLimit ? '/' + coupon.usageLimit : ''}`);
                console.log('');
            });
        }
    } catch (error) {
        console.error(chalk.red('Error fetching coupons:'), error);
    }
    
    await pressAnyKey();
    showMainMenu();
}

// Create a new coupon
async function createCoupon() {
    console.clear();
    console.log(chalk.blue.bold('=========================================='));
    console.log(chalk.blue.bold('            CREATE NEW COUPON            '));
    console.log(chalk.blue.bold('=========================================='));
    
    try {
        const codePrefix = await question('Enter code prefix (optional): ');
        const code = generateCouponCode(codePrefix ? `${codePrefix}-` : '');
        
        console.log(chalk.green(`Generated coupon code: ${code}`));
        
        const description = await question('Enter description: ');
        
        const discountTypeChoice = await question('Discount type (1 for percentage, 2 for fixed amount): ');
        const discountType = discountTypeChoice === '2' ? 'fixed_amount' : 'percentage';
        
        const discountValue = parseFloat(await question('Enter discount value: '));
        
        if (isNaN(discountValue)) {
            console.log(chalk.red('Invalid discount value. Please enter a number.'));
            await pressAnyKey();
            return createCoupon();
        }
        
        const daysValid = parseInt(await question('Enter number of days valid (default: 30): ') || '30');
        
        if (isNaN(daysValid)) {
            console.log(chalk.red('Invalid number of days. Please enter a number.'));
            await pressAnyKey();
            return createCoupon();
        }
        
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + daysValid);
        
        const usageLimitInput = await question('Enter usage limit (leave empty for unlimited): ');
        const usageLimit = usageLimitInput ? parseInt(usageLimitInput) : null;
        
        const minimumPurchaseInput = await question('Enter minimum purchase amount (leave empty for none): ');
        const minimumPurchase = minimumPurchaseInput ? parseFloat(minimumPurchaseInput) : null;
        
        const isPublicInput = await question('Make coupon public? (y/n): ');
        const isPublic = isPublicInput.toLowerCase() === 'y';
        
        let bannerText = '';
        let bannerColor = '#3b82f6';
        
        if (isPublic) {
            bannerText = await question('Enter banner text (leave empty for default): ');
            bannerColor = await question('Enter banner color hex code (leave empty for default blue): ') || '#3b82f6';
        }
        
        const coupon = await Coupon.create({
            code,
            description,
            discountType,
            discountValue,
            startDate,
            endDate,
            isActive: true,
            usageLimit,
            usageCount: 0,
            minimumPurchase,
            isPublic,
            bannerText: bannerText || `Use code ${code} for ${discountValue}${discountType === 'percentage' ? '%' : '$'} off!`,
            bannerColor
        });
        
        console.log(chalk.green('Coupon created successfully!'));
        console.log(chalk.cyan('Coupon details:'));
        console.log(JSON.stringify(coupon.toJSON(), null, 2));
    } catch (error) {
        console.error(chalk.red('Error creating coupon:'), error);
    }
    
    await pressAnyKey();
    showMainMenu();
}

// Update a coupon
async function updateCoupon() {
    console.clear();
    console.log(chalk.blue.bold('=========================================='));
    console.log(chalk.blue.bold('             UPDATE COUPON               '));
    console.log(chalk.blue.bold('=========================================='));
    
    try {
        const code = await question('Enter coupon code to update: ');
        
        const coupon = await Coupon.findOne({ where: { code } });
        
        if (!coupon) {
            console.log(chalk.red('Coupon not found.'));
            await pressAnyKey();
            return showMainMenu();
        }
        
        console.log(chalk.cyan('Current coupon details:'));
        console.log(JSON.stringify(coupon.toJSON(), null, 2));
        console.log('');
        console.log(chalk.yellow('Leave fields empty to keep current values.'));
        console.log('');
        
        const description = await question(`Enter new description (current: ${coupon.description || 'N/A'}): `);
        
        const discountTypeChoice = await question(`Enter new discount type (1 for percentage, 2 for fixed amount, current: ${coupon.discountType}): `);
        const discountType = discountTypeChoice ? (discountTypeChoice === '2' ? 'fixed_amount' : 'percentage') : coupon.discountType;
        
        const discountValueInput = await question(`Enter new discount value (current: ${coupon.discountValue}): `);
        const discountValue = discountValueInput ? parseFloat(discountValueInput) : coupon.discountValue;
        
        const daysValidInput = await question('Enter new number of days valid from today (leave empty to keep current end date): ');
        
        let endDate = coupon.endDate;
        if (daysValidInput) {
            const daysValid = parseInt(daysValidInput);
            if (!isNaN(daysValid)) {
                endDate = new Date();
                endDate.setDate(endDate.getDate() + daysValid);
            }
        }
        
        const isActiveInput = await question(`Make coupon ${coupon.isActive ? 'inactive' : 'active'}? (y/n): `);
        const isActive = isActiveInput.toLowerCase() === 'y' ? !coupon.isActive : coupon.isActive;
        
        const usageLimitInput = await question(`Enter new usage limit (current: ${coupon.usageLimit || 'unlimited'}): `);
        const usageLimit = usageLimitInput ? parseInt(usageLimitInput) : coupon.usageLimit;
        
        const minimumPurchaseInput = await question(`Enter new minimum purchase amount (current: ${coupon.minimumPurchase || 'none'}): `);
        const minimumPurchase = minimumPurchaseInput ? parseFloat(minimumPurchaseInput) : coupon.minimumPurchase;
        
        const isPublicInput = await question(`Make coupon ${coupon.isPublic ? 'private' : 'public'}? (y/n): `);
        const isPublic = isPublicInput.toLowerCase() === 'y' ? !coupon.isPublic : coupon.isPublic;
        
        let bannerText = coupon.bannerText;
        let bannerColor = coupon.bannerColor;
        
        if (isPublic) {
            const bannerTextInput = await question(`Enter new banner text (current: ${coupon.bannerText || 'default'}): `);
            bannerText = bannerTextInput || coupon.bannerText;
            
            const bannerColorInput = await question(`Enter new banner color hex code (current: ${coupon.bannerColor}): `);
            bannerColor = bannerColorInput || coupon.bannerColor;
        }
        
        await coupon.update({
            description: description || coupon.description,
            discountType,
            discountValue,
            endDate,
            isActive,
            usageLimit,
            minimumPurchase,
            isPublic,
            bannerText,
            bannerColor
        });
        
        console.log(chalk.green('Coupon updated successfully!'));
        console.log(chalk.cyan('Updated coupon details:'));
        console.log(JSON.stringify(coupon.toJSON(), null, 2));
    } catch (error) {
        console.error(chalk.red('Error updating coupon:'), error);
    }
    
    await pressAnyKey();
    showMainMenu();
}

// Delete a coupon
async function deleteCoupon() {
    console.clear();
    console.log(chalk.blue.bold('=========================================='));
    console.log(chalk.blue.bold('             DELETE COUPON               '));
    console.log(chalk.blue.bold('=========================================='));
    
    try {
        const code = await question('Enter coupon code to delete: ');
        
        const coupon = await Coupon.findOne({ where: { code } });
        
        if (!coupon) {
            console.log(chalk.red('Coupon not found.'));
            await pressAnyKey();
            return showMainMenu();
        }
        
        console.log(chalk.cyan('Coupon details:'));
        console.log(JSON.stringify(coupon.toJSON(), null, 2));
        console.log('');
        
        const confirm = await question(chalk.red.bold('Are you sure you want to delete this coupon? (y/n): '));
        
        if (confirm.toLowerCase() === 'y') {
            await coupon.destroy();
            console.log(chalk.green('Coupon deleted successfully!'));
        } else {
            console.log(chalk.yellow('Deletion cancelled.'));
        }
    } catch (error) {
        console.error(chalk.red('Error deleting coupon:'), error);
    }
    
    await pressAnyKey();
    showMainMenu();
}

// Generate bulk coupons
async function generateBulkCoupons() {
    console.clear();
    console.log(chalk.blue.bold('=========================================='));
    console.log(chalk.blue.bold('         GENERATE BULK COUPONS           '));
    console.log(chalk.blue.bold('=========================================='));
    
    try {
        const countInput = await question('Enter number of coupons to generate (max 100): ');
        const count = parseInt(countInput);
        
        if (isNaN(count) || count <= 0 || count > 100) {
            console.log(chalk.red('Invalid number. Please enter a value between 1 and 100.'));
            await pressAnyKey();
            return generateBulkCoupons();
        }
        
        const codePrefix = await question('Enter code prefix (optional): ');
        const description = await question('Enter description: ');
        
        const discountTypeChoice = await question('Discount type (1 for percentage, 2 for fixed amount): ');
        const discountType = discountTypeChoice === '2' ? 'fixed_amount' : 'percentage';
        
        const discountValue = parseFloat(await question('Enter discount value: '));
        
        if (isNaN(discountValue)) {
            console.log(chalk.red('Invalid discount value. Please enter a number.'));
            await pressAnyKey();
            return generateBulkCoupons();
        }
        
        const daysValid = parseInt(await question('Enter number of days valid (default: 30): ') || '30');
        
        if (isNaN(daysValid)) {
            console.log(chalk.red('Invalid number of days. Please enter a number.'));
            await pressAnyKey();
            return generateBulkCoupons();
        }
        
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + daysValid);
        
        const usageLimitInput = await question('Enter usage limit (leave empty for unlimited): ');
        const usageLimit = usageLimitInput ? parseInt(usageLimitInput) : null;
        
        const minimumPurchaseInput = await question('Enter minimum purchase amount (leave empty for none): ');
        const minimumPurchase = minimumPurchaseInput ? parseFloat(minimumPurchaseInput) : null;
        
        console.log(chalk.yellow(`Generating ${count} coupons...`));
        
        const coupons = [];
        
        for (let i = 0; i < count; i++) {
            const code = generateCouponCode(codePrefix ? `${codePrefix}-` : '');
            
            const coupon = await Coupon.create({
                code,
                description,
                discountType,
                discountValue,
                startDate,
                endDate,
                isActive: true,
                usageLimit,
                usageCount: 0,
                minimumPurchase,
                isPublic: false
            });
            
            coupons.push(coupon);
        }
        
        console.log(chalk.green(`${count} coupons generated successfully!`));
        console.log('');
        console.log(chalk.cyan('Generated coupon codes:'));
        coupons.forEach((coupon, index) => {
            console.log(`${index + 1}. ${chalk.green(coupon.code)}`);
        });
    } catch (error) {
        console.error(chalk.red('Error generating bulk coupons:'), error);
    }
    
    await pressAnyKey();
    showMainMenu();
}

// View coupon statistics
async function viewCouponStats() {
    console.clear();
    console.log(chalk.blue.bold('=========================================='));
    console.log(chalk.blue.bold('          COUPON STATISTICS              '));
    console.log(chalk.blue.bold('=========================================='));
    
    try {
        // Get basic statistics
        const totalCoupons = await Coupon.count();
        const activeCoupons = await Coupon.count({ 
            where: { 
                isActive: true,
                endDate: { [Op.gte]: new Date() }
            } 
        });
        const expiredCoupons = await Coupon.count({ 
            where: { 
                endDate: { [Op.lt]: new Date() }
            } 
        });
        const publicCoupons = await Coupon.count({ where: { isPublic: true } });
        
        // Get most used coupons
        const topCoupons = await Coupon.findAll({
            order: [['usageCount', 'DESC']],
            limit: 5,
            attributes: ['code', 'discountValue', 'discountType', 'usageCount', 'usageLimit']
        });
        
        // Calculate average discount
        const allCoupons = await Coupon.findAll({
            attributes: ['discountType', 'discountValue']
        });
        
        let totalPercentage = 0;
        let percentageCount = 0;
        let totalFixed = 0;
        let fixedCount = 0;
        
        allCoupons.forEach(coupon => {
            if (coupon.discountType === 'percentage') {
                totalPercentage += parseFloat(coupon.discountValue);
                percentageCount++;
            } else {
                totalFixed += parseFloat(coupon.discountValue);
                fixedCount++;
            }
        });
        
        const avgPercentageDiscount = percentageCount > 0 ? totalPercentage / percentageCount : 0;
        const avgFixedDiscount = fixedCount > 0 ? totalFixed / fixedCount : 0;
        
        // Display statistics
        console.log(chalk.cyan('General Statistics:'));
        console.log(`Total Coupons: ${chalk.yellow(totalCoupons)}`);
        console.log(`Active Coupons: ${chalk.green(activeCoupons)}`);
        console.log(`Expired Coupons: ${chalk.red(expiredCoupons)}`);
        console.log(`Public Coupons: ${chalk.blue(publicCoupons)}`);
        console.log('');
        
        console.log(chalk.cyan('Average Discounts:'));
        console.log(`Percentage Discounts: ${chalk.yellow(avgPercentageDiscount.toFixed(2))}%`);
        console.log(`Fixed Amount Discounts: $${chalk.yellow(avgFixedDiscount.toFixed(2))}`);
        console.log('');
        
        console.log(chalk.cyan('Top 5 Most Used Coupons:'));
        if (topCoupons.length === 0) {
            console.log(chalk.yellow('No coupons have been used yet.'));
        } else {
            topCoupons.forEach((coupon, index) => {
                console.log(`${index + 1}. Code: ${chalk.green(coupon.code)}`);
                console.log(`   Discount: ${coupon.discountType === 'percentage' ? coupon.discountValue + '%' : '$' + coupon.discountValue}`);
                console.log(`   Usage: ${chalk.yellow(coupon.usageCount)}${coupon.usageLimit ? '/' + coupon.usageLimit : ''}`);
                console.log('');
            });
        }
    } catch (error) {
        console.error(chalk.red('Error fetching coupon statistics:'), error);
    }
    
    await pressAnyKey();
    showMainMenu();
}

// Deactivate expired coupons
async function deactivateExpiredCoupons() {
    console.clear();
    console.log(chalk.blue.bold('=========================================='));
    console.log(chalk.blue.bold('      DEACTIVATE EXPIRED COUPONS         '));
    console.log(chalk.blue.bold('=========================================='));
    
    try {
        const expiredCount = await Coupon.count({
            where: {
                endDate: { [Op.lt]: new Date() },
                isActive: true
            }
        });
        
        if (expiredCount === 0) {
            console.log(chalk.green('No expired coupons found that need deactivation.'));
            await pressAnyKey();
            return showMainMenu();
        }
        
        console.log(chalk.yellow(`Found ${expiredCount} expired coupons that are still active.`));
        const confirm = await question('Do you want to deactivate them? (y/n): ');
        
        if (confirm.toLowerCase() === 'y') {
            const result = await Coupon.update(
                { isActive: false },
                {
                    where: {
                        endDate: { [Op.lt]: new Date() },
                        isActive: true
                    }
                }
            );
            
            console.log(chalk.green(`Successfully deactivated ${result[0]} expired coupons.`));
        } else {
            console.log(chalk.yellow('Operation cancelled.'));
        }
    } catch (error) {
        console.error(chalk.red('Error deactivating expired coupons:'), error);
    }
    
    await pressAnyKey();
    showMainMenu();
}

// Helper to wait for user input
async function pressAnyKey() {
    console.log('');
    await question('Press Enter to continue...');
}

// Initialize database connection and start app
async function initApp() {
    try {
        console.log(chalk.yellow('Connecting to database...'));
        await sequelize.authenticate();
        console.log(chalk.green('Database connection established successfully.'));
        
        showMainMenu();
    } catch (error) {
        console.error(chalk.red('Unable to connect to the database:'), error);
        rl.close();
        process.exit(1);
    }
}

// Start the application
initApp(); 