import assert from 'node:assert/strict';
import test from 'node:test';
import { getCharacterAnimationKey } from './characterAnimation.js';

test('runner movement states select matching cat animations', () => {
  const states = ['RUN', 'JUMP', 'DOUBLE_JUMP', 'FALL', 'SLIDE'];
  const animations = states.map(getCharacterAnimationKey);

  assert.deepEqual(animations, [
    'nyang-run',
    'nyang-jump',
    'nyang-jump',
    'nyang-fall',
    'nyang-slide',
  ]);
});
