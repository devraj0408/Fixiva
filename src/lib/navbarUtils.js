export const normalizeNavbarUser = (user = null) => {
  const safeUser = user && typeof user === 'object' ? user : {};

  return {
    id: safeUser.id ?? null,
    name: safeUser.name || '',
    role: safeUser.role || 'guest',
    email: safeUser.email || '',
  };
};

export const getDashboardPath = (user = null) => {
  const normalizedUser = normalizeNavbarUser(user);
  const role = String(normalizedUser.role || '').trim().toLowerCase();

  if (!role || role === 'guest') {
    return '/login';
  }
  if (role === 'admin') {
    return '/fixiva-admin/dashboard';
  }
  if (role === 'worker') {
    return '/worker-dashboard';
  }
  if (role === 'contractor') {
    return '/contractor-dashboard';
  }
  return `/dashboard/${role}`;
};
