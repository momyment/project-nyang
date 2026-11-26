import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SAVE } from './SaveManager.js';
import { createSettlement, retrySettlement, settleRun } from './RewardManager.js';

const run = { playId: 'play-1', score: 101, distanceM: 50, collectedFish: 3 };

test('normal game over combines collected fish and independently updates records', () => {
  const prior = { ...DEFAULT_SAVE, fish: 100, bestScore: 100, bestDistance: 60 };
  const settlement = createSettlement(prior, run);
  assert.equal(settlement.save.fish, 103);
  assert.equal(settlement.save.bestScore, 101);
  assert.equal(settlement.save.bestDistance, 60);
  assert.equal(settlement.newBestScore, true);
  assert.equal(settlement.newBestDistance, false);
});

test('identical play ID cannot award twice', () => {
  const first = createSettlement(DEFAULT_SAVE, run);
  const second = createSettlement(first.save, run);
  assert.equal(second.duplicate, true);
  assert.equal(second.save.fish, 3);
});

test('storage failure leaves the calculated settlement available for retry', () => {
  const storage = { setItem() { throw new Error('blocked'); } };
  const failed = settleRun(DEFAULT_SAVE, run, storage);
  assert.equal(failed.saved, false);
  assert.equal(failed.save.fish, 3);
  const values = new Map();
  const available = { setItem: (key, value) => values.set(key, value) };
  assert.equal(retrySettlement(failed, available), true);
  assert.equal(JSON.parse(values.values().next().value).fish, 3);
});
