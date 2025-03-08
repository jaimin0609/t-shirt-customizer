'use strict';

export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Products', [
      {
        name: 'Classic T-Shirt',
        description: 'A comfortable cotton t-shirt',
        price: 29.99,
        category: 't-shirts',
        stock: 100,
        image: '/uploads/products/classic-tshirt.jpg',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Premium T-Shirt',
        description: 'A high-quality premium t-shirt',
        price: 39.99,
        category: 't-shirts',
        stock: 50,
        image: '/uploads/products/premium-tshirt.jpg',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Graphic T-Shirt',
        description: 'A t-shirt with a cool graphic design',
        price: 34.99,
        category: 't-shirts',
        stock: 75,
        image: '/uploads/products/graphic-tshirt.jpg',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Products', null, {});
  }
}; 