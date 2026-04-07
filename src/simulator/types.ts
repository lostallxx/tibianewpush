export type Pos = { x: number; y: number };

export type DragPayload = "target" | "flower" | null;

export type PushState = "ready" | "charging" | "canceled";

export type HotkeyActionId =
  | "move_nw"
  | "move_n"
  | "move_ne"
  | "move_w"
  | "move_e"
  | "move_sw"
  | "move_s"
  | "move_se"
  | "player_bomb"
  | "destroy_field"
  | "disintegrate"
  | "magic_wall"
  | "clear_map";

export type HotkeyBindings = Record<HotkeyActionId, string | null>;

export type TrainingModeId = "precision" | "follow" | "pressure";

export type TrainingScenario = {
  id: string;
  modeId: TrainingModeId;
  name: string;
  summary: string;
  goal: string;
  player: Pos;
  target: Pos;
  flower: Pos;
  obstacles?: Pos[];
  pauseSpawnsByDefault?: boolean;
  useRandomObstacles?: boolean;
};
