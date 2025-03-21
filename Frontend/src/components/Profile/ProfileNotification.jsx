import React from 'react';

/**
 * Displays success and error notifications in the profile page
 */
const ProfileNotification = ({ successMessage, errorMessage }) => {
    if (!successMessage && !errorMessage) return null;

    return (
        <>
            {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    {successMessage}
                </div>
            )}

            {errorMessage && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {errorMessage}
                </div>
            )}
        </>
    );
};

export default ProfileNotification; 