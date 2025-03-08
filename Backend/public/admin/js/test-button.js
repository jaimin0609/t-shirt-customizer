// Add TEST ORDER button to admin page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Adding test order button to page');
    const button = document.createElement('button');
    button.textContent = 'TEST ORDER';
    button.className = 'btn btn-warning position-fixed';
    button.style.right = '10px';
    button.style.bottom = '10px';
    button.style.zIndex = '9999';
    
    button.addEventListener('click', async function() {
        console.log('Test order button clicked');
        const token = localStorage.getItem('token');
        
        if (!token) {
            alert('Authentication required');
            return;
        }
        
        try {
            // First get a product to use in the order
            console.log('Fetching a product for test order');
            const productResponse = await fetch('/api/products?limit=1', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!productResponse.ok) {
                throw new Error('Failed to fetch product');
            }
            
            const productData = await productResponse.json();
            console.log('Product data received:', productData);
            
            if (!productData || !productData.length) {
                alert('No products found to create test order');
                return;
            }
            
            const product = productData[0];
            
            // Create order data with items
            const orderData = {
                shippingAddress: {
                    street: '123 Test Street',
                    city: 'Test City',
                    state: 'Test State',
                    zipCode: '12345',
                    country: 'Test Country'
                },
                paymentMethod: 'Test Payment',
                total: 129.99,
                subtotal: 99.99,
                shipping: 30.00,
                items: [
                    {
                        productId: product.id,
                        quantity: 1,
                        price: product.price,
                        customization: {
                            color: 'Blue',
                            size: 'M',
                            design: 'Test Design'
                        }
                    }
                ]
            };
            
            console.log('Creating test order with data:', orderData);
            
            // Create the order
            const orderResponse = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderData)
            });
            
            if (!orderResponse.ok) {
                const errorText = await orderResponse.text();
                throw new Error(`Failed to create order: ${orderResponse.status} - ${errorText}`);
            }
            
            const orderResult = await orderResponse.json();
            console.log('Order created successfully:', orderResult);
            
            // Now check if the order appears in the admin list
            await verifyOrderWasCreated(orderResult.id, token);
            
            // Show success message
            alert(`Order #${orderResult.orderNumber} created successfully!`);
            
            // Reload the page after 1 second to refresh the orders list
            setTimeout(() => {
                console.log('Reloading page to show new order');
                window.location.reload();
            }, 1000);
        } catch (error) {
            console.error('Error creating test order:', error);
            alert(`Error creating test order: ${error.message}`);
        }
    });
    
    document.body.appendChild(button);
    console.log('Test order button added to document body');
});

// Helper function to verify the order was created
async function verifyOrderWasCreated(orderId, token) {
    console.log(`Verifying order ${orderId} was created`);
    try {
        // Fetch all orders
        const response = await fetch('/api/orders/admin/all', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache, no-store'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch orders for verification');
        }
        
        const orders = await response.json();
        console.log('Fetched orders for verification:', orders);
        
        // Check if our new order is in the list
        const orderFound = orders.some(order => order.id === orderId);
        
        if (orderFound) {
            console.log('✅ Order found in the database!');
        } else {
            console.warn('⚠️ Order not found in the database. Possible filtering issue.');
        }
        
        return orderFound;
    } catch (error) {
        console.error('Error verifying order creation:', error);
        return false;
    }
} 