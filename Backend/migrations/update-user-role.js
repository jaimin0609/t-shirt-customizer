import { Sequelize } from 'sequelize';

export async function up(queryInterface, Sequelize) {
  await queryInterface.sequelize.query(
    `ALTER TABLE Users MODIFY COLUMN role ENUM('admin', 'user', 'customer') DEFAULT 'user'`
  );
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.sequelize.query(
    `ALTER TABLE Users MODIFY COLUMN role ENUM('admin', 'user') DEFAULT 'user'`
  );
} 