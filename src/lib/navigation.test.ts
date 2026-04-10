import test from 'node:test';
import assert from 'node:assert/strict';

import { APP_TABS, getTabMeta, normalizeTab } from './navigation';

test('normalizeTab falls back to dashboard for unknown values', () => {
  assert.equal(normalizeTab('unknown'), 'dashboard');
  assert.equal(normalizeTab(undefined), 'dashboard');
});

test('normalizeTab preserves supported tab ids', () => {
  assert.equal(normalizeTab('tasks'), 'tasks');
  assert.equal(normalizeTab('settings'), 'settings');
});

test('getTabMeta returns the shell copy for a tab', () => {
  const meta = getTabMeta('wallet');

  assert.equal(meta.id, 'wallet');
  assert.match(meta.title, /wallet/i);
  assert.ok(meta.description.length > 0);
});

test('app tabs keep settings available in the registry', () => {
  assert.ok(APP_TABS.some((tab) => tab.id === 'settings'));
});
