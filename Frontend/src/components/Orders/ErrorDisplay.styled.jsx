import React from 'react';
import withStyles from '../../styles/withStyles';

/**
 * Styled component for displaying error messages
 */
const ErrorDisplayBase = ({ error, onRetry, styles }) => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.icon}>
          <span role="img" aria-label="Error">⚠️</span>
        </div>
        <h2 className={styles.title}>Error Loading Orders</h2>
        <p className={styles.message}>
          {typeof error === 'string' ? error : 'There was a problem loading your orders. Please try again.'}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className={styles.button}
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default withStyles(ErrorDisplayBase, (theme) => ({
  container: `
    flex 
    flex-col 
    items-center 
    justify-center 
    py-12
  `,
  content: `
    text-center 
    max-w-md
  `,
  icon: `
    text-red-500 
    text-5xl 
    mb-4
  `,
  title: `
    text-xl 
    font-semibold 
    mb-2
  `,
  message: `
    text-gray-600 
    mb-6
  `,
  button: `
    inline-block 
    bg-blue-600 
    text-white 
    px-6 
    py-2 
    rounded-md 
    hover:bg-blue-700 
    transition-colors
  `
})); 