# Coupon Creation Scripts

This folder contains helpful scripts for creating coupons that will automatically display in the promotion banner on your website.

## Available Scripts

### 1. Create Public Coupon via API

**Script:** `create-simple-coupon.js`

This script creates a public coupon by making API calls to your backend server. The coupon will automatically appear in the promotion banner on your website.

**How to use:**

1. Open the file `create-simple-coupon.js` in a text editor
2. Update the following settings at the top of the file:
   - `ADMIN_EMAIL`: Your admin email address
   - `ADMIN_PASSWORD`: Your admin password
3. Save the file
4. Run the script with this command:
   ```
   npm run create-coupon
   ```

The script will:
- Create a public coupon with a 15% discount
- Set the coupon to be valid for 7 days
- Make the coupon visible in the promotion banner
- Display the coupon details in the console

### 2. Insert Coupon Directly to Database

**Script:** `insert-coupon.js`

This script creates a coupon by directly inserting it into the database. Use this as a backup method if the API approach doesn't work.

**How to use:**

1. Run the script with this command:
   ```
   npm run insert-coupon
   ```

The script will:
- Create a public coupon with a 20% discount
- Set the coupon to be valid for 7 days
- Make the coupon visible in the promotion banner
- Verify that the coupon was successfully created

## Troubleshooting

If you encounter any issues:

1. Make sure your backend server is running
2. Check that your admin credentials are correct
3. Verify the database connection settings in your `.env` file
4. Restart the frontend application after creating a new coupon

For help, contact your development team or system administrator. 