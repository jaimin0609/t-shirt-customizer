import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get admin token (you'll need to replace this with a valid token)
const TOKEN = 'your_admin_jwt_token_here'; // Replace with your actual admin token

// Create a sample test product
async function createTestProduct() {
  try {
    console.log('Testing product creation API...');
    
    // Create form data
    const form = new FormData();
    form.append('name', 'Test Product');
    form.append('description', 'This is a test product to diagnose issues');
    form.append('price', '19.99');
    form.append('category', 'T-Shirts');
    form.append('gender', 'unisex');
    form.append('ageGroup', 'adult');
    form.append('stock', '100');
    form.append('status', 'active');
    form.append('featured', 'false');
    form.append('customizationOptions', JSON.stringify(['text', 'image']));
    form.append('tags', JSON.stringify(['test', 'debug']));
    
    // Add a test image
    const imagePath = path.join(__dirname, '..', 'public', 'uploads', 'test-image.jpg');
    if (fs.existsSync(imagePath)) {
      form.append('images', fs.createReadStream(imagePath));
      console.log('Added test image:', imagePath);
    } else {
      console.log('Test image not found at:', imagePath);
      // Create a placeholder if image not found
      const placeholderPath = path.join(__dirname, '..', 'public', 'uploads', 'placeholder.jpg');
      if (fs.existsSync(placeholderPath)) {
        form.append('images', fs.createReadStream(placeholderPath));
        console.log('Using placeholder image instead');
      } else {
        console.log('No placeholder image found either. Skipping image upload.');
      }
    }
    
    // Log what we're sending
    console.log('Submitting form data with fields:', Object.fromEntries(form.getBoundary ? form.getBoundary() : []));
    
    // Make the API request
    const API_URL = 'http://localhost:5002/api/products';
    console.log(`Making POST request to ${API_URL}`);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      body: form,
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    // Parse the response
    try {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
      
      if (response.ok) {
        console.log('✅ Product creation successful!');
      } else {
        console.log('❌ Product creation failed');
      }
    } catch (jsonError) {
      const text = await response.text();
      console.error('Failed to parse response as JSON:', jsonError);
      console.log('Raw response:', text);
    }
    
  } catch (error) {
    console.error('Error in test script:', error);
  }
}

// Run the test
createTestProduct(); 