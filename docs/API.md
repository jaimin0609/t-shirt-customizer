# API Documentation

This document provides information about the T-Shirt Customizer API endpoints, request/response formats, and authentication requirements.

## Base URL

Production: `https://t-shirt-customizer-backend.onrender.com/api`
Development: `http://localhost:5002/api`

## Authentication

Most endpoints require authentication using a JSON Web Token (JWT).

Include the token in the Authorization header:
```
Authorization: Bearer <your_token>
```

To obtain a token, use the login endpoint.

## Error Handling

All API errors follow this format:
```json
{
  "success": false,
  "message": "Error message describing what went wrong",
  "error": "ERROR_CODE"
}
```

Common error codes:
- `UNAUTHORIZED` - Authentication is required or has failed
- `VALIDATION_ERROR` - Request data failed validation
- `NOT_FOUND` - Requested resource was not found
- `SERVER_ERROR` - An unexpected server error occurred

## Endpoints

### Authentication

#### POST /api/auth/register
Create a new user account.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "token": "jwt_token"
  }
}
```

#### POST /api/auth/login
Log in an existing user.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "token": "jwt_token"
  }
}
```

### Products

#### GET /api/products
Get a list of products.

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 20)
- `category` (optional): Filter by category ID
- `search` (optional): Search term for product name/description

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "product_id",
        "name": "Basic T-Shirt",
        "description": "Comfortable cotton t-shirt",
        "price": 19.99,
        "imageUrl": "https://example.com/image.jpg",
        "category": "category_id"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100
    }
  }
}
```

#### GET /api/products/:id
Get a single product by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "product_id",
    "name": "Basic T-Shirt",
    "description": "Comfortable cotton t-shirt",
    "price": 19.99,
    "imageUrl": "https://example.com/image.jpg",
    "category": "category_id",
    "options": [
      {
        "name": "Size",
        "values": ["S", "M", "L", "XL"]
      },
      {
        "name": "Color",
        "values": ["Red", "Blue", "Black"]
      }
    ]
  }
}
```

### Orders

#### POST /api/orders
Create a new order.

**Request:**
```json
{
  "items": [
    {
      "productId": "product_id",
      "quantity": 2,
      "options": {
        "Size": "M",
        "Color": "Blue"
      },
      "customization": {
        "text": "Custom Text",
        "imageUrl": "https://example.com/custom-image.jpg"
      }
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "zipCode": "12345",
    "country": "USA"
  },
  "paymentMethodId": "payment_method_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderId": "order_id",
    "status": "processing",
    "total": 39.98,
    "createdAt": "2023-03-15T12:00:00Z"
  }
}
```

#### GET /api/orders
Get orders for the authenticated user.

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)
- `status` (optional): Filter by order status

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "order_id",
        "status": "processing",
        "total": 39.98,
        "createdAt": "2023-03-15T12:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 15
    }
  }
}
```

#### GET /api/orders/:id
Get a single order by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order_id",
    "status": "processing",
    "total": 39.98,
    "createdAt": "2023-03-15T12:00:00Z",
    "items": [
      {
        "productId": "product_id",
        "productName": "Basic T-Shirt",
        "quantity": 2,
        "price": 19.99,
        "options": {
          "Size": "M",
          "Color": "Blue"
        },
        "customization": {
          "text": "Custom Text",
          "imageUrl": "https://example.com/custom-image.jpg"
        }
      }
    ],
    "shippingAddress": {
      "street": "123 Main St",
      "city": "Anytown",
      "state": "CA",
      "zipCode": "12345",
      "country": "USA"
    },
    "shippingMethod": "standard",
    "paymentMethod": "credit_card"
  }
}
```

## Customization API

#### POST /api/customization/upload
Upload a custom image for product customization.

**Request:**
- Content-Type: multipart/form-data
- Form field: `image` (file)

**Response:**
```json
{
  "success": true,
  "data": {
    "imageUrl": "https://example.com/uploads/image.jpg"
  }
}
```

## Status Codes

The API uses standard HTTP status codes:

- 200 OK - The request was successful
- 201 Created - A resource was successfully created
- 400 Bad Request - The request was malformed or invalid
- 401 Unauthorized - Authentication is required
- 403 Forbidden - The authenticated user doesn't have permission
- 404 Not Found - The requested resource was not found
- 500 Internal Server Error - Something went wrong on the server

## Rate Limiting

API requests are rate-limited to 100 requests per minute per IP address. When the limit is exceeded, you'll receive a 429 Too Many Requests response.

## Need Help?

For additional assistance, contact the API team at api-support@tshirtcustomizer.com or open an issue on the GitHub repository. 