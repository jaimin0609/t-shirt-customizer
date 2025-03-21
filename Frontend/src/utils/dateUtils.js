/**
 * Formats a date string or timestamp into a human-readable format
 * @param {string|number} dateInput - Date string, ISO string or timestamp
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (dateInput, options = {}) => {
  if (!dateInput) return 'N/A';
  
  const date = new Date(dateInput);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return 'Invalid date';
  
  // Default options
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  return new Intl.DateTimeFormat('en-US', defaultOptions).format(date);
}; 