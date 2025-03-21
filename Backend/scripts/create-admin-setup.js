/**
 * Simple script to create an admin user bypassing setup
 * Use this if you're having trouble with the first-time setup
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/tshirt_customizer',
});

async function createAdminUser() {
  // Admin details
  const admin = {
    username: 'admin',
    name: 'Administrator',
    email: 'admin@example.com',
    role: 'admin',
    status: 'active'
  };
  
  // Generate password
  const salt = await bcrypt.genSalt(10);
  const password = 'Admin123!';
  admin.password = await bcrypt.hash(password, salt);
  
  try {
    // Delete existing admin users
    await pool.query('DELETE FROM "Users" WHERE role = $1', ['admin']);
    console.log('Removed existing admin users');
    
    // Insert admin user
    const insertQuery = `
      INSERT INTO "Users" (username, name, email, password, role, status, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING id
    `;
    
    const result = await pool.query(insertQuery, [
      admin.username,
      admin.name,
      admin.email,
      admin.password,
      admin.role,
      admin.status
    ]);
    
    console.log(`Created admin user with ID: ${result.rows[0].id}`);
    console.log('=================================');
    console.log('Admin Login Details:');
    console.log('Email: admin@example.com');
    console.log('Password: Admin123!');
    console.log('=================================');
    
    pool.end();
  } catch (error) {
    console.error('Error creating admin user:', error);
    pool.end();
  }
}

createAdminUser(); 