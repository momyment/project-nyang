import { DIFFICULTY_CONFIG, GAME_CONFIG, OBSTACLE_CONFIG } from '../config/gameConfig.js';

const MIXED_KINDS = ['stone', 'log', 'branch'];
const PATTERNS = Object.freeze({
  3: ['stone', 'log', 'branch'],
  4: ['stone', 'branch', 'log', 'branch'],
  5: ['log', 'branch', 'stone', 'branch'],
});

export function createObstacle(kind, id, x, groundY = GAME_CONFIG.groundY) {
  const size = OBSTACLE_CONFIG[kind];
  if (!size) throw new Error(`Unknown obstacle kind: ${kind}`);
  return {
    id,
    kind,
    x,
    previousX: x,
    y: groundY - size.yFromGround,
    width: size.width,
    height: size.height,
    contacted: false,
  };
}

export class ObstacleManager {
  constructor(random = Math.random) {
    this.random = random;
    this.hasSpawnedFirst = false;
    this.timeSinceSpawnMs = 0;
    this.nextIntervalMs = 0;
    this.nextId = 1;
    this.patternIndexes = { 3: 0, 4: 0, 5: 0 };
  }

  update(deltaMs, _speed, elapsedMs, groundY = GAME_CONFIG.groundY, difficultyLevel = 1) {
    if (!this.hasSpawnedFirst) {
      if (elapsedMs < GAME_CONFIG.firstObstacleAfterMs) return [];
      this.hasSpawnedFirst = true;
      this.nextIntervalMs = this.selectInterval(difficultyLevel);
      return [this.make('stone', groundY)];
    }

    this.timeSinceSpawnMs += deltaMs;
    if (this.timeSinceSpawnMs < this.nextIntervalMs) return [];
    this.timeSinceSpawnMs = 0;
    const kind = this.selectKind(difficultyLevel);
    this.nextIntervalMs = this.selectInterval(difficultyLevel);
    return [this.make(kind, groundY)];
  }

  selectInterval(level) {
    const rules = DIFFICULTY_CONFIG.find((item) => item.level === level) ?? DIFFICULTY_CONFIG[0];
    return rules.obstacleMinMs + this.random() * (rules.obstacleMaxMs - rules.obstacleMinMs);
  }

  selectKind(level) {
    if (level === 1) return 'stone';
    if (level === 2) return MIXED_KINDS[Math.min(MIXED_KINDS.length - 1, Math.floor(this.random() * MIXED_KINDS.length))];
    const pattern = PATTERNS[level] ?? PATTERNS[5];
    const index = this.patternIndexes[level] % pattern.length;
    this.patternIndexes[level] += 1;
    return pattern[index];
  }

  make(kind, groundY) {
    const obstacle = createObstacle(kind, `obstacle-${this.nextId}`, GAME_CONFIG.width + GAME_CONFIG.obstacleSpawnXOffset, groundY);
    this.nextId += 1;
    return obstacle;
  }
}
