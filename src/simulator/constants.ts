import type { Pos } from "./types";

export const GRID_W = 11;
export const GRID_H = 11;
export const PUSH_DELAY_MS = 1000;
export const SHARED_UTILITY_RUNE_COOLDOWN_MS = 2000;
export const BOMB_COOLDOWN_MS = 2000;
export const BOMB_LIFETIME_MIN_MS = 15000;
export const BOMB_LIFETIME_MAX_MS = 20000;
export const PLAYER_BOMB_COOLDOWN_MS = 2000;
export const MAGIC_WALL_COOLDOWN_MS = 2000;
export const MAGIC_WALL_MIN_DURATION_MS = 18000;
export const MAGIC_WALL_MAX_DURATION_MS = 20000;
export const FLOWER_MIN_DELAY_MS = 4000;
export const FLOWER_MAX_DELAY_MS = 9000;
export const PLAYER_FLOWER_COOLDOWN_MS = 2000;
export const TARGET_PUSH_COOLDOWN_MS = 2000;
export const TARGET_PUSH_MIN_DELAY_MS = 2500;
export const TARGET_PUSH_MAX_DELAY_MS = 5000;
export const WALK_STEP_MS = 220;
export const TARGET_RETURN_DELAY_MS = 80;
export const FOLLOW_WINDOW_MS = 1200;
export const FOLLOW_GOOD_START_MS = 180;
export const FOLLOW_GOOD_END_MS = 520;
export const OBSTACLE_COUNT = 10;

export const START_PLAYER: Pos = { x: 3, y: 5 };
export const START_TARGET: Pos = { x: 6, y: 5 };
export const START_FLOWER: Pos = { x: 6, y: 4 };

export const DIRS: Record<string, [number, number]> = {
  w: [0, -1],
  a: [-1, 0],
  s: [0, 1],
  d: [1, 0],
  q: [-1, -1],
  e: [1, -1],
  z: [-1, 1],
  c: [1, 1],
};

export const STATUS_ROWS = [["Push delay", "1s para player / instantaneo para flower"]] as const;
