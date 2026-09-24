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

export const getAdminDashboardRoute = () => '/dashboard/admin';

export const getAdminEntryRoute = () => '/login';

