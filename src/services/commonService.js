/**
 * Common Service utilities for search, filtering, pagination, and sorting
 */

export const filterItems = (items = [], searchQuery = '', searchFields = []) => {
  if (!searchQuery || !searchQuery.trim()) return items;
  const term = searchQuery.trim().toLowerCase();

  return items.filter((item) => {
    if (!item) return false;
    return searchFields.some((field) => {
      const val = item[field];
      if (val === null || val === undefined) return false;
      return String(val).toLowerCase().includes(term);
    });
  });
};

export const paginateItems = (items = [], page = 1, pageSize = 10) => {
  const total = items.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = items.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    total,
    currentPage,
    totalPages,
    pageSize,
  };
};

export const sortItems = (items = [], sortBy = 'id', ascending = true) => {
  return [...items].sort((a, b) => {
    const valA = a[sortBy] ?? '';
    const valB = b[sortBy] ?? '';

    if (typeof valA === 'number' && typeof valB === 'number') {
      return ascending ? valA - valB : valB - valA;
    }

    const strA = String(valA).toLowerCase();
    const strB = String(valB).toLowerCase();

    if (strA < strB) return ascending ? -1 : 1;
    if (strA > strB) return ascending ? 1 : -1;
    return 0;
  });
};

export const formatErrorMessage = (error, defaultMsg = 'An unexpected error occurred.') => {
  if (!error) return defaultMsg;
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  return defaultMsg;
};
