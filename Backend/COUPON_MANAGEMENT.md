# Coupon Management System

## Overview
The e-commerce application now uses a coupon-based discount system instead of the previous promotion system. This allows for more flexible discounting options, including:

- Percentage-based discounts
- Fixed amount discounts
- Usage limits per coupon
- Public coupons that appear in the promotion banner
- Minimum purchase requirements

## Managing Coupons

### Command Line Tool
To manage coupons using the command line tool:

```bash
# From the Backend directory
npm run coupon-manager
```

This interactive tool provides the following functionality:
- View all coupons
- Create new coupons with custom discounts
- Update existing coupons
- Delete coupons
- Generate bulk coupons (up to 100 at once)
- View coupon usage statistics
- Deactivate expired coupons

### API Endpoints
The following REST API endpoints are available for coupon management:

#### Admin Endpoints (Requires Authentication)
- `POST /api/coupons/generate` - Generate a new coupon
- `POST /api/coupons/bulk-generate` - Generate multiple coupons
- `GET /api/coupons/admin` - Get all coupons
- `PUT /api/coupons/:id` - Update a coupon
- `DELETE /api/coupons/:id` - Delete a coupon
- `GET /api/coupons/stats` - Get coupon usage statistics
- `POST /api/coupons/deactivate-expired` - Deactivate all expired coupons
- `PATCH /api/coupons/:id/toggle-public` - Toggle a coupon's public status

#### Public Endpoints
- `GET /api/coupons/public` - Get public coupons for promotional banner
- `POST /api/coupons/validate` - Validate a coupon code

## Frontend Implementation

### Coupon Application in Cart
Customers can apply coupon codes in their shopping cart. The system will:
1. Validate the coupon against the backend
2. Check if the coupon is active, not expired, and within usage limits
3. Verify any minimum purchase requirements
4. Apply the discount to the cart total

### Promotion Banner
Public coupons are displayed in a rotating promotion banner at the top of the site. The banner includes:
- Coupon code
- Discount information
- A "copy code" button for easy application
- Visual indicators for multiple coupons

## Coupon Model

The Coupon model includes the following fields:

| Field | Type | Description |
|-------|------|-------------|
| code | String | Unique coupon code |
| description | Text | Description of the coupon |
| discountType | Enum | 'percentage' or 'fixed_amount' |
| discountValue | Decimal | Amount or percentage of discount |
| startDate | Date | When the coupon becomes active |
| endDate | Date | When the coupon expires |
| isActive | Boolean | Whether the coupon is active |
| usageLimit | Integer | Maximum number of times the coupon can be used (null for unlimited) |
| usageCount | Integer | Number of times the coupon has been used |
| minimumPurchase | Decimal | Minimum cart total required (null for no minimum) |
| isPublic | Boolean | Whether to display in the promotion banner |
| bannerText | String | Custom text for the promotion banner |
| bannerColor | String | Background color for the promotion banner |

## Technical Notes

- Coupon codes are automatically generated but can include a custom prefix
- Public coupons rotate in the promotional banner every 5 seconds
- Coupons can be limited to single-use or have a specific usage limit
- Banner text and colors are customizable for each public coupon 