import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceRunner, createRunnerState, damageRunner, getPlayerHitbox, pressJump } from './runner.js';
import { DEFAULT_SAVE, loadSave, normaliseSave, saveData } from '../managers/SaveManager.js';

const playing = () => ({ ...createRunnerState(), phase: 'running', countdown: 0 });

test('runner begins in the documented countdown and idle state', () => {
  const state = createRunnerState();
  assert.equal(state.phase, 'countdown');
  assert.equal(state.countdown, 3);
  assert.equal(state.speed, 300);
  assert.equal(state.jumpCount, 0);
});

test('elapsed running time advances only after countdown', () => {
  const initial = createRunnerState();
  assert.equal(advanceRunner(initial, 100).elapsedMs, 0);
  assert.equal(advanceRunner(playing(), 100).elapsedMs, 100);
});

test('first jump reaches approximately 120 logical pixels and lands back in RUN', () => {
  const jumped = pressJump(playing());
  const apex = advanceRunner(jumped, 400);
  assert.ok(Math.abs(apex.playerY + 120) < 1);
  assert.equal(apex.movementState, 'FALL');
  const landed = advanceRunner(apex, 450);
  assert.equal(landed.playerY, 0);
  assert.equal(landed.verticalSpeed, 0);
  assert.equal(landed.jumpCount, 0);
  assert.equal(landed.movementState, 'RUN');
});

test('second jump works while rising or falling and a third jump is ignored', () => {
  const rising = pressJump(pressJump(playing()));
  assert.equal(rising.jumpCount, 2);
  assert.equal(rising.movementState, 'DOUBLE_JUMP');
  assert.equal(pressJump(rising), rising);

  const falling = advanceRunner(pressJump(playing()), 600);
  assert.equal(falling.movementState, 'FALL');
  const doubleJump = pressJump(falling);
  assert.equal(doubleJump.jumpCount, 2);
  assert.equal(doubleJump.movementState, 'DOUBLE_JUMP');
});

test('slide starts on the ground, ignores airborne input, and waits at least 200 ms to end', () => {
  const air = advanceRunner(pressJump(playing()), 100, { slideHeld: true });
  assert.notEqual(air.movementState, 'SLIDE');

  const sliding = advanceRunner(playing(), 16, { slideHeld: true });
  assert.equal(sliding.movementState, 'SLIDE');
  const beforeMin = advanceRunner(sliding, 184);
  assert.equal(beforeMin.movementState, 'SLIDE');
  const released = advanceRunner(beforeMin, 16);
  assert.equal(released.movementState, 'RUN');
});

test('jump overrides simultaneous slide input and slide hitbox is half-height', () => {
  const jumping = advanceRunner(pressJump(playing()), 16, { slideHeld: true });
  assert.equal(jumping.movementState, 'JUMP');
  assert.equal(getPlayerHitbox(playing()).height, 76);
  const slideBox = getPlayerHitbox(advanceRunner(playing(), 16, { slideHeld: true }));
  assert.equal(slideBox.height, 38);
  assert.equal(slideBox.width, 84);
});

test('each hit removes one heart, grants two seconds of invulnerability, then ends at zero', () => {
  const firstHit = damageRunner(playing());
  assert.equal(firstHit.state.health, 2);
  assert.equal(firstHit.state.invincibleRemainingMs, 2000);
  assert.equal(damageRunner(firstHit.state).damaged, false);
  const afterImmunity = advanceRunner(firstHit.state, 2000);
  assert.equal(afterImmunity.invincibleRemainingMs, 0);
  const secondHit = damageRunner(afterImmunity).state;
  assert.equal(secondHit.health, 1);
  const afterSecondImmunity = advanceRunner(secondHit, 2000);
  const gameOver = damageRunner(afterSecondImmunity).state;
  assert.equal(gameOver.health, 0);
  assert.equal(gameOver.phase, 'gameOver');
  assert.equal(damageRunner(gameOver).state.health, 0);
});

test('first launch creates the documented default save without replacing existing data', () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const loaded = loadSave(storage);
  assert.deepEqual(loaded.data, DEFAULT_SAVE);
  assert.equal(loaded.warning, null);
  assert.equal(JSON.parse(values.values().next().value).schemaVersion, 1);
});

test('save data fills missing values and rejects invalid counters', () => {
  assert.deepEqual(normaliseSave({ fish: -2, bestScore: 18 }), {
    ...DEFAULT_SAVE, fish: 0, bestScore: 18,
  });
});

test('save storage failures are reported without crashing the game', () => {
  const storage = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
  assert.ok(loadSave(storage).warning);
  assert.equal(saveData(DEFAULT_SAVE, storage), false);
  assert.equal(saveData(DEFAULT_SAVE, null), false);
});

test('corrupt save data is not overwritten before the user chooses reset', () => {
  let savedValue = '{broken-json';
  const storage = {
    getItem: () => savedValue,
    setItem: (_key, value) => { savedValue = value; },
  };
  const result = loadSave(storage);
  assert.equal(result.errorType, 'corrupt');
  assert.equal(savedValue, '{broken-json');
});
