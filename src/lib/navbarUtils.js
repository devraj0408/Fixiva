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
  return normalizedUser.role && normalizedUser.role !== 'guest'
    ? `/dashboard/${normalizedUser.role}`
    : '/login';
};
