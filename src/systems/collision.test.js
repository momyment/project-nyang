import test from 'node:test';
import assert from 'node:assert/strict';
import { overlaps, sweptHorizontalOverlap } from './collision.js';

test('overlap checks require both horizontal and vertical intersection', () => {
  const player = { x: 100, y: 400, width: 64, height: 76 };
  assert.equal(overlaps(player, { x: 150, y: 500, width: 50, height: 40 }), false);
  assert.equal(overlaps(player, { x: 150, y: 430, width: 50, height: 40 }), true);
});

test('swept collision catches an obstacle that crosses the player between frames', () => {
  const player = { x: 320, y: 496, width: 64, height: 76 };
  const obstacle = { x: 250, previousX: 400, y: 532, width: 50, height: 40 };
  assert.equal(overlaps(player, obstacle), false);
  assert.equal(sweptHorizontalOverlap(player, obstacle), true);
});

test('sliding collision box clears the low hanging branch', () => {
  const branch = { x: 320, y: 472, width: 100, height: 50 };
  const slideBox = { x: 278, y: 534, width: 84, height: 38 };
  const standingBox = { x: 288, y: 496, width: 64, height: 76 };
  assert.equal(overlaps(slideBox, branch), false);
  assert.equal(overlaps(standingBox, branch), true);
});
