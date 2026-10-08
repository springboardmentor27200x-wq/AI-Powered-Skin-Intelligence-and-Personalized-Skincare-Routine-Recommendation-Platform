/**
 * Format product prices cleanly in Indian Rupees (INR - ₹) or other currencies.
 *
 * @param {number|null|undefined} price - Numerical price
 * @param {string} [currency='INR'] - Currency code ('INR', 'USD', etc.)
 * @returns {string} Formatted price string (e.g. "₹1,499")
 */
export const formatPrice = (price, currency = 'INR') => {
  if (price === null || price === undefined || isNaN(Number(price))) {
    return '—';
  }

  const numPrice = Number(price);
  const curr = (currency || 'INR').toUpperCase();

  if (curr === 'INR' || curr === '₹' || curr === 'RS') {
    return `₹${Math.round(numPrice).toLocaleString('en-IN')}`;
  }

  if (curr === 'USD' || curr === '$') {
    return `$${numPrice.toFixed(2)}`;
  }

  return `${currency} ${numPrice.toLocaleString()}`;
};
