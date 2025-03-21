import React from 'react';
import AddressAutocomplete from '../Common/AddressAutocomplete';

/**
 * Form for managing shipping address information
 */
const ShippingAddressForm = ({ register, errors, setValue, user }) => {
    return (
        <div className="border-t pt-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>

            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                    Phone Number
                </label>
                <input
                    {...register('phone')}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    type="tel"
                />
                {errors.phone && (
                    <p className="text-red-500 text-xs italic">{errors.phone.message}</p>
                )}
            </div>

            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                    Address
                </label>
                <AddressAutocomplete
                    defaultValue={user?.customer?.address || ''}
                    placeholder="Enter your address"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    onPlaceSelected={(place) => {
                        // Update form values with selected address data
                        setValue('address', place.address || place.formattedAddress);
                        setValue('city', place.city);
                        setValue('state', place.state);
                        setValue('zipCode', place.zipCode);
                        setValue('country', place.country);
                    }}
                    error={!!errors.address}
                />
                {/* Hidden input to register the address field with React Hook Form */}
                <input type="hidden" {...register('address')} />
                {errors.address && (
                    <p className="text-red-500 text-xs italic">{errors.address.message}</p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        City
                    </label>
                    <input
                        {...register('city')}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        type="text"
                    />
                    {errors.city && (
                        <p className="text-red-500 text-xs italic">{errors.city.message}</p>
                    )}
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        State/Province
                    </label>
                    <input
                        {...register('state')}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        type="text"
                    />
                    {errors.state && (
                        <p className="text-red-500 text-xs italic">{errors.state.message}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Zip/Postal Code
                    </label>
                    <input
                        {...register('zipCode')}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        type="text"
                    />
                    {errors.zipCode && (
                        <p className="text-red-500 text-xs italic">{errors.zipCode.message}</p>
                    )}
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Country
                    </label>
                    <input
                        {...register('country')}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        type="text"
                    />
                    {errors.country && (
                        <p className="text-red-500 text-xs italic">{errors.country.message}</p>
                    )}
                </div>
            </div>

            <div className="mb-4">
                <label className="flex items-center">
                    <input
                        type="checkbox"
                        {...register('isDefaultShippingAddress')}
                        className="mr-2"
                    />
                    <span className="text-gray-700">Use as default shipping address</span>
                </label>
            </div>
        </div>
    );
};

export default ShippingAddressForm; 