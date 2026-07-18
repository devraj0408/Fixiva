const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const normalizeConfiguredAdminEmails = (configuredValue = '') =>
  String(configuredValue || '')
    .split(',')
    .map((item) => normalizeEmail(item))
    .filter(Boolean);

export const isLocalDevelopmentHost = (hostname = '') => {
  const normalizedHost = String(hostname || '').trim().toLowerCase();
  return normalizedHost === 'localhost' || normalizedHost === '127.0.0.1' || normalizedHost === '::1' || normalizedHost === '';
};

export const shouldAllowDevAdminBypass = ({ identifier = '', hostname = '', isDevMode = false, configuredValue = '' }) => {
  if (!isDevMode) return false;
  if (!isLocalDevelopmentHost(hostname)) return false;

  const normalizedIdentifier = normalizeEmail(identifier);
  if (!normalizedIdentifier.includes('@')) return false;

  const configuredAdmins = normalizeConfiguredAdminEmails(configuredValue);
  return configuredAdmins.includes(normalizedIdentifier);
};
