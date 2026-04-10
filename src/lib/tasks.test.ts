import test from 'node:test';
import assert from 'node:assert/strict';

import { sortTasksForDisplay } from './tasks';

test('sortTasksForDisplay keeps categories in product priority order', () => {
  const result = sortTasksForDisplay([
    { id: 'daily_share', title: 'Daily share', category: 'daily', completed: false, eligible: true },
    { id: 'connect_x', title: 'Connect X', category: 'connect', completed: false, eligible: false },
    { id: 'first_referral', title: 'First referral', category: 'milestone', completed: false, eligible: false },
  ]);

  assert.deepEqual(
    result.map((task) => task.id),
    ['connect_x', 'first_referral', 'daily_share'],
  );
});

test('sortTasksForDisplay prioritizes ready tasks before blocked tasks inside a category', () => {
  const result = sortTasksForDisplay([
    { id: 'task-b', title: 'Blocked', category: 'community', completed: false, eligible: false },
    { id: 'task-a', title: 'Ready', category: 'community', completed: false, eligible: true },
  ]);

  assert.deepEqual(
    result.map((task) => task.id),
    ['task-a', 'task-b'],
  );
});

test('sortTasksForDisplay sends completed tasks to the bottom of their category', () => {
  const result = sortTasksForDisplay([
    { id: 'task-a', title: 'Completed', category: 'daily', completed: true, eligible: true },
    { id: 'task-b', title: 'Ready', category: 'daily', completed: false, eligible: true },
  ]);

  assert.deepEqual(
    result.map((task) => task.id),
    ['task-b', 'task-a'],
  );
});
