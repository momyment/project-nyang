import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceDifficulty, getDifficulty } from './DifficultyManager.js';

test('difficulty changes at documented distance boundaries', () => {
  for (const [distance, level] of [[499, 1], [500, 2], [999, 2], [1000, 3], [1999, 3], [2000, 4], [2999, 4], [3000, 5]]) {
    assert.equal(getDifficulty(distance).level, level);
  }
});

test('speed eases toward the level target while preserving run state', () => {
  const original = { phase: 'running', distanceM: 500, speed: 300, health: 2, score: 123, movementState: 'JUMP' };
  const next = advanceDifficulty(original, 1000);
  assert.equal(next.difficultyLevel, 2);
  assert.equal(next.targetSpeed, 360);
  assert.equal(next.speed, 360);
  assert.equal(next.health, 2);
  assert.equal(next.score, 123);
  assert.equal(next.movementState, 'JUMP');
});

test('speed acceleration is gradual and capped at the level target', () => {
  const start = { phase: 'running', distanceM: 3000, speed: 300 };
  const first = advanceDifficulty(start, 1000);
  assert.equal(first.speed, 360);
  const second = advanceDifficulty(first, 1000);
  assert.equal(second.speed, 420);
  assert.equal(advanceDifficulty({ ...second, speed: 540 }, 1000).speed, 540);
});
