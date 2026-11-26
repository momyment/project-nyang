import { GAME_CONFIG } from '../config/gameConfig.js';

export function createRunnerState() {
  return {
    phase: 'countdown',
    countdown: 3,
    elapsedMs: 0,
    speed: GAME_CONFIG.baseSpeed,
    playerY: 0,
    verticalSpeed: 0,
    jumpCount: 0,
    movementState: 'RUN',
    slideElapsedMs: 0,
    health: GAME_CONFIG.maxHealth,
    invincibleRemainingMs: 0,
    distancePx: 0,
    distanceM: 0,
    collectedFish: 0,
    score: 0,
    difficultyLevel: 1,
    targetSpeed: GAME_CONFIG.baseSpeed,
  };
}

export function pressJump(state) {
  if (state.phase !== 'running' || state.jumpCount >= GAME_CONFIG.maxJumps) return state;
  const jumpCount = state.jumpCount + 1;
  return {
    ...state,
    jumpCount,
    verticalSpeed: jumpCount === 1 ? GAME_CONFIG.jumpVelocity : GAME_CONFIG.doubleJumpVelocity,
    movementState: jumpCount === 1 ? 'JUMP' : 'DOUBLE_JUMP',
    slideElapsedMs: 0,
  };
}

export function advanceRunner(state, deltaMs, { slideHeld = false } = {}) {
  if (state.phase !== 'running' || deltaMs <= 0) return state;
  let next = {
    ...state,
    elapsedMs: state.elapsedMs + deltaMs,
    invincibleRemainingMs: Math.max(0, state.invincibleRemainingMs - deltaMs),
  };
  // Smaller steps keep jumps and landing consistent when frame time varies.
  const steps = Math.max(1, Math.ceil(deltaMs / (1000 / 120)));
  const stepSeconds = deltaMs / 1000 / steps;
  const stepMs = deltaMs / steps;

  for (let index = 0; index < steps; index += 1) {
    if (next.playerY < 0 || next.verticalSpeed < 0) {
      const previousVerticalSpeed = next.verticalSpeed;
      next.playerY += previousVerticalSpeed * stepSeconds
        + 0.5 * GAME_CONFIG.gravity * stepSeconds * stepSeconds;
      next.verticalSpeed = previousVerticalSpeed + GAME_CONFIG.gravity * stepSeconds;
      if (next.playerY >= 0) {
        next = {
          ...next,
          playerY: 0,
          verticalSpeed: 0,
          jumpCount: 0,
          movementState: slideHeld ? 'SLIDE' : 'RUN',
          slideElapsedMs: 0,
        };
      } else {
        next.movementState = next.verticalSpeed < 0
          ? (next.jumpCount > 1 ? 'DOUBLE_JUMP' : 'JUMP')
          : 'FALL';
      }
      continue;
    }

    if (next.movementState === 'SLIDE') {
      next.slideElapsedMs += stepMs;
      if (!slideHeld && next.slideElapsedMs >= GAME_CONFIG.slideMinMs) {
        next.movementState = 'RUN';
        next.slideElapsedMs = 0;
      }
    } else if (slideHeld) {
      next.movementState = 'SLIDE';
      next.slideElapsedMs = 0;
    } else {
      next.movementState = 'RUN';
    }
  }
  return next;
}

export function getPlayerHitbox(state, playerX = GAME_CONFIG.playerX, groundY = GAME_CONFIG.groundY) {
  const height = state.movementState === 'SLIDE'
    ? GAME_CONFIG.slideHitboxHeight
    : GAME_CONFIG.playerHitboxHeight;
  const width = state.movementState === 'SLIDE'
    ? GAME_CONFIG.slideHitboxWidth
    : GAME_CONFIG.playerHitboxWidth;
  return {
    x: playerX - width / 2,
    y: groundY + state.playerY - height,
    width,
    height,
  };
}

export function damageRunner(state) {
  if (state.phase !== 'running' || state.invincibleRemainingMs > 0) {
    return { state, damaged: false };
  }
  const health = Math.max(0, state.health - 1);
  if (health === 0) {
    return {
      state: { ...state, health, phase: 'gameOver', movementState: 'DEAD', invincibleRemainingMs: 0 },
      damaged: true,
    };
  }
  return {
    state: { ...state, health, invincibleRemainingMs: GAME_CONFIG.invincibleMs },
    damaged: true,
  };
}
