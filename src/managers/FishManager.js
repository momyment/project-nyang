import { GAME_CONFIG } from '../config/gameConfig.js';

export const FISH_PATTERNS = Object.freeze(['line', 'ascending', 'jumpCurve', 'doubleJump', 'obstacleLinked']);

export function createFishPattern(kind, firstId, startX, groundY = GAME_CONFIG.groundY) {
  const count = kind === 'obstacleLinked' ? 4 : kind === 'jumpCurve' || kind === 'doubleJump' ? 6 : 5;
  if (!FISH_PATTERNS.includes(kind)) throw new Error(`Unknown fish pattern: ${kind}`);
  return Array.from({ length: count }, (_, index) => {
    let y = groundY - 38;
    if (kind === 'ascending') y = groundY - 30 - index * 14;
    if (kind === 'jumpCurve') {
      const arc = Math.sin(index / (count - 1) * Math.PI);
      y = groundY - 36 - arc * 96;
    }
    if (kind === 'doubleJump') {
      const arc = Math.sin(index / (count - 1) * Math.PI);
      y = groundY - 36 - arc * 155;
    }
    if (kind === 'obstacleLinked') {
      const arc = Math.sin(index / (count - 1) * Math.PI);
      y = groundY - 70 - arc * 50;
    }
    return {
      id: `fish-${firstId + index}`,
      kind,
      x: startX + index * GAME_CONFIG.fishSpacingPx,
      previousX: startX + index * GAME_CONFIG.fishSpacingPx,
      y,
      width: 32,
      height: 24,
      collected: false,
    };
  });
}

export class FishManager {
  constructor(random = Math.random) {
    this.random = random;
    this.nextId = 1;
    this.nextSpawnAtMs = GAME_CONFIG.firstFishAfterMs;
    this.pendingKind = null;
  }

  update(elapsedMs, groundY, obstacles = []) {
    if (elapsedMs < this.nextSpawnAtMs) return [];
    if (!this.pendingKind) {
      this.pendingKind = FISH_PATTERNS[Math.min(FISH_PATTERNS.length - 1,
        Math.floor(this.random() * FISH_PATTERNS.length))];
    }
    const pattern = createFishPattern(this.pendingKind, this.nextId,
      GAME_CONFIG.width + GAME_CONFIG.fishSpawnXOffset, groundY);
    const blocked = obstacles.some((obstacle) => pattern.some((fish) => boxesOverlap(fish, obstacle)));
    if (blocked) {
      this.nextSpawnAtMs = elapsedMs + 250;
      return [];
    }
    this.nextId += pattern.length;
    this.pendingKind = null;
    this.nextSpawnAtMs = elapsedMs + GAME_CONFIG.fishSpawnIntervalMs;
    return pattern;
  }
}

export function boxesOverlap(a, b) {
  return a.x < b.x + b.width
    && a.x + a.width > b.x
    && a.y < b.y + b.height
    && a.y + a.height > b.y;
}

// FN-017: a fish must grant its reward at most once, even if collision checks repeat.
export function markFishCollected(fish) {
  if (fish.collected) return false;
  fish.collected = true;
  return true;
}
