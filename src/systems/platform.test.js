import test from 'node:test';
import assert from 'node:assert/strict';
import { getControlInstructions, isTouchDevice, requiresLandscape } from './platform.js';

test('touch detection uses touch points or a coarse pointer', () => {
  assert.equal(isTouchDevice({ maxTouchPoints: 2 }, () => ({ matches: false })), true);
  assert.equal(isTouchDevice({ maxTouchPoints: 0 }, () => ({ matches: true })), true);
  assert.equal(isTouchDevice({ maxTouchPoints: 0 }, () => ({ matches: false })), false);
});

test('landscape is required only for a touch device in portrait orientation', () => {
  assert.equal(requiresLandscape(390, 844, true), true);
  assert.equal(requiresLandscape(844, 390, true), false);
  assert.equal(requiresLandscape(390, 844, false), false);
});

test('tutorial instructions match the active input method', () => {
  assert.match(getControlInstructions(true), /오른쪽 버튼/);
  assert.match(getControlInstructions(false), /Space/);
});
