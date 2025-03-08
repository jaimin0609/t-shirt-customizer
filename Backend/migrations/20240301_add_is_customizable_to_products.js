import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('Products', 'isCustomizable', {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('Products', 'isCustomizable');
} 