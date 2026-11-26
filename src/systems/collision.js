export function overlaps(a, b) {
  return a.x < b.x + b.width
    && a.x + a.width > b.x
    && a.y < b.y + b.height
    && a.y + a.height > b.y;
}

// Obstacles only move horizontally in Sprint 03. Sweeping their previous and
// current bounds prevents a fast frame from skipping over the player.
export function sweptHorizontalOverlap(player, obstacle, previousX = obstacle.previousX) {
  const left = Math.min(previousX, obstacle.x);
  const right = Math.max(previousX + obstacle.width, obstacle.x + obstacle.width);
  return player.x < right
    && player.x + player.width > left
    && player.y < obstacle.y + obstacle.height
    && player.y + player.height > obstacle.y;
}
