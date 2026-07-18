import test from 'node:test';
import assert from 'node:assert/strict';
import { getConfiguredAdminEmails, isAdminEmail } from './adminAccess.js';

test('collects admin emails from a comma-separated environment value', () => {
  const emails = getConfiguredAdminEmails('admin@fixiva.com, ops@fixiva.com');
  assert.deepEqual(emails, ['admin@fixiva.com', 'ops@fixiva.com']);
});

test('matches admin emails case-insensitively', () => {
  assert.equal(isAdminEmail('Admin@Fixiva.com', 'Admin@Fixiva.com'), true);
  assert.equal(isAdminEmail('guest@fixiva.com', 'Admin@Fixiva.com'), false);
});
