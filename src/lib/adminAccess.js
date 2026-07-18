const normalizeAdminEmail = (value) => String(value || '').trim().toLowerCase();

export const getConfiguredAdminEmails = (rawValue = '') => {
  if (!rawValue) return [];
  return rawValue
    .split(',')
    .map((item) => normalizeAdminEmail(item))
    .filter(Boolean);
};

export const isAdminEmail = (email, configuredValue = '') => {
  const normalizedEmail = normalizeAdminEmail(email);
  if (!normalizedEmail) return false;
  return getConfiguredAdminEmails(configuredValue).includes(normalizedEmail);
};
