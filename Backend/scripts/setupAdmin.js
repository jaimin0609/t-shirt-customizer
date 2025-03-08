import { User } from '../models/index.js';
import bcrypt from 'bcryptjs';

(async () => {
    try {
        // Check if admin user exists
        let admin = await User.findOne({ where: { email: 'admin@example.com' } });
        
        if (!admin) {
            console.log('Admin user not found. Creating...');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            admin = await User.create({
                name: 'Admin User',
                email: 'admin@example.com',
                password: hashedPassword,
                role: 'admin',
                status: 'active',
                username: 'admin'
            });
            console.log('Admin user created successfully:', admin.username);
        } else {
            console.log('Admin user already exists:', admin.toJSON());
        }
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
})(); 