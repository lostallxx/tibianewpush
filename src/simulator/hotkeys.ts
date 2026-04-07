import type { HotkeyActionId, HotkeyBindings } from "./types";

type HotkeyActionMeta = {
  id: HotkeyActionId;
  label: string;
  group: "Movimento" | "Runas" | "Utilidade";
};

export const HOTKEY_STORAGE_KEY = "tibia-push-trainer-hotkeys";

export const DEFAULT_HOTKEY_BINDINGS: HotkeyBindings = {
  move_nw: "KeyQ",
  move_n: "KeyW",
  move_ne: "KeyE",
  move_w: "KeyA",
  move_e: "KeyD",
  move_sw: "KeyZ",
  move_s: "KeyS",
  move_se: "KeyC",
  player_bomb: "Digit1",
  destroy_field: "KeyF",
  disintegrate: "KeyX",
  magic_wall: "Digit3",
  clear_map: "KeyR",
};

export const HOTKEY_ACTIONS: readonly HotkeyActionMeta[] = [
  { id: "move_nw", label: "Mover NW", group: "Movimento" },
  { id: "move_n", label: "Mover N", group: "Movimento" },
  { id: "move_ne", label: "Mover NE", group: "Movimento" },
  { id: "move_w", label: "Mover W", group: "Movimento" },
  { id: "move_e", label: "Mover E", group: "Movimento" },
  { id: "move_sw", label: "Mover SW", group: "Movimento" },
  { id: "move_s", label: "Mover S", group: "Movimento" },
  { id: "move_se", label: "Mover SE", group: "Movimento" },
  { id: "player_bomb", label: "Bomb Rune", group: "Runas" },
  { id: "destroy_field", label: "Destroy Field", group: "Runas" },
  { id: "disintegrate", label: "Disintegrate", group: "Runas" },
  { id: "magic_wall", label: "Magic Wall", group: "Runas" },
  { id: "clear_map", label: "Limpar mapa", group: "Utilidade" },
] as const;

export function getActionForCode(bindings: HotkeyBindings, code: string): HotkeyActionId | null {
  const match = Object.entries(bindings).find(([, value]) => value === code);
  return (match?.[0] as HotkeyActionId | undefined) ?? null;
}

export function formatHotkey(code: string | null): string {
  if (!code) return "Sem tecla";
  if (code.startsWith("Key")) return code.slice(3).toUpperCase();
  if (code.startsWith("Digit")) return code.slice(5);
  if (code.startsWith("Numpad")) return `Num ${code.slice(6)}`;
  if (code.startsWith("Arrow")) return code.slice(5);
  return code.replace(/([a-z])([A-Z])/g, "$1 $2");
}

export function loadHotkeyBindings(): HotkeyBindings {
  if (typeof window === "undefined") return DEFAULT_HOTKEY_BINDINGS;

  try {
    const raw = window.localStorage.getItem(HOTKEY_STORAGE_KEY);
    if (!raw) return DEFAULT_HOTKEY_BINDINGS;
    const parsed = JSON.parse(raw) as Partial<HotkeyBindings>;
    return { ...DEFAULT_HOTKEY_BINDINGS, ...parsed };
  } catch {
    return DEFAULT_HOTKEY_BINDINGS;
  }
}
