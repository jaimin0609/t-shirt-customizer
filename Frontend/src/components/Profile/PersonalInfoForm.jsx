import React from 'react';

/**
 * Form for updating basic personal information
 */
const PersonalInfoForm = ({ register, errors }) => {
    return (
        <div className="space-y-6">
            <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                    Name
                </label>
                <input
                    {...register('name')}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    type="text"
                />
                {errors.name && (
                    <p className="text-red-500 text-xs italic">{errors.name.message}</p>
                )}
            </div>

            <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                    Email
                </label>
                <input
                    {...register('email')}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    type="email"
                />
                {errors.email && (
                    <p className="text-red-500 text-xs italic">{errors.email.message}</p>
                )}
            </div>
        </div>
    );
};

export default PersonalInfoForm; 