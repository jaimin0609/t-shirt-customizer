import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const API_URL = 'http://localhost:5002/api';
const token = 'your_admin_token'; // Replace with a valid admin token

async function testOrderProcess() {
  try {
    console.log('Starting test order process...');
    
    // 1. Create a test product
    console.log('1. Creating test product...');
    const createProductResponse = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Test T-Shirt',
        description: 'A test product for order testing',
        price: 29.99,
        stock: 100,
        category: 'T-Shirts',
        status: 'active',
        images: ['/uploads/default-product.jpg'] // Default image
      })
    });
    
    if (!createProductResponse.ok) {
      const errorText = await createProductResponse.text();
      throw new Error(`Failed to create test product: ${createProductResponse.status} ${errorText}`);
    }
    
    const product = await createProductResponse.json();
    console.log('Created test product:', product);
    
    // 2. Add item to cart
    console.log('2. Adding item to cart...');
    const addItemResponse = await fetch(`${API_URL}/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        productId: product.id,
        quantity: 2,
        customization: {
          color: 'Blue',
          size: 'Large',
          design: 'Default'
        }
      })
    });
    
    if (!addItemResponse.ok) {
      const errorText = await addItemResponse.text();
      throw new Error(`Failed to add item to cart: ${addItemResponse.status} ${errorText}`);
    }
    
    const cartItem = await addItemResponse.json();
    console.log('Added item to cart:', cartItem);
    
    // 3. Check cart
    console.log('3. Checking cart...');
    const cartResponse = await fetch(`${API_URL}/cart`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!cartResponse.ok) {
      throw new Error('Failed to check cart');
    }
    
    const cart = await cartResponse.json();
    console.log('Cart details:', cart);
    
    // 4. Create order
    console.log('4. Creating order...');
    const orderData = {
      shippingAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'Test Country'
      },
      paymentMethod: 'credit_card',
      // Add these fields explicitly since they're required by the API
      total: cart.total || 59.98,
      subtotal: cart.total || 59.98,
      shipping: 5.00
    };
    
    const orderResponse = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });
    
    const orderResponseText = await orderResponse.text();
    console.log('Raw order response:', orderResponseText);
    
    if (!orderResponse.ok) {
      throw new Error(`Failed to create order: ${orderResponse.status} ${orderResponseText}`);
    }
    
    try {
      const orderResult = JSON.parse(orderResponseText);
      console.log('Created order successfully:', orderResult);
    } catch (e) {
      console.error('Failed to parse order response:', e);
    }
    
    console.log('Test order process completed successfully!');
  } catch (error) {
    console.error('Error in test order process:', error);
  }
}

testOrderProcess(); 