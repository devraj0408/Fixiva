import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldAllowDevAdminBypass } from './devAuth.js';

test('allows the configured admin email in local development mode', () => {
  const result = shouldAllowDevAdminBypass({
    identifier: 'fixiva869@gmail.com',
    hostname: '127.0.0.1',
    isDevMode: true,
    configuredValue: 'fixiva869@gmail.com',
  });

  assert.equal(result, true);
});

test('blocks non-local hosts even in dev mode', () => {
  const result = shouldAllowDevAdminBypass({
    identifier: 'fixiva869@gmail.com',
    hostname: 'example.com',
    isDevMode: true,
    configuredValue: 'fixiva869@gmail.com',
  });

  assert.equal(result, false);
});
