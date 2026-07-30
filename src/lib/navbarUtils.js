export const normalizeNavbarUser = (user = null) => {
  const safeUser = user && typeof user === 'object' ? user : {};

  return {
    id: safeUser.id ?? null,
    name: safeUser.company || safeUser.name || '',
    role: safeUser.role || 'guest',
    email: safeUser.email || '',
    profile_photo_url: safeUser.profile_photo_url || safeUser.avatarUrl || null,
  };
};

export const getDashboardPath = (user = null) => {
  const normalizedUser = normalizeNavbarUser(user);
  const role = String(normalizedUser.role || '').trim().toLowerCase();

  if (!role || role === 'guest') {
    return '/login';
  }
  if (role === 'admin') {
    return '/dashboard/admin';
  }
  if (role === 'worker') {
    return '/worker-dashboard';
  }
  if (role === 'contractor') {
    return '/contractor-dashboard';
  }
  return '/dashboard/customer';
};

