import {
  BOMB_LIFETIME_MAX_MS,
  BOMB_LIFETIME_MIN_MS,
  FLOWER_MAX_DELAY_MS,
  FLOWER_MIN_DELAY_MS,
  GRID_H,
  GRID_W,
  MAGIC_WALL_MAX_DURATION_MS,
  MAGIC_WALL_MIN_DURATION_MS,
  TARGET_PUSH_MAX_DELAY_MS,
  TARGET_PUSH_MIN_DELAY_MS,
  START_FLOWER,
  START_PLAYER,
  START_TARGET,
} from "./constants";
import type { Pos } from "./types";

export function keyOf(x: number, y: number): string {
  return `${x},${y}`;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function inBounds(x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < GRID_W && y < GRID_H;
}

export function samePos(a: Pos | null | undefined, b: Pos | null | undefined): boolean {
  return !!a && !!b && a.x === b.x && a.y === b.y;
}

export function adjacent8(center: Pos): Pos[] {
  const out: Pos[] = [];
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      const x = center.x + dx;
      const y = center.y + dy;
      if (inBounds(x, y)) out.push({ x, y });
    }
  }
  return out;
}

export function centeredBombArea(center: Pos): Set<string> {
  const out = new Set<string>();
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      const x = center.x + dx;
      const y = center.y + dy;
      if (inBounds(x, y)) out.add(keyOf(x, y));
    }
  }
  return out;
}

export function randomBombDelay(): number {
  return 3000 + Math.floor(Math.random() * 5001);
}

export function randomBombDuration(): number {
  return BOMB_LIFETIME_MIN_MS + Math.floor(Math.random() * (BOMB_LIFETIME_MAX_MS - BOMB_LIFETIME_MIN_MS + 1));
}

export function randomFlowerDelay(): number {
  return FLOWER_MIN_DELAY_MS + Math.floor(Math.random() * (FLOWER_MAX_DELAY_MS - FLOWER_MIN_DELAY_MS + 1));
}

export function randomTargetPushDelay(): number {
  return TARGET_PUSH_MIN_DELAY_MS + Math.floor(Math.random() * (TARGET_PUSH_MAX_DELAY_MS - TARGET_PUSH_MIN_DELAY_MS + 1));
}

export function randomMagicWallDuration(): number {
  return MAGIC_WALL_MIN_DURATION_MS + Math.floor(Math.random() * (MAGIC_WALL_MAX_DURATION_MS - MAGIC_WALL_MIN_DURATION_MS + 1));
}

export function buildStraightPath(from: Pos, to: Pos, blockedKeys: Set<string>): Pos[] {
  const path: Pos[] = [];
  let x = from.x;
  let y = from.y;

  while (x !== to.x || y !== to.y) {
    const prevX = x;
    const prevY = y;

    if (x < to.x) x += 1;
    else if (x > to.x) x -= 1;

    if (y < to.y) y += 1;
    else if (y > to.y) y -= 1;

    if (blockedKeys.has(keyOf(x, y))) {
      x = prevX;
      y = prevY;
      break;
    }

    path.push({ x, y });
  }

  return path;
}

export function generateRandomObstacles(count: number, forbidden: Set<string>): Set<string> {
  const out = new Set<string>();
  let tries = 0;

  while (out.size < count && tries < 3000) {
    tries += 1;
    const x = Math.floor(Math.random() * GRID_W);
    const y = Math.floor(Math.random() * GRID_H);
    const key = keyOf(x, y);
    if (forbidden.has(key)) continue;
    out.add(key);
  }

  return out;
}

export function makeBaseForbidden(): Set<string> {
  return new Set<string>([
    keyOf(START_PLAYER.x, START_PLAYER.y),
    keyOf(START_TARGET.x, START_TARGET.y),
    keyOf(START_FLOWER.x, START_FLOWER.y),
  ]);
}

export function sameKeySet(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const value of a) {
    if (!b.has(value)) return false;
  }
  return true;
}

export function generateDifferentObstacles(current: Set<string>, count: number, forbidden: Set<string>): Set<string> {
  let next = generateRandomObstacles(count, forbidden);
  let tries = 0;

  while (sameKeySet(next, current) && tries < 50) {
    next = generateRandomObstacles(count, forbidden);
    tries += 1;
  }

  return next;
}
