import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
  // Step 1: Update the role field to be a STRING instead of ENUM
  await queryInterface.changeColumn('Users', 'role', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'user'
  });

  // Step 2: Add the permissions field
  await queryInterface.addColumn('Users', 'permissions', {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  });
}

export async function down(queryInterface, Sequelize) {
  // Remove the permissions field
  await queryInterface.removeColumn('Users', 'permissions');
  
  // Change back to ENUM (note: this could lose data if new roles were added)
  await queryInterface.changeColumn('Users', 'role', {
    type: DataTypes.ENUM('admin', 'user', 'customer'),
    defaultValue: 'user'
  });
}

export default { up, down }; 