export async function up(queryInterface, Sequelize) {
  try {
    console.log('Adding gender and ageGroup columns to Products table...');
    
    // Add gender column
    await queryInterface.addColumn('Products', 'gender', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'unisex'
    });
    
    // Add ageGroup column
    await queryInterface.addColumn('Products', 'ageGroup', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'adult'
    });
    
    console.log('Successfully added gender and ageGroup columns to Products table');
    return Promise.resolve();
  } catch (error) {
    console.error('Migration failed:', error);
    return Promise.reject(error);
  }
}

export async function down(queryInterface, Sequelize) {
  try {
    // Remove the columns if we need to rollback
    await queryInterface.removeColumn('Products', 'gender');
    await queryInterface.removeColumn('Products', 'ageGroup');
    return Promise.resolve();
  } catch (error) {
    console.error('Rollback failed:', error);
    return Promise.reject(error);
  }
} 