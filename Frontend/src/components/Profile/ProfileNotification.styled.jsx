import React from 'react';
import withStyles from '../../styles/withStyles.jsx';
import styleSystem from '../../styles/styleSystem';

const ProfileNotificationBase = ({ successMessage, errorMessage, styles }) => {
    if (!successMessage && !errorMessage) return null;

    return (
        <>
            {successMessage && (
                <div className={styles.successContainer}>
                    {successMessage}
                </div>
            )}

            {errorMessage && (
                <div className={styles.errorContainer}>
                    {errorMessage}
                </div>
            )}
        </>
    );
};

export default withStyles(ProfileNotificationBase, (theme) => ({
    successContainer: `
    bg-green-100 
    border 
    border-green-400 
    text-green-700 
    px-4 
    py-3 
    rounded 
    mb-4
  `,
    errorContainer: `
    bg-red-100 
    border 
    border-red-400 
    text-red-700 
    px-4 
    py-3 
    rounded 
    mb-4
  `,
})); 