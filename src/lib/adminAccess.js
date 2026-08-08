export const isAdminRole = (role) => {
  const normalized = String(role || '').trim().toLowerCase();
  return normalized === 'admin';
};

export const isSuperAdminRole = (role) => {
  const normalized = String(role || '').trim().toLowerCase();
  return normalized === 'admin';
};
