const normalizeAdminEmail = (value) => String(value || '').trim().toLowerCase();

export const getConfiguredAdminEmails = (rawValue = '') => {
  if (!rawValue) return [];
  return rawValue
    .split(',')
    .map((item) => normalizeAdminEmail(item))
    .filter(Boolean);
};

export const getConfiguredAdminList = () => {
  const envValue = typeof import.meta !== 'undefined' && import.meta.env
    ? (import.meta.env.VITE_ADMIN_EMAILS || import.meta.env.VITE_ADMIN_EMAIL || '')
    : '';
  return getConfiguredAdminEmails(envValue);
};

export const isAdminEmail = (email, configuredValue = '') => {
  const normalizedEmail = normalizeAdminEmail(email);
  if (!normalizedEmail) return false;
  return getConfiguredAdminEmails(configuredValue).includes(normalizedEmail);
};
