const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if the column already exists to avoid errors
    const tableInfo = await queryInterface.describeTable('Products');
    
    if (!tableInfo.images) {
      return queryInterface.addColumn('Products', 'images', {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        comment: 'Array of image URLs for the product'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Products', 'images');
  }
}; 