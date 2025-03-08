import { Sequelize } from 'sequelize';
import 'dotenv/config';

// Determine which database dialect to use based on environment
const dialect = process.env.DB_DIALECT || 'mysql';

// Configure connection based on environment
let sequelizeConfig;

if (process.env.DATABASE_URL) {
    // For deployment platforms that provide a DATABASE_URL (like Render, Railway)
    sequelizeConfig = {
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false // For Heroku/render-like platforms
            }
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    };
    
    // Use the DATABASE_URL directly
    const sequelize = new Sequelize(process.env.DATABASE_URL, sequelizeConfig);
    
    // Test the connection
    (async () => {
        try {
            await sequelize.authenticate();
            console.log('Database connection has been established successfully.');
        } catch (error) {
            console.error('Unable to connect to the database:', error);
            process.exit(1);
        }
    })();
    
    export default sequelize;
} else {
    // For local development using specific connection details
    sequelizeConfig = {
        host: process.env.DB_HOST,
        dialect: dialect,
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    };
    
    const sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD,
        sequelizeConfig
    );
    
    // Test the connection
    (async () => {
        try {
            await sequelize.authenticate();
            console.log('Database connection has been established successfully.');
        } catch (error) {
            console.error('Unable to connect to the database:', error);
            process.exit(1);
        }
    })();
    
    export default sequelize;
} 