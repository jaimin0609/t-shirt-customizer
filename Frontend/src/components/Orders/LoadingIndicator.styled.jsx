import React from 'react';
import { withStyles } from '../../styles/withStyles';

/**
 * Styled component for displaying a loading indicator
 */
const LoadingIndicatorBase = ({ message, styles }) => {
  return (
    <div className={styles.container}>
      <div className={styles.spinner}></div>
      <p className={styles.message}>{message || 'Loading orders...'}</p>
    </div>
  );
};

export default withStyles(LoadingIndicatorBase, (theme) => ({
  container: `
    flex 
    flex-col 
    items-center 
    justify-center 
    py-12
  `,
  spinner: `
    animate-spin 
    rounded-full 
    h-12 
    w-12 
    border-t-2 
    border-b-2 
    border-blue-500 
    mb-4
  `,
  message: `
    text-gray-600
  `
})); 