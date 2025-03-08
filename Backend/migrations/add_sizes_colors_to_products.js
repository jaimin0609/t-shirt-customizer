'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Products', 'availableSizes', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: ["S", "M", "L", "XL"]
    });

    await queryInterface.addColumn('Products', 'availableColors', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: ["black", "white", "gray"]
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Products', 'availableSizes');
    await queryInterface.removeColumn('Products', 'availableColors');
  }
}; 