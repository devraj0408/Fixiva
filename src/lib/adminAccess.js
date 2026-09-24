export const isAdminEmail = (email) => {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) return false;
  return (
    normalized === 'fixiva869@gmail.com' ||
    normalized.startsWith('admin') ||
    normalized.includes('admin@') ||
    normalized.endsWith('@fixiva.com')
  );
};

export const isAdminRole = (role, email = '') => {
  const normalizedRole = String(role || '').trim().toLowerCase();
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (
    normalizedRole === 'admin' ||
    normalizedRole === 'superadmin' ||
    normalizedRole === 'super_admin' ||
    normalizedRole === 'administrator' ||
    normalizedRole === 'ops_admin' ||
    normalizedRole === 'owner'
  ) {
    return true;
  }

  if (normalizedEmail) {
    return isAdminEmail(normalizedEmail);
  }

  return false;
};

export const isSuperAdminRole = (role, email = '') => {
  return isAdminRole(role, email);
};


