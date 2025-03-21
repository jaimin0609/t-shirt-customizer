-- SQL script to delete all admin users
DELETE FROM "Users" WHERE role = 'admin';

-- Confirmation
SELECT 'All admin users have been deleted. You can now access the admin panel to complete the first-time setup.' as message; 