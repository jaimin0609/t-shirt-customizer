'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add hasVariants column to Products table
    await queryInterface.addColumn('Products', 'hasVariants', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this product has color/size variants'
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove hasVariants column from Products table
    await queryInterface.removeColumn('Products', 'hasVariants');
  }
};
