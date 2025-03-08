import sequelize from '../config/database.js';

async function checkDatabase() {
    try {
        // Test connection
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');

        // Get all tables
        const [tables] = await sequelize.query('SHOW TABLES');
        console.log('\nTables in database:', tables);

        // For each table, show its structure
        for (const tableObj of tables) {
            const tableName = tableObj[Object.keys(tableObj)[0]];
            const [structure] = await sequelize.query(`DESCRIBE ${tableName}`);
            console.log(`\nStructure of table '${tableName}':`);
            console.table(structure);
        }

        // Show number of records in Users table
        const [userCount] = await sequelize.query('SELECT COUNT(*) as count FROM Users');
        console.log('\nNumber of records in Users table:', userCount[0].count);

        // Show all users
        const [users] = await sequelize.query('SELECT id, username, email, role, status FROM Users');
        console.log('\nAll users in database:');
        console.table(users);

    } catch (error) {
        console.error('Error checking database:', error);
    } finally {
        await sequelize.close();
    }
}

checkDatabase(); 