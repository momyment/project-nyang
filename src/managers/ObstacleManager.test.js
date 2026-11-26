import test from 'node:test';
import assert from 'node:assert/strict';
import { DIFFICULTY_CONFIG, GAME_CONFIG, OBSTACLE_CONFIG } from '../config/gameConfig.js';
import { createObstacle, ObstacleManager } from './ObstacleManager.js';

test('the first obstacle is not spawned before three seconds and is a low stone afterward', () => {
  const manager = new ObstacleManager(() => 0.5);
  assert.deepEqual(manager.update(16, 300, GAME_CONFIG.firstObstacleAfterMs - 1), []);
  const [first] = manager.update(16, 300, GAME_CONFIG.firstObstacleAfterMs);
  assert.equal(first.kind, 'stone');
  assert.equal(first.x, GAME_CONFIG.width + GAME_CONFIG.obstacleSpawnXOffset);
  assert.equal(first.y, GAME_CONFIG.groundY - OBSTACLE_CONFIG.stone.height);
});

test('spawn timing follows difficulty ranges and higher levels change obstacle patterns', () => {
  const manager = new ObstacleManager(() => 0.5);
  manager.update(16, 300, 3000, GAME_CONFIG.groundY, 1);
  const level1Interval = manager.nextIntervalMs;
  assert.equal(level1Interval, 3750);
  assert.deepEqual(manager.update(3749, 300, 6749, GAME_CONFIG.groundY, 1), []);
  assert.equal(manager.update(1, 300, 6750, GAME_CONFIG.groundY, 2)[0].kind, 'log');

  const level2Interval = manager.nextIntervalMs;
  assert.ok(level2Interval >= DIFFICULTY_CONFIG[1].obstacleMinMs);
  assert.ok(level2Interval <= DIFFICULTY_CONFIG[1].obstacleMaxMs);
  assert.equal(manager.update(level2Interval, 360, 6750 + level2Interval, GAME_CONFIG.groundY, 3)[0].kind, 'stone');
  const level3Interval = manager.nextIntervalMs;
  assert.equal(manager.update(level3Interval, 420, 20000, GAME_CONFIG.groundY, 3)[0].kind, 'log');
});

test('obstacle sizes and vertical positions match the policy', () => {
  const stone = createObstacle('stone', 'stone-1', 1320);
  const log = createObstacle('log', 'log-1', 1320);
  const branch = createObstacle('branch', 'branch-1', 1320);
  assert.deepEqual([stone.width, stone.height], [50, 40]);
  assert.deepEqual([log.width, log.height], [90, 85]);
  assert.deepEqual([branch.width, branch.height, branch.y], [100, 50, 472]);
});
