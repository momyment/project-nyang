import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceScore, calculateScore, createScoreState } from './ScoreManager.js';

test('distance uses 30 pixels per meter and rounds down', () => {
  assert.equal(advanceScore(createScoreState(), 29).distanceM, 0);
  assert.equal(advanceScore(createScoreState(), 30).distanceM, 1);
  assert.equal(advanceScore(createScoreState(), 3000).distanceM, 100);
});

test('score combines traveled meters and ten points per fish', () => {
  const state = advanceScore({ ...createScoreState(), phase: 'running' }, 25_500, 120);
  assert.equal(state.distanceM, 850);
  assert.equal(state.collectedFish, 120);
  assert.equal(state.score, 2050);
  assert.equal(calculateScore(25_500, 120), 2050);
});

test('score does not change outside active play', () => {
  const state = { ...createScoreState(), phase: 'countdown' };
  assert.equal(advanceScore(state, 30, 1), state);
});
