import test from 'node:test';
import assert from 'node:assert/strict';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { createFishPattern, FishManager, markFishCollected } from './FishManager.js';

test('each documented fish pattern has the expected count and unique IDs', () => {
  const counts = { line: 5, ascending: 5, jumpCurve: 6, doubleJump: 6, obstacleLinked: 4 };
  for (const [kind, count] of Object.entries(counts)) {
    const fishes = createFishPattern(kind, 1, 100, GAME_CONFIG.groundY);
    assert.equal(fishes.length, count);
    assert.equal(new Set(fishes.map((fish) => fish.id)).size, count);
    assert.ok(fishes.every((fish) => fish.width === 32 && fish.height === 24));
  }
  assert.ok(createFishPattern('ascending', 1, 0).at(-1).y < createFishPattern('ascending', 1, 0)[0].y);
});

test('fish spawn after the initial delay, avoid obstacles, then use unique IDs', () => {
  const manager = new FishManager(() => 0);
  assert.deepEqual(manager.update(GAME_CONFIG.firstFishAfterMs - 1, GAME_CONFIG.groundY), []);
  const x = GAME_CONFIG.width + GAME_CONFIG.fishSpawnXOffset;
  const blocked = manager.update(GAME_CONFIG.firstFishAfterMs, GAME_CONFIG.groundY,
    [{ x, y: GAME_CONFIG.groundY - 50, width: 50, height: 50 }]);
  assert.deepEqual(blocked, []);
  const fishes = manager.update(GAME_CONFIG.firstFishAfterMs + 250, GAME_CONFIG.groundY);
  assert.equal(fishes.length, 5);
  const later = manager.update(GAME_CONFIG.firstFishAfterMs + GAME_CONFIG.fishSpawnIntervalMs + 250, GAME_CONFIG.groundY);
  assert.notEqual(fishes[0].id, later[0].id);
});

test('a fish awards collection only once', () => {
  const fish = { collected: false };
  assert.equal(markFishCollected(fish), true);
  assert.equal(markFishCollected(fish), false);
});
