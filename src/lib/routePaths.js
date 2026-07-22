import { isAdminSubdomain } from './domainUtils.js';

const normalizeBaseUrl = (baseUrl = '/') => {
  const value = String(baseUrl || '/').trim();
  if (!value || value === '/') return '/';
  return value.replace(/\/+$/, '');
};

export const getRouterBasename = () => {
  const base = typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.BASE_URL || '/'
    : '/';
  return normalizeBaseUrl(base);
};

/**
 * Get admin dashboard route
 * - On admin subdomain: /dashboard/admin (shows admin panel content)
 * - On main domain: /fixiva-admin/dashboard (backward compatible)
 */
export const getAdminDashboardRoute = () => {
  if (isAdminSubdomain()) {
    return '/dashboard/admin';
  }
  return '/fixiva-admin/dashboard';
};

/**
 * Get admin entry route
 * - On admin subdomain: /login (redirects to login, then to dashboard)
 * - On main domain: /fixiva-admin (backward compatible)
 */
export const getAdminEntryRoute = () => {
  if (isAdminSubdomain()) {
    return '/login';
  }
  return '/fixiva-admin';
};
