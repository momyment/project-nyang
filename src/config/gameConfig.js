export const GAME_CONFIG = Object.freeze({
  width: 1280,
  height: 720,
  groundY: 572,
  playerX: 320,
  baseSpeed: 300,
  gravity: 1500,
  jumpVelocity: -600,
  doubleJumpVelocity: -540,
  maxJumps: 2,
  slideMinMs: 200,
  maxHealth: 3,
  invincibleMs: 2000,
  firstObstacleAfterMs: 3000,
  obstacleSpawnXOffset: 40,
  speedAcceleration: 60,
  firstFishAfterMs: 1000,
  fishSpawnXOffset: 300,
  fishSpawnIntervalMs: 7000,
  fishSpacingPx: 48,
  playerHitboxWidth: 64,
  playerHitboxHeight: 76,
  slideHitboxWidth: 84,
  slideHitboxHeight: 38,
  countdownSeconds: 3,
  countdownStepMs: 1000,
  saveKey: 'project_nyang_save',
  saveVersion: 1,
});

export const OBSTACLE_CONFIG = Object.freeze({
  stone: Object.freeze({ width: 50, height: 40, yFromGround: 40 }),
  log: Object.freeze({ width: 90, height: 85, yFromGround: 85 }),
  branch: Object.freeze({ width: 100, height: 50, yFromGround: 100 }),
});

export const DIFFICULTY_CONFIG = Object.freeze([
  Object.freeze({ level: 1, minDistance: 0, maxDistance: 499, speedMultiplier: 1.0, obstacleMinMs: 3000, obstacleMaxMs: 4500, strategy: 'single' }),
  Object.freeze({ level: 2, minDistance: 500, maxDistance: 999, speedMultiplier: 1.2, obstacleMinMs: 2700, obstacleMaxMs: 4000, strategy: 'mixed' }),
  Object.freeze({ level: 3, minDistance: 1000, maxDistance: 1999, speedMultiplier: 1.4, obstacleMinMs: 2300, obstacleMaxMs: 3500, strategy: 'sequence' }),
  Object.freeze({ level: 4, minDistance: 2000, maxDistance: 2999, speedMultiplier: 1.6, obstacleMinMs: 2000, obstacleMaxMs: 3000, strategy: 'alternate' }),
  Object.freeze({ level: 5, minDistance: 3000, maxDistance: Infinity, speedMultiplier: 1.8, obstacleMinMs: 1700, obstacleMaxMs: 2500, strategy: 'compound' }),
]);
