import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeNavbarUser, getDashboardPath } from './navbarUtils.js';

test('normalizeNavbarUser returns a safe guest profile when user is null', () => {
  const normalized = normalizeNavbarUser(null);

  assert.deepEqual(normalized, {
    id: null,
    name: '',
    role: 'guest',
    email: '',
  });
});

test('getDashboardPath falls back to login when the role is missing', () => {
  assert.equal(getDashboardPath({ name: 'Test User' }), '/login');
  assert.equal(getDashboardPath({ role: 'admin' }), '/dashboard/admin');
});
