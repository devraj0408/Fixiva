/**
 * FIXIVA Canonical Business Configuration
 * Single Source of Truth for System-wide Business Rules & Tariffs
 */

export const BUSINESS_CONFIG = {
  // Canonical Platform Fee for Fixiva Service Marketplace
  PLATFORM_FEE: 0,

  // Default Tax / GST Rate (0% for cash on site)
  TAX_RATE: 0,

  // Currency Code & Symbol
  CURRENCY_SYMBOL: '₹',
  CURRENCY_CODE: 'INR',
};

export const getCanonicalPlatformFee = () => BUSINESS_CONFIG.PLATFORM_FEE;
