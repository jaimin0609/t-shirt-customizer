/**
 * Utility functions for the profile page
 */

/**
 * Formats a full address from customer data
 * @param {Object} customer - Customer data object
 * @returns {string} - Formatted address string
 */
export const formatFullAddress = (customer) => {
  if (!customer) return 'No address on file';

  const parts = [
    customer.address,
    customer.city,
    customer.state,
    customer.zipCode,
    customer.country
  ].filter(Boolean);

  return parts.length ? parts.join(', ') : 'No address on file';
};

/**
 * Checks if profile data has changed from the original user data
 * @param {Object} formData - Form data
 * @param {Object} userData - User data
 * @returns {boolean} - Whether the data has changed
 */
export const hasProfileDataChanged = (formData, userData) => {
  if (!userData) return true;
  
  return (
    formData.name !== userData?.name ||
    formData.email !== userData?.email ||
    formData.phone !== userData?.customer?.phone ||
    formData.address !== userData?.customer?.address ||
    formData.city !== userData?.customer?.city ||
    formData.state !== userData?.customer?.state ||
    formData.zipCode !== userData?.customer?.zipCode ||
    formData.country !== userData?.customer?.country ||
    formData.isDefaultShippingAddress !== userData?.customer?.isDefaultShippingAddress
  );
};

/**
 * Creates a profile update data object from form data
 * @param {Object} formData - Form data
 * @returns {Object} - Profile update data
 */
export const createProfileUpdateData = (formData) => {
  return {
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    address: formData.address,
    city: formData.city,
    state: formData.state,
    zipCode: formData.zipCode,
    country: formData.country,
    isDefaultShippingAddress: formData.isDefaultShippingAddress
  };
};

/**
 * Creates a display data object from user data
 * @param {Object} userData - User data
 * @param {Object} formData - Form data
 * @returns {Object} - Display data
 */
export const createDisplayData = (userData, formData) => {
  return {
    ...userData,
    name: formData.name,
    email: formData.email,
    customer: {
      ...(userData?.customer || {}),
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      country: formData.country,
      isDefaultShippingAddress: formData.isDefaultShippingAddress
    }
  };
}; 