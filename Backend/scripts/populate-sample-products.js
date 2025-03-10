import 'dotenv/config';
import { Sequelize, DataTypes } from 'sequelize';

// Initialize Sequelize with the database configuration
let sequelize;
if (process.env.DATABASE_URL) {
    console.log('Using DATABASE_URL for connection');
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: console.log,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    });
} else {
    console.log('Using individual connection parameters');
    sequelize = new Sequelize(
        process.env.DB_NAME || 'tshirt_customizer',
        process.env.DB_USER || 'root',
        process.env.DB_PASSWORD || '6941@Sjp',
        {
            host: process.env.DB_HOST || 'localhost',
            dialect: process.env.DB_DIALECT || 'mysql',
            logging: console.log
        }
    );
}

// Define a simple Product model for this script
const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    images: {
        type: DataTypes.JSON,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'active'
    }
}, {
    tableName: 'Products',
    timestamps: true
});

// Sample product data
const sampleProducts = [
    {
        name: 'Basic White T-Shirt',
        description: 'A comfortable basic white t-shirt made from 100% cotton',
        price: 19.99,
        category: 'tshirts',
        stock: 100,
        image: '/uploads/products/white-tshirt.jpg',
        images: ['/uploads/products/white-tshirt.jpg'],
        status: 'active'
    },
    {
        name: 'Black Hoodie',
        description: 'A warm black hoodie perfect for cooler weather',
        price: 39.99,
        category: 'hoodies',
        stock: 75,
        image: '/uploads/products/black-hoodie.jpg',
        images: ['/uploads/products/black-hoodie.jpg'],
        status: 'active'
    },
    {
        name: 'Striped Polo Shirt',
        description: 'A classic striped polo shirt for a casual yet refined look',
        price: 29.99,
        category: 'polo',
        stock: 50,
        image: '/uploads/products/striped-polo.jpg',
        images: ['/uploads/products/striped-polo.jpg'],
        status: 'active'
    },
    {
        name: 'Customizable V-Neck',
        description: 'A v-neck t-shirt you can fully customize with your own designs',
        price: 24.99,
        category: 'tshirts',
        stock: 120,
        image: '/uploads/products/vneck.jpg',
        images: ['/uploads/products/vneck.jpg'],
        status: 'active',
        isCustomizable: true
    },
    {
        name: 'Graphic Print T-Shirt',
        description: 'T-shirt with a unique graphic print design',
        price: 22.99,
        category: 'tshirts',
        stock: 80,
        image: '/uploads/products/graphic-tshirt.jpg',
        images: ['/uploads/products/graphic-tshirt.jpg'],
        status: 'active'
    }
];

// Function to add sample products to the database
export const populateSampleProducts = async () => {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
        
        // Count existing products
        const [existingCount] = await sequelize.query('SELECT COUNT(*) as count FROM "Products"');
        console.log(`Current product count: ${existingCount[0].count}`);
        
        if (existingCount[0].count === 0) {
            console.log('Adding sample products...');
            
            // Create the sample products
            for (const productData of sampleProducts) {
                await Product.create(productData);
                console.log(`Created product: ${productData.name}`);
            }
            
            console.log('Sample products added successfully!');
        } else {
            console.log('Database already has products. Skipping sample data creation.');
        }
        
    } catch (error) {
        console.error('Error populating sample products:', error);
    } finally {
        await sequelize.close();
    }
};

// Run the function if script is called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    populateSampleProducts();
} 