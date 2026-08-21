/**
 * Domain and URL utilities for multi-domain support
 */

/**
 * Get the current hostname
 */
export const getCurrentHostname = () => {
  if (typeof window === 'undefined') return '';
  return window.location.hostname;
};

/**
 * Check if running on admin subdomain
 */
export const isAdminSubdomain = () => {
  const hostname = getCurrentHostname();
  // Match admin.fixiva.co.in or admin.localhost or admin.127.0.0.1
  return hostname.startsWith('admin.');
};

/**
 * Get the customer domain URL
 */
export const getCustomerDomainUrl = () => {
  if (typeof window === 'undefined') return 'https://fixiva.co.in';
  
  const { protocol, hostname } = window.location;
  
  // If already on customer domain, return current
  if (!hostname.startsWith('admin.')) {
    return `${protocol}//${hostname}`;
  }
  
  // If on admin subdomain, strip "admin." prefix
  const customerHostname = hostname.replace(/^admin\./, '');
  return `${protocol}//${customerHostname}`;
};

/**
 * Get the admin domain URL
 */
export const getAdminDomainUrl = () => {
  if (typeof window === 'undefined') return 'https://admin.fixiva.co.in';
  
  const { protocol, hostname } = window.location;
  
  // If already on admin subdomain, return current
  if (hostname.startsWith('admin.')) {
    return `${protocol}//${hostname}`;
  }
  
  // If on customer domain, add "admin." prefix
  return `${protocol}//admin.${hostname}`;
};

/**
 * Determine which dashboard route to use based on domain
 */
export const getAdminDashboardPath = () => {
  // On admin subdomain, admin content is at root
  if (isAdminSubdomain()) {
    return '/';
  }
  
  // On main domain, still use old path for backward compatibility
  // (will be deprecated after full migration)
  return '/fixiva-admin/dashboard';
};

/**
 * Determine which entry route to use based on domain
 */
export const getAdminEntryPath = () => {
  // On admin subdomain, login is at /login (same as main app)
  if (isAdminSubdomain()) {
    return '/login';
  }
  
  // On main domain, use old path
  return '/fixiva-admin';
};

/**
 * Build full URL for a path on a specific domain
 */
export const buildUrl = (path, domain = 'customer') => {
  if (domain === 'admin') {
    return `${getAdminDomainUrl()}${path}`;
  }
  return `${getCustomerDomainUrl()}${path}`;
};

/**
 * Parse subdomain from hostname
 */
export const getSubdomain = () => {
  const hostname = getCurrentHostname();
  const parts = hostname.split('.');
  
  // admin.fixiva.co.in -> 'admin'
  // fixiva.co.in -> ''
  // localhost -> ''
  // admin.localhost -> 'admin'
  if (parts.length > 2 && parts[0] !== 'www') {
    return parts[0];
  }
  return '';
};

/**
 * Check if current environment is development
 */
export const isDevelopment = () => {
  return !import.meta.env.PROD || import.meta.env.DEV;
};

/**
 * Get base URL for API calls considering domain context
 */
export const getApiBaseUrl = () => {
  // Supabase doesn't care about domain, so just return the public URL
  return typeof import.meta !== 'undefined' && import.meta.env
    ? (import.meta.env.VITE_SUPABASE_URL || '')
    : '';
};
