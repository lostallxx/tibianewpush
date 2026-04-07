import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MemoBoardTile } from "./simulator/BoardTile";
import { FlowerBackpack } from "./simulator/FlowerBackpack";
import { PauseMenu } from "./simulator/PauseMenu";
import {
  BOMB_COOLDOWN_MS,
  DIRS,
  FOLLOW_GOOD_END_MS,
  FOLLOW_GOOD_START_MS,
  FOLLOW_WINDOW_MS,
  GRID_H,
  GRID_W,
  MAGIC_WALL_COOLDOWN_MS,
  PLAYER_BOMB_COOLDOWN_MS,
  PUSH_DELAY_MS,
  SHARED_UTILITY_RUNE_COOLDOWN_MS,
  START_PLAYER,
  START_TARGET,
  TARGET_PUSH_COOLDOWN_MS,
  TARGET_RETURN_DELAY_MS,
  WALK_STEP_MS,
} from "../simulator/constants";
import type { DragPayload, HotkeyActionId, HotkeyBindings, Pos, PushState } from "../simulator/types";
import {
  adjacent8,
  buildStraightPath,
  centeredBombArea,
  clamp,
  generateDifferentObstacles,
  generateRandomObstacles,
  inBounds,
  keyOf,
  randomBombDelay,
  randomBombDuration,
  randomFlowerDelay,
  randomMagicWallDuration,
  randomTargetPushDelay,
  samePos,
} from "../simulator/utils";
import { DEFAULT_HOTKEY_BINDINGS, formatHotkey, getActionForCode, HOTKEY_STORAGE_KEY, loadHotkeyBindings } from "../simulator/hotkeys";
import {
  DEFAULT_SCENARIO_ID,
  getObstacleCountForScenario,
  getScenarioById,
  getScenariosForMode,
  getTrainingMode,
  TRAINING_MODES,
} from "../simulator/training";
import type { TrainingModeId, TrainingScenario } from "../simulator/types";

export default function TibiaPushSimulator() {
  const initialScenario = getScenarioById(DEFAULT_SCENARIO_ID);
  const hoverTileRef = useRef<Pos | null>(null);
  const pushDestinationRef = useRef<Pos | null>(null);
  const dragOverTargetRef = useRef(false);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const countdownRef = useRef<number | null>(null);
  const bombTimerRef = useRef<number | null>(null);
  const flowerTimerRef = useRef<number | null>(null);
  const targetPushTimerRef = useRef<number | null>(null);
  const playerWalkTimerRef = useRef<number | null>(null);
  const targetWalkTimerRef = useRef<number | null>(null);
  const heldMoveTimerRef = useRef<number | null>(null);
  const heldKeyRef = useRef<string | null>(null);
  const utilityRuneCooldownUntilRef = useRef(0);
  const bombCooldownUntilRef = useRef(0);
  const magicWallCooldownUntilRef = useRef(0);
  const playerBombCooldownUntilRef = useRef(0);
  const targetPushCooldownUntilRef = useRef(0);
  const targetRef = useRef<Pos>(START_TARGET);
  const playerRef = useRef<Pos>(START_PLAYER);
  const dragPayloadRef = useRef<DragPayload>(null);
  const dragSourceRef = useRef<Pos | null>(null);
  const targetReturnRef = useRef<Pos | null>(null);
  const magicWallTimeoutsRef = useRef<Map<string, number>>(new Map());
  const bombTimeoutsRef = useRef<Map<string, number>>(new Map());
  const magicWallsRef = useRef<Set<string>>(new Set());
  const bombsRef = useRef<Set<string>>(new Set());
  const flowersRef = useRef<Set<string>>(new Set());

  const [selectedModeId, setSelectedModeId] = useState<TrainingModeId>(initialScenario.modeId);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(initialScenario.id);
  const [obstacles, setObstacles] = useState<Set<string>>(() => new Set((initialScenario.obstacles ?? []).map((pos) => keyOf(pos.x, pos.y))));
  const [player, setPlayer] = useState<Pos>(initialScenario.player);
  const [target, setTarget] = useState<Pos>(initialScenario.target);
  const [bombs, setBombs] = useState<Set<string>>(() => centeredBombArea(initialScenario.target));
  const [flowers, setFlowers] = useState<Set<string>>(() => new Set([keyOf(initialScenario.flower.x, initialScenario.flower.y)]));
  const [magicWalls, setMagicWalls] = useState<Set<string>>(new Set());
  const [dragging, setDragging] = useState(false);
  const [dragPayload, setDragPayload] = useState<DragPayload>(null);
  const [dragSource, setDragSource] = useState<Pos | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState(false);
  const [hoverTile, setHoverTile] = useState<Pos | null>(null);
  const [pushDestination, setPushDestination] = useState<Pos | null>(null);
  const [pushProgress, setPushProgress] = useState(0);
  const [pushState, setPushState] = useState<PushState>("ready");
  const [message, setMessage] = useState("Clique e arraste o TARGET para um SQM ao redor dele.");
  const [, setNextBombIn] = useState(0);
  const [, setNextFlowerIn] = useState(0);
  const [, setNextTargetPushIn] = useState(0);
  const [, setDestroyReady] = useState(true);
  const [, setBombReady] = useState(true);
  const [, setDisintegrateReady] = useState(true);
  const [, setMagicWallReady] = useState(true);
  const [, setTargetPushReady] = useState(true);
  const [, setPlayerBombReady] = useState(true);
  const [, setPlayerAutoWalkPath] = useState<Pos[]>([]);
  const [, setTargetAutoWalkPath] = useState<Pos[]>([]);
  const [lastTargetOrigin, setLastTargetOrigin] = useState<Pos | null>(null);
  const [isSpawnPaused, setIsSpawnPaused] = useState(false);
  const [followWindowStart, setFollowWindowStart] = useState<number | null>(null);
  const [followWindowNow, setFollowWindowNow] = useState<number | null>(null);
  const [followActionAt, setFollowActionAt] = useState<number | null>(null);
  const [bombPopKeys, setBombPopKeys] = useState<Set<string>>(new Set());
  const [, setAttempts] = useState(0);
  const [, setSuccessfulPushes] = useState(0);
  const [, setBestFollowMs] = useState<number | null>(null);
  const [hotkeyBindings, setHotkeyBindings] = useState<HotkeyBindings>(() => loadHotkeyBindings());
  const [rebindingAction, setRebindingAction] = useState<HotkeyActionId | null>(null);
  const [isPauseMenuOpen, setIsPauseMenuOpen] = useState(false);

  const dragCursor = `url("data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'>
      <circle cx='16' cy='16' r='12' fill='%23f59e0b' stroke='%23ffffff' stroke-width='2'/>
      <path d='M10 16h12M16 10v12' stroke='%230a0a0a' stroke-width='2.5' stroke-linecap='round'/>
      <path d='M22.5 22.5 29 29' stroke='%23ffffff' stroke-width='3' stroke-linecap='round'/>
    </svg>`
  )}") 16 16, grabbing`;

  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    magicWallsRef.current = magicWalls;
  }, [magicWalls]);

  useEffect(() => {
    bombsRef.current = bombs;
  }, [bombs]);

  useEffect(() => {
    flowersRef.current = flowers;
  }, [flowers]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(HOTKEY_STORAGE_KEY, JSON.stringify(hotkeyBindings));
  }, [hotkeyBindings]);

  const selectedScenario = useMemo<TrainingScenario>(() => getScenarioById(selectedScenarioId), [selectedScenarioId]);
  const selectedMode = useMemo(() => getTrainingMode(selectedModeId), [selectedModeId]);
  const availableScenarios = useMemo(() => getScenariosForMode(selectedModeId), [selectedModeId]);

  function makeForbiddenForScenario(scenario: TrainingScenario): Set<string> {
    return new Set<string>([
      keyOf(scenario.player.x, scenario.player.y),
      keyOf(scenario.target.x, scenario.target.y),
      keyOf(scenario.flower.x, scenario.flower.y),
    ]);
  }

  function buildObstacleSetForScenario(scenario: TrainingScenario, current?: Set<string>): Set<string> {
    if (scenario.useRandomObstacles) {
      const forbidden = makeForbiddenForScenario(scenario);
      return current
        ? generateDifferentObstacles(current, getObstacleCountForScenario(scenario), forbidden)
        : generateRandomObstacles(getObstacleCountForScenario(scenario), forbidden);
    }

    return new Set((scenario.obstacles ?? []).map((pos) => keyOf(pos.x, pos.y)));
  }

  const isObstacle = (pos: Pos) => obstacles.has(keyOf(pos.x, pos.y));
  const isMagicWall = (pos: Pos) => magicWallsRef.current.has(keyOf(pos.x, pos.y));
  const isBlocked = (pos: Pos) => isObstacle(pos) || isMagicWall(pos);

  const validPushTiles = useMemo(() => {
    if (dragPayload === "flower") {
      const allTiles: Pos[] = [];
      for (let y = 0; y < GRID_H; y += 1) {
        for (let x = 0; x < GRID_W; x += 1) {
          if (dragSource && dragSource.x === x && dragSource.y === y) continue;
          const pos = { x, y };
          if (obstacles.has(keyOf(x, y)) || magicWalls.has(keyOf(x, y))) continue;
          allTiles.push(pos);
        }
      }
      return allTiles;
    }

    return adjacent8(target).filter((pos) => !obstacles.has(keyOf(pos.x, pos.y)) && !magicWalls.has(keyOf(pos.x, pos.y)));
  }, [dragPayload, dragSource, target, obstacles, magicWalls]);

  const validPushKeySet = useMemo(() => new Set(validPushTiles.map((pos) => keyOf(pos.x, pos.y))), [validPushTiles]);

  function isAdjacentToPlayer(tile: Pos | null): boolean {
    if (!tile) return false;
    return Math.max(Math.abs(tile.x - playerRef.current.x), Math.abs(tile.y - playerRef.current.y)) === 1;
  }

  function isAdjacentToTarget(tile: Pos | null): boolean {
    if (!tile) return false;
    return Math.max(Math.abs(tile.x - targetRef.current.x), Math.abs(tile.y - targetRef.current.y)) === 1;
  }

  function hasBomb(pos: Pos): boolean {
    return bombsRef.current.has(keyOf(pos.x, pos.y));
  }

  function hasFlower(pos: Pos): boolean {
    return flowersRef.current.has(keyOf(pos.x, pos.y));
  }

  function isPushProtected(pos: Pos): boolean {
    return hasBomb(pos) || hasFlower(pos);
  }

  function clearPushCountdown(): void {
    if (countdownRef.current != null) {
      window.clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setPushProgress(0);
  }

  function clearPlayerAutoWalk(): void {
    if (playerWalkTimerRef.current != null) {
      window.clearInterval(playerWalkTimerRef.current);
      playerWalkTimerRef.current = null;
    }
    setPlayerAutoWalkPath([]);
  }

  function clearTargetAutoWalk(): void {
    if (targetWalkTimerRef.current != null) {
      window.clearInterval(targetWalkTimerRef.current);
      targetWalkTimerRef.current = null;
    }
    targetReturnRef.current = null;
    setTargetAutoWalkPath([]);
  }

  function clearMagicWallTimers(): void {
    for (const timeoutId of magicWallTimeoutsRef.current.values()) window.clearTimeout(timeoutId);
    magicWallTimeoutsRef.current.clear();
  }

  function clearBombTimers(): void {
    for (const timeoutId of bombTimeoutsRef.current.values()) window.clearTimeout(timeoutId);
    bombTimeoutsRef.current.clear();
  }

  function addBombsWithExpiration(keys: string[]): void {
    setBombs((prev) => {
      const next = new Set(prev);
      for (const bombKey of keys) next.add(bombKey);
      return next;
    });

    for (const bombKey of keys) {
      const existingTimeout = bombTimeoutsRef.current.get(bombKey);
      if (existingTimeout != null) window.clearTimeout(existingTimeout);

      const timeoutId = window.setTimeout(() => {
        setBombs((prev) => {
          const next = new Set(prev);
          next.delete(bombKey);
          return next;
        });
        bombTimeoutsRef.current.delete(bombKey);
      }, randomBombDuration());

      bombTimeoutsRef.current.set(bombKey, timeoutId);
    }
  }

  function stopHeldMove(): void {
    if (heldMoveTimerRef.current != null) {
      window.clearInterval(heldMoveTimerRef.current);
      heldMoveTimerRef.current = null;
    }
    heldKeyRef.current = null;
  }

  function blockedKeysSnapshot(extraBlocked: Pos[] = []): Set<string> {
    const out = new Set<string>([...obstacles, ...magicWallsRef.current]);
    for (const pos of extraBlocked) out.add(keyOf(pos.x, pos.y));
    return out;
  }

  function placeMagicWall(pos: Pos): number {
    const wallKey = keyOf(pos.x, pos.y);
    const duration = randomMagicWallDuration();
    const existingTimeout = magicWallTimeoutsRef.current.get(wallKey);

    if (existingTimeout != null) window.clearTimeout(existingTimeout);

    setMagicWalls((prev) => {
      const next = new Set(prev);
      next.add(wallKey);
      return next;
    });

    const timeoutId = window.setTimeout(() => {
      setMagicWalls((prev) => {
        const next = new Set(prev);
        next.delete(wallKey);
        return next;
      });
      magicWallTimeoutsRef.current.delete(wallKey);
    }, duration);

    magicWallTimeoutsRef.current.set(wallKey, timeoutId);
    return duration;
  }

  function cancelPush(reason = "Push cancelado."): void {
    if (pushState === "charging") {
      clearPushCountdown();
      setPushState("canceled");
      setMessage(reason);
      window.setTimeout(() => setPushState("ready"), 120);
    }
  }

  function scheduleTargetReturn(origin: Pos, pushedTo: Pos): void {
    clearTargetAutoWalk();
    targetReturnRef.current = origin;
    setLastTargetOrigin(origin);
    setTargetAutoWalkPath(buildStraightPath(pushedTo, origin, blockedKeysSnapshot()));

    window.setTimeout(() => {
      targetWalkTimerRef.current = window.setInterval(() => {
        setTarget((prev) => {
          const returnTo = targetReturnRef.current || prev;
          const nextPath = buildStraightPath(prev, returnTo, blockedKeysSnapshot());
          if (!nextPath.length) {
            clearTargetAutoWalk();
            return prev;
          }

          const nextStep = nextPath[0];
          if (isBlocked(nextStep)) {
            clearTargetAutoWalk();
            setMessage("Target nao conseguiu voltar: bloqueio no caminho.");
            return prev;
          }
          if (samePos(nextStep, playerRef.current)) {
            clearTargetAutoWalk();
            setMessage("Target tentou voltar, mas voce ganhou o SQM.");
            return prev;
          }

          setTargetAutoWalkPath(nextPath.slice(1));
          targetRef.current = nextStep;
          return nextStep;
        });
      }, WALK_STEP_MS);
    }, TARGET_RETURN_DELAY_MS);
  }

  function markFollowAction(): void {
    if (!followWindowStart || followActionAt != null) return;
    const now = Date.now();
    setFollowActionAt(now);
    setFollowWindowNow(now);
  }

  function startPlayerAutoWalk(destination: Pos): void {
    stopHeldMove();
    clearPlayerAutoWalk();

    if (isBlocked(destination)) {
      setMessage("Auto-walk bloqueado: esse SQM esta bloqueado.");
      return;
    }

    const path = buildStraightPath(playerRef.current, destination, blockedKeysSnapshot([targetRef.current])).filter(
      (step) => !samePos(step, targetRef.current)
    );

    if (!path.length) return;

    markFollowAction();
    setPlayerAutoWalkPath(path);

    playerWalkTimerRef.current = window.setInterval(() => {
      setPlayer((prev) => {
        const freshPath = buildStraightPath(prev, destination, blockedKeysSnapshot([targetRef.current])).filter(
          (step) => !samePos(step, targetRef.current)
        );
        if (!freshPath.length) {
          clearPlayerAutoWalk();
          return prev;
        }

        const nextStep = freshPath[0];
        if (isBlocked(nextStep)) {
          clearPlayerAutoWalk();
          setMessage("Auto-walk bloqueado por obstaculo.");
          return prev;
        }
        if (samePos(nextStep, targetRef.current)) {
          clearPlayerAutoWalk();
          setMessage("Auto-walk bloqueado: SQM ocupado pelo target.");
          return prev;
        }

        setPlayerAutoWalkPath(freshPath.slice(1));
        playerRef.current = nextStep;
        return nextStep;
      });
    }, WALK_STEP_MS);
  }

  function scheduleNextBomb(): void {
    if (isSpawnPaused) {
      setNextBombIn(0);
      return;
    }

    if (bombTimerRef.current != null) window.clearInterval(bombTimerRef.current);
    const startedAt = Date.now();
    const delay = randomBombDelay();
    setNextBombIn(delay);

    bombTimerRef.current = window.setInterval(() => {
      const remaining = Math.max(0, delay - (Date.now() - startedAt));
      setNextBombIn(remaining);
      if (remaining > 0) return;

      if (bombTimerRef.current != null) {
        window.clearInterval(bombTimerRef.current);
        bombTimerRef.current = null;
      }

      if (Date.now() < bombCooldownUntilRef.current) {
        scheduleNextBomb();
        return;
      }

      bombCooldownUntilRef.current = Date.now() + BOMB_COOLDOWN_MS;
      const freshBombs = Array.from(centeredBombArea(targetRef.current)).filter(
        (posKey) => !obstacles.has(posKey) && !magicWallsRef.current.has(posKey)
      );
      addBombsWithExpiration(freshBombs);
      setBombPopKeys(new Set(freshBombs));
      window.setTimeout(() => setBombPopKeys(new Set()), 260);
      setMessage("Target usou Bomb Rune.");
      scheduleNextBomb();
    }, 100);
  }

  function scheduleNextFlower(): void {
    if (isSpawnPaused) {
      setNextFlowerIn(0);
      return;
    }

    if (flowerTimerRef.current != null) window.clearInterval(flowerTimerRef.current);
    const startedAt = Date.now();
    const delay = randomFlowerDelay();
    setNextFlowerIn(delay);

    flowerTimerRef.current = window.setInterval(() => {
      const remaining = Math.max(0, delay - (Date.now() - startedAt));
      setNextFlowerIn(remaining);
      if (remaining > 0) return;

      if (flowerTimerRef.current != null) {
        window.clearInterval(flowerTimerRef.current);
        flowerTimerRef.current = null;
      }

      const candidates = [targetRef.current, ...adjacent8(targetRef.current)].filter((pos) => !isBlocked(pos));
      const chosen = candidates[Math.floor(Math.random() * candidates.length)] || targetRef.current;
      setFlowers((prev) => {
        const next = new Set(prev);
        next.add(keyOf(chosen.x, chosen.y));
        return next;
      });
      setMessage(`Target jogou flower em ${chosen.x},${chosen.y}.`);
      scheduleNextFlower();
    }, 100);
  }

  function attemptTargetPush(): void {
    if (!isAdjacentToTarget(playerRef.current)) return;

    const destinations = adjacent8(playerRef.current).filter((pos) => {
      if (samePos(pos, playerRef.current) || samePos(pos, targetRef.current)) return false;
      if (isBlocked(pos)) return false;
      if (isPushProtected(pos)) return false;
      return true;
    });

    if (!destinations.length) {
      setMessage("Seu stack de bomb e flower negou o push do target.");
      return;
    }

    const chosen = destinations[Math.floor(Math.random() * destinations.length)] ?? destinations[0];
    clearPlayerAutoWalk();
    cancelPush("Push cancelado: o target te deu push.");
    playerRef.current = chosen;
    setPlayer(chosen);
    setMessage(`Target te deu push para ${chosen.x},${chosen.y}.`);
  }

  function scheduleNextTargetPush(): void {
    if (isSpawnPaused) {
      setNextTargetPushIn(0);
      return;
    }

    if (targetPushTimerRef.current != null) window.clearInterval(targetPushTimerRef.current);
    const startedAt = Date.now();
    const delay = randomTargetPushDelay();
    setNextTargetPushIn(delay);

    targetPushTimerRef.current = window.setInterval(() => {
      const remaining = Math.max(0, delay - (Date.now() - startedAt));
      setNextTargetPushIn(remaining);
      if (remaining > 0) return;

      if (targetPushTimerRef.current != null) {
        window.clearInterval(targetPushTimerRef.current);
        targetPushTimerRef.current = null;
      }

      if (Date.now() < targetPushCooldownUntilRef.current) {
        scheduleNextTargetPush();
        return;
      }

      targetPushCooldownUntilRef.current = Date.now() + TARGET_PUSH_COOLDOWN_MS;
      attemptTargetPush();
      scheduleNextTargetPush();
    }, 100);
  }

  useEffect(() => {
    if (isSpawnPaused) {
      if (bombTimerRef.current != null) window.clearInterval(bombTimerRef.current);
      if (flowerTimerRef.current != null) window.clearInterval(flowerTimerRef.current);
      if (targetPushTimerRef.current != null) window.clearInterval(targetPushTimerRef.current);
      bombTimerRef.current = null;
      flowerTimerRef.current = null;
      targetPushTimerRef.current = null;
      setNextBombIn(0);
      setNextFlowerIn(0);
      setNextTargetPushIn(0);
    } else {
      scheduleNextBomb();
      scheduleNextFlower();
      scheduleNextTargetPush();
    }

    return () => {
      if (bombTimerRef.current != null) window.clearInterval(bombTimerRef.current);
      if (flowerTimerRef.current != null) window.clearInterval(flowerTimerRef.current);
      if (targetPushTimerRef.current != null) window.clearInterval(targetPushTimerRef.current);
      if (countdownRef.current != null) window.clearInterval(countdownRef.current);
    };
  }, [isSpawnPaused, obstacles, magicWalls]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (followWindowStart && followActionAt == null) {
        const now = Date.now();
        if (now - followWindowStart >= FOLLOW_WINDOW_MS) {
          setFollowWindowNow(followWindowStart + FOLLOW_WINDOW_MS);
          setFollowActionAt(followWindowStart + FOLLOW_WINDOW_MS);
        } else {
          setFollowWindowNow(now);
        }
      }

      const now = Date.now();
      setDestroyReady(now >= utilityRuneCooldownUntilRef.current);
      setBombReady(now >= bombCooldownUntilRef.current);
      setDisintegrateReady(now >= utilityRuneCooldownUntilRef.current);
      setMagicWallReady(now >= magicWallCooldownUntilRef.current);
      setTargetPushReady(now >= targetPushCooldownUntilRef.current);
      setPlayerBombReady(now >= playerBombCooldownUntilRef.current);
    }, 140);

    return () => window.clearInterval(timer);
  }, [followWindowStart, followActionAt]);

  useEffect(() => {
    const previousCursor = document.body.style.cursor;
    document.body.style.cursor = dragging ? dragCursor : previousCursor || "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [dragging, dragCursor]);

  const followReference = followActionAt ?? followWindowNow;
  const followElapsed = followWindowStart && followReference ? Math.max(0, followReference - followWindowStart) : null;
  const followProgress = followElapsed != null ? Math.min(1, followElapsed / FOLLOW_WINDOW_MS) : 0;
  const followLabel =
    followElapsed == null ? "-" : followElapsed < FOLLOW_GOOD_START_MS ? "cedo" : followElapsed <= FOLLOW_GOOD_END_MS ? "timing bom" : "tarde";
  const followLocked = !!followWindowStart && followActionAt != null;

  useEffect(() => {
    if (followElapsed == null || !followLocked) return;
    setBestFollowMs((prev) => (prev == null ? followElapsed : Math.min(prev, followElapsed)));
  }, [followElapsed, followLocked]);

  useEffect(() => {
    if (availableScenarios.some((scenario) => scenario.id === selectedScenarioId)) return;
    setSelectedScenarioId(availableScenarios[0]?.id ?? DEFAULT_SCENARIO_ID);
  }, [availableScenarios, selectedScenarioId]);

  function startHeldMove(key: string): void {
    if (!DIRS[key]) return;
    if (heldKeyRef.current === key && heldMoveTimerRef.current != null) return;
    stopHeldMove();
    heldKeyRef.current = key;
    tryMove(key);
    heldMoveTimerRef.current = window.setInterval(() => tryMove(key), WALK_STEP_MS);
  }

  function tryMove(key: string): void {
    clearPlayerAutoWalk();
    const dir = DIRS[key.toLowerCase()];
    if (!dir) return;

    const current = playerRef.current;
    const next = { x: clamp(current.x + dir[0], 0, GRID_W - 1), y: clamp(current.y + dir[1], 0, GRID_H - 1) };
    if (samePos(next, current) || samePos(next, targetRef.current) || isBlocked(next)) return;

    markFollowAction();
    cancelPush("Push cancelado: voce fez uma acao durante o delay.");
    playerRef.current = next;
    setPlayer(next);
  }

  function castPlayerBomb(): void {
    cancelPush("Push cancelado: voce fez uma acao durante o delay.");
    if (!hoverTile) return void setMessage("Passe o mouse em um SQM para usar sua Bomb Rune.");
    if (Date.now() < playerBombCooldownUntilRef.current) return void setMessage("Sua Bomb Rune esta em cooldown.");

    playerBombCooldownUntilRef.current = Date.now() + PLAYER_BOMB_COOLDOWN_MS;
    const bombKeys = Array.from(centeredBombArea(hoverTile)).filter((posKey) => !obstacles.has(posKey) && !magicWallsRef.current.has(posKey));
    addBombsWithExpiration(bombKeys);
    setBombPopKeys(new Set(bombKeys));
    window.setTimeout(() => setBombPopKeys(new Set()), 260);
    setMessage(`Voce usou Bomb Rune em ${hoverTile.x},${hoverTile.y}.`);
  }

  function startRebinding(actionId: HotkeyActionId): void {
    setRebindingAction(actionId);
    setMessage(`Pressione a nova tecla para ${actionId}.`);
  }

  function clearBinding(actionId: HotkeyActionId): void {
    setHotkeyBindings((prev) => ({ ...prev, [actionId]: null }));
    setMessage("Hotkey removida.");
  }

  function resetHotkeysToDefault(): void {
    setHotkeyBindings(DEFAULT_HOTKEY_BINDINGS);
    setRebindingAction(null);
    setMessage("Hotkeys restauradas para o padrao.");
  }

  useEffect(() => {
    const moveActionToDir: Partial<Record<HotkeyActionId, string>> = {
      move_nw: "q",
      move_n: "w",
      move_ne: "e",
      move_w: "a",
      move_e: "d",
      move_sw: "z",
      move_s: "s",
      move_se: "c",
    };

    function onKeyDown(event: KeyboardEvent): void {
      if (event.code === "Escape") {
        event.preventDefault();
        if (rebindingAction) {
          setRebindingAction(null);
          setMessage("Reconfiguracao de hotkey cancelada.");
          return;
        }
        setIsPauseMenuOpen((prev) => !prev);
        return;
      }

      if (rebindingAction) {
        event.preventDefault();
        const nextCode = event.code;
        setHotkeyBindings((prev) => {
          const next: HotkeyBindings = { ...prev };
          for (const [actionId, code] of Object.entries(next) as Array<[HotkeyActionId, string | null]>) {
            if (code === nextCode) next[actionId] = null;
          }
          next[rebindingAction] = nextCode;
          return next;
        });
        setRebindingAction(null);
        setMessage(`Hotkey alterada para ${event.code}.`);
        return;
      }

      if (isPauseMenuOpen) return;

      const action = getActionForCode(hotkeyBindings, event.code);
      if (!action) return;

      if (action === "magic_wall") {
        event.preventDefault();
        cancelPush("Push cancelado: voce fez uma acao durante o delay.");
        if (!hoverTile) return void setMessage("Passe o mouse em cima do SQM para usar Magic Wall.");
        if (Date.now() < magicWallCooldownUntilRef.current) return void setMessage("Magic Wall em cooldown de 2 segundos.");
        if (samePos(hoverTile, playerRef.current) || samePos(hoverTile, targetRef.current)) {
          return void setMessage("Nao da para criar Magic Wall em um SQM ocupado por player ou target.");
        }
        if (isObstacle(hoverTile)) return void setMessage("Esse SQM ja e um obstaculo aleatorio.");

        const wallKey = keyOf(hoverTile.x, hoverTile.y);
        magicWallCooldownUntilRef.current = Date.now() + MAGIC_WALL_COOLDOWN_MS;
        const duration = placeMagicWall(hoverTile);

        setBombs((prev) => {
          const next = new Set(prev);
          next.delete(wallKey);
          return next;
        });

        const wallBombTimeout = bombTimeoutsRef.current.get(wallKey);
        if (wallBombTimeout != null) {
          window.clearTimeout(wallBombTimeout);
          bombTimeoutsRef.current.delete(wallKey);
        }

        setFlowers((prev) => {
          const next = new Set(prev);
          next.delete(wallKey);
          return next;
        });

        setMessage(`Magic Wall criada em ${hoverTile.x},${hoverTile.y} por ${(duration / 1000).toFixed(1)}s.`);
        return;
      }

      if (action === "clear_map") {
        event.preventDefault();
        clearMap();
        return;
      }

      const moveDir = moveActionToDir[action];
      if (moveDir) {
        event.preventDefault();
        if (!event.repeat) startHeldMove(moveDir);
        return;
      }

      if (action === "player_bomb") {
        event.preventDefault();
        castPlayerBomb();
        return;
      }

      if (action === "destroy_field") {
        event.preventDefault();
        cancelPush("Push cancelado: voce fez uma acao durante o delay.");
        if (!hoverTile) return void setMessage("Passe o mouse em cima de uma bomb para usar Destroy Field.");
        if (Date.now() < utilityRuneCooldownUntilRef.current) return void setMessage("Destroy Field em cooldown de 2 segundos.");
        const hoveredKey = keyOf(hoverTile.x, hoverTile.y);
        if (!bombs.has(hoveredKey)) return void setMessage("Esse SQM nao tem bomb.");

        utilityRuneCooldownUntilRef.current = Date.now() + SHARED_UTILITY_RUNE_COOLDOWN_MS;
        setBombs((prev) => {
          const next = new Set(prev);
          next.delete(hoveredKey);
          return next;
        });

        const removedBombTimeout = bombTimeoutsRef.current.get(hoveredKey);
        if (removedBombTimeout != null) {
          window.clearTimeout(removedBombTimeout);
          bombTimeoutsRef.current.delete(hoveredKey);
        }

        setMessage(`Bomb destruida em ${hoverTile.x},${hoverTile.y}.`);
        return;
      }

      if (action === "disintegrate") {
        event.preventDefault();
        cancelPush("Push cancelado: voce fez uma acao durante o delay.");
        if (!hoverTile) return void setMessage("Passe o mouse em cima de uma flower para usar Disintegrate.");
        if (!isAdjacentToPlayer(hoverTile)) return void setMessage("Disintegrate so pode ser usada a 1 SQM de distancia do player.");
        if (Date.now() < utilityRuneCooldownUntilRef.current) return void setMessage("Disintegrate em cooldown de 2 segundos.");
        const hoveredKey = keyOf(hoverTile.x, hoverTile.y);
        if (!flowers.has(hoveredKey)) return void setMessage("Esse SQM nao tem flower.");

        utilityRuneCooldownUntilRef.current = Date.now() + SHARED_UTILITY_RUNE_COOLDOWN_MS;
        setFlowers((prev) => {
          const next = new Set(prev);
          next.delete(hoveredKey);
          return next;
        });
        setMessage(`Flower removida em ${hoverTile.x},${hoverTile.y}.`);
      }
    }

    function onKeyUp(event: KeyboardEvent): void {
      const action = getActionForCode(hotkeyBindings, event.code);
      const moveDir = action ? moveActionToDir[action] : null;
      if (moveDir && heldKeyRef.current === moveDir) stopHeldMove();
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [hoverTile, bombs, flowers, pushState, hotkeyBindings, rebindingAction, isPauseMenuOpen]);

  function getTileFromPointer(clientX: number, clientY: number): Pos | null {
    const element = boardRef.current;
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    const x = Math.floor(((clientX - rect.left) / rect.width) * GRID_W);
    const y = Math.floor(((clientY - rect.top) / rect.height) * GRID_H);
    return inBounds(x, y) ? { x, y } : null;
  }

  function setHoverTileIfChanged(next: Pos | null): void {
    if (samePos(hoverTileRef.current, next)) return;
    hoverTileRef.current = next;
    setHoverTile(next);
  }

  function setPushDestinationIfChanged(next: Pos | null): void {
    if (samePos(pushDestinationRef.current, next)) return;
    pushDestinationRef.current = next;
    setPushDestination(next);
  }

  function setDragOverTargetIfChanged(next: boolean): void {
    if (dragOverTargetRef.current === next) return;
    dragOverTargetRef.current = next;
    setDragOverTarget(next);
  }

  function beginDrag(event: React.PointerEvent | PointerEvent, source: Pos | null = targetRef.current, payload: DragPayload = null): void {
    event.preventDefault();
    const resolvedPayload = payload ?? (flowers.has(keyOf(targetRef.current.x, targetRef.current.y)) ? "flower" : "target");

    if (source && isBlocked(source)) return void setMessage("Esse SQM esta bloqueado.");
    if (source && resolvedPayload === "flower" && !isAdjacentToPlayer(source)) {
      return void setMessage("Voce so pode arrastar flowers a 1 SQM de distancia do player.");
    }

    dragPayloadRef.current = resolvedPayload;
    dragSourceRef.current = source;
    setDragPayload(resolvedPayload);
    setDragSource(source);
    setDragging(true);
    setDragOverTargetIfChanged(resolvedPayload === "target" && samePos(source, targetRef.current));
    setPushDestinationIfChanged(null);
    setMessage(
      resolvedPayload === "flower"
        ? source
          ? "Voce pegou uma flower do mapa. Arraste para qualquer SQM livre."
          : "Voce pegou uma flower da backpack. Arraste para o SQM desejado."
        : "Voce pegou o push do target. Arraste para um dos 8 SQMs."
    );
  }

  useEffect(() => {
    function resetDragState(): void {
      dragPayloadRef.current = null;
      dragSourceRef.current = null;
      setDragPayload(null);
      setDragSource(null);
      setPushDestinationIfChanged(null);
    }

    function onMove(event: PointerEvent): void {
      const tile = getTileFromPointer(event.clientX, event.clientY);
      setHoverTileIfChanged(tile);
      setDragOverTargetIfChanged(!!tile && samePos(tile, targetRef.current));

      if (!dragging) return;
      if (!tile) return void setPushDestinationIfChanged(null);
      setPushDestinationIfChanged(validPushKeySet.has(keyOf(tile.x, tile.y)) ? tile : null);
    }

    function onUp(): void {
      if (!dragging) return;
      setDragging(false);
      setDragOverTargetIfChanged(false);

      const finalDestination = pushDestinationRef.current;
      if (!finalDestination) {
        setMessage(dragPayloadRef.current === "flower" ? "Arraste a flower para um SQM valido do mapa." : "Push invalido: escolha um SQM adjacente ao alvo.");
        resetDragState();
        return;
      }

      const destKey = keyOf(finalDestination.x, finalDestination.y);
      if (dragPayloadRef.current === "flower") {
        const source = dragSourceRef.current;

        clearPushCountdown();
        setFlowers((prev) => {
          const next = new Set(prev);
          if (source) next.delete(keyOf(source.x, source.y));
          next.add(destKey);
          return next;
        });
        setPushState("ready");
        resetDragState();
        setMessage(
          source
            ? `Flower arrastada instantaneamente para ${finalDestination.x},${finalDestination.y}.`
            : `Voce jogou uma flower da backpack em ${finalDestination.x},${finalDestination.y}.`
        );
        return;
      }

      if (isBlocked(finalDestination)) {
        setMessage("Esse SQM destino esta bloqueado.");
        resetDragState();
        return;
      }
      if (bombs.has(destKey)) {
        setMessage("Esse SQM destino tem bomb. Destrua antes com Destroy Field.");
        resetDragState();
        return;
      }
      if (flowers.has(destKey)) {
        setMessage("Esse SQM destino tem flower. Remova antes com Disintegrate.");
        resetDragState();
        return;
      }

      setPushState("charging");
      setAttempts((prev) => prev + 1);
      setMessage("Carregando push... qualquer acao cancela.");
      const startedAt = Date.now();
      clearPushCountdown();

      countdownRef.current = window.setInterval(() => {
        const progress = Math.min(1, (Date.now() - startedAt) / PUSH_DELAY_MS);
        setPushProgress(progress);
        if (progress < 1) return;

        clearPushCountdown();
        const originBeforePush = targetRef.current;
        setTarget(finalDestination);
        targetRef.current = finalDestination;
        scheduleTargetReturn(originBeforePush, finalDestination);
        setFollowWindowStart(Date.now());
        setFollowWindowNow(Date.now());
        setFollowActionAt(null);
        setSuccessfulPushes((prev) => prev + 1);
        setMessage(`Push executado para ${finalDestination.x},${finalDestination.y}. Target vai tentar voltar.`);
        setPushState("ready");
        resetDragState();
      }, 16);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging, validPushKeySet, bombs, flowers]);

  function clearMap(): void {
    clearBombTimers();
    setBombs(new Set());
    setFlowers(new Set());
    setMessage("Mapa limpo: bombs e flowers removidas.");
  }

  function resetTrainingStats(): void {
    setAttempts(0);
    setSuccessfulPushes(0);
    setBestFollowMs(null);
  }

  function resetAll(scenario: TrainingScenario = selectedScenario, options?: { keepStats?: boolean }): void {
    const newObstacles = buildObstacleSetForScenario(scenario, obstacles);

    clearPushCountdown();
    stopHeldMove();
    clearPlayerAutoWalk();
    clearTargetAutoWalk();
    clearMagicWallTimers();
    clearBombTimers();
    targetRef.current = scenario.target;
    playerRef.current = scenario.player;
    utilityRuneCooldownUntilRef.current = 0;
    bombCooldownUntilRef.current = 0;
    magicWallCooldownUntilRef.current = 0;
    playerBombCooldownUntilRef.current = 0;
    targetPushCooldownUntilRef.current = 0;
    dragPayloadRef.current = null;
    dragSourceRef.current = null;

    setObstacles(newObstacles);
    setPlayer(scenario.player);
    setTarget(scenario.target);
    setBombs(new Set());
    addBombsWithExpiration(Array.from(centeredBombArea(scenario.target)));
    setFlowers(new Set([keyOf(scenario.flower.x, scenario.flower.y)]));
    setMagicWalls(new Set());
    setDragging(false);
    setDragOverTarget(false);
    hoverTileRef.current = null;
    pushDestinationRef.current = null;
    dragOverTargetRef.current = false;
    setHoverTile(null);
    setPushDestination(null);
    setPushProgress(0);
    setPushState("ready");
    setMessage("Posicoes resetadas.");
    setDragPayload(null);
    setDragSource(null);
    setPlayerAutoWalkPath([]);
    setTargetAutoWalkPath([]);
    setLastTargetOrigin(null);
    setFollowWindowStart(null);
    setFollowWindowNow(null);
    setFollowActionAt(null);
    setBombPopKeys(new Set());
    setNextTargetPushIn(0);
    setIsSpawnPaused(!!scenario.pauseSpawnsByDefault);
    if (!options?.keepStats) resetTrainingStats();
    scheduleNextBomb();
    scheduleNextFlower();
    scheduleNextTargetPush();
    setMessage(`${scenario.name}: pronto para treinar.`);
  }

  function applyScenario(scenarioId: string): void {
    const nextScenario = getScenarioById(scenarioId);
    setSelectedModeId(nextScenario.modeId);
    setSelectedScenarioId(nextScenario.id);
    resetAll(nextScenario);
  }

  function applyMode(modeId: TrainingModeId): void {
    const nextScenario = getScenariosForMode(modeId)[0] ?? getScenarioById(DEFAULT_SCENARIO_ID);
    setSelectedModeId(modeId);
    setSelectedScenarioId(nextScenario.id);
    resetAll(nextScenario);
  }

  useEffect(() => {
    return () => {
      clearPushCountdown();
      stopHeldMove();
      clearPlayerAutoWalk();
      clearTargetAutoWalk();
      clearMagicWallTimers();
      clearBombTimers();
      if (targetPushTimerRef.current != null) window.clearInterval(targetPushTimerRef.current);
    };
  }, []);

  const tilePctX = 100 / GRID_W;
  const tilePctY = 100 / GRID_H;
  const playerStyle = {
    left: `calc(${player.x * tilePctX}% + 6px)`,
    top: `calc(${player.y * tilePctY}% + 6px)`,
    width: `calc(${tilePctX}% - 12px)`,
    height: `calc(${tilePctY}% - 12px)`,
  };
  const targetStyle = {
    left: `calc(${target.x * tilePctX}% + 6px)`,
    top: `calc(${target.y * tilePctY}% + 6px)`,
    width: `calc(${tilePctX}% - 12px)`,
    height: `calc(${tilePctY}% - 12px)`,
  };

  return (
    <div
      className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_#38432a,_#161a12_35%,_#090909_70%)] text-neutral-100 p-6 md:p-10"
      style={{ imageRendering: "pixelated", scrollbarGutter: "stable both-edges" }}
    >
      {isPauseMenuOpen && (
        <PauseMenu
          selectedModeId={selectedModeId}
          selectedScenarioId={selectedScenarioId}
          availableScenarios={availableScenarios}
          trainingModes={TRAINING_MODES}
          selectedModeName={selectedMode.name}
          selectedModeDescription={selectedMode.description}
          selectedModeFocus={selectedMode.focus}
          selectedScenarioGoal={selectedScenario.goal}
          hotkeyBindings={hotkeyBindings}
          rebindingAction={rebindingAction}
          onSelectMode={applyMode}
          onSelectScenario={applyScenario}
          onResetScenario={() => resetAll()}
          onStartRebinding={startRebinding}
          onClearBinding={clearBinding}
          onResetHotkeys={resetHotkeysToDefault}
          onClose={() => setIsPauseMenuOpen(false)}
        />
      )}
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-amber-100 [text-shadow:0_2px_0_rgba(0,0,0,0.7),0_0_16px_rgba(255,214,102,0.18)]">
            Simulador de Push - Tibia
          </h1>
          <p className="text-neutral-400 mt-2">
            Arraste o target e use as runas como no treino. Pressione <b>ESC</b> para abrir o menu de pausa.
          </p>
        </div>
        <FlowerBackpack onPointerDown={(event) => beginDrag(event, null, "flower")} />
        <div>
            <div className="flex items-center gap-3 text-sm mb-3 flex-wrap">
              <kbd className="px-2 py-1 rounded border border-neutral-700 bg-neutral-900">{formatHotkey(hotkeyBindings.move_nw)} {formatHotkey(hotkeyBindings.move_n)} {formatHotkey(hotkeyBindings.move_ne)}</kbd>
              <kbd className="px-2 py-1 rounded border border-neutral-700 bg-neutral-900">{formatHotkey(hotkeyBindings.move_w)} / {formatHotkey(hotkeyBindings.move_e)}</kbd>
              <kbd className="px-2 py-1 rounded border border-neutral-700 bg-neutral-900">{formatHotkey(hotkeyBindings.move_sw)} {formatHotkey(hotkeyBindings.move_s)} {formatHotkey(hotkeyBindings.move_se)}</kbd>
              <span className="text-neutral-400">mover</span>
              <kbd className="px-2 py-1 rounded border border-neutral-700 bg-neutral-900">drag</kbd>
              <span className="text-neutral-400">push</span>
              <kbd className="px-2 py-1 rounded border border-neutral-700 bg-neutral-900">{formatHotkey(hotkeyBindings.player_bomb)}</kbd>
              <span className="text-neutral-400">bomb rune</span>
              <kbd className="px-2 py-1 rounded border border-neutral-700 bg-neutral-900">{formatHotkey(hotkeyBindings.destroy_field)}</kbd>
              <span className="text-neutral-400">destroy field</span>
              <kbd className="px-2 py-1 rounded border border-neutral-700 bg-neutral-900">{formatHotkey(hotkeyBindings.disintegrate)}</kbd>
              <span className="text-neutral-400">disintegrate</span>
              <kbd className="px-2 py-1 rounded border border-neutral-700 bg-neutral-900">{formatHotkey(hotkeyBindings.magic_wall)}</kbd>
              <span className="text-neutral-400">magic wall</span>
              <kbd className="px-2 py-1 rounded border border-neutral-700 bg-neutral-900">{formatHotkey(hotkeyBindings.clear_map)}</kbd>
              <span className="text-neutral-400">limpar mapa</span>
            </div>

            <div
              ref={boardRef}
              className="relative grid gap-[1px] bg-[linear-gradient(180deg,rgba(255,244,200,0.08),rgba(255,255,255,0)),linear-gradient(135deg,#3c2f1a,#17120b)] p-[8px] rounded-[18px] select-none touch-none mx-auto w-full max-w-[720px] border border-amber-900/60 shadow-[0_20px_60px_rgba(0,0,0,0.45),inset_0_0_20px_rgba(255,214,102,0.06)]"
              style={{ gridTemplateColumns: `repeat(${GRID_W}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: GRID_H }).flatMap((_, y) =>
                Array.from({ length: GRID_W }).map((__, x) => (
                  <MemoBoardTile
                    key={keyOf(x, y)}
                    x={x}
                    y={y}
                    player={player}
                    target={target}
                    hoverTile={hoverTile}
                    pushDestination={pushDestination}
                    validPushKeySet={validPushKeySet}
                    bombs={bombs}
                    flowers={flowers}
                    magicWalls={magicWalls}
                    obstacles={obstacles}
                    lastTargetOrigin={lastTargetOrigin}
                    bombPopKeys={bombPopKeys}
                    onTileClick={startPlayerAutoWalk}
                    onFlowerPointerDown={beginDrag}
                  />
                ))
              )}

              <div className="absolute inset-[6px] pointer-events-none">
                <motion.div
                  className="absolute rounded-[4px] bg-[linear-gradient(180deg,#5bc4ff,#2563eb)] border border-white/70 flex items-center justify-center text-[11px] font-black shadow-[0_8px_16px_rgba(37,99,235,0.28),inset_0_1px_0_rgba(255,255,255,0.32)] z-30 [text-shadow:0_1px_0_rgba(0,0,0,0.6)]"
                  style={playerStyle}
                  animate={playerStyle}
                  transition={{ duration: 0.09, ease: "linear" }}
                >
                  KNT
                </motion.div>

                <motion.div
                  onPointerDown={(event) =>
                    beginDrag(event, { x: target.x, y: target.y }, flowers.has(keyOf(target.x, target.y)) ? "flower" : "target")
                  }
                  className={`absolute pointer-events-auto rounded-[4px] bg-[linear-gradient(180deg,#ff8c8c,#dc2626)] border border-white/70 flex items-center justify-center text-[11px] font-black shadow-[0_8px_16px_rgba(220,38,38,0.22),inset_0_1px_0_rgba(255,255,255,0.24)] transition-all duration-100 z-30 [text-shadow:0_1px_0_rgba(0,0,0,0.6)] ${dragging ? "cursor-none scale-95 ring-2 ring-amber-300 shadow-[0_0_20px_rgba(252,211,77,0.45)]" : dragOverTarget ? "cursor-grab ring-2 ring-white/70 shadow-[0_0_14px_rgba(255,255,255,0.18)]" : "cursor-grab"}`}
                  style={targetStyle}
                  animate={targetStyle}
                  transition={{ duration: 0.14, ease: "easeOut" }}
                >
                  {dragging && dragPayload === "target" ? "HOLD" : "MSE"}
                </motion.div>
              </div>
            </div>

            <div className="mt-5 max-w-[720px] mx-auto">
              <div className="h-3 rounded-full border border-neutral-800 overflow-hidden bg-neutral-900">
                <div
                  className={`h-full transition-[width] ${pushState === "charging" ? "bg-amber-400" : pushState === "canceled" ? "bg-red-500" : "bg-neutral-800"}`}
                  style={{ width: `${Math.round(pushProgress * 100)}%` }}
                />
              </div>

              {followWindowStart && (
                <div className="mt-4 mb-3 rounded-xl border border-neutral-800 bg-neutral-900 p-3">
                  <div className="flex items-center justify-between gap-3 text-xs text-neutral-300 mb-2">
                    <span>Janela de timing do follow</span>
                    <span className="font-medium text-neutral-100">{followLocked ? `${followLabel} / travado` : followLabel}</span>
                  </div>
                  <div className="relative h-4 rounded-full overflow-hidden border border-neutral-800 bg-neutral-950">
                    <div className="absolute inset-y-0 left-0 w-[15%] bg-red-500/40" />
                    <div className="absolute inset-y-0 left-[15%] w-[28%] bg-emerald-500/40" />
                    <div className="absolute inset-y-0 left-[43%] right-0 bg-amber-500/30" />
                    <div className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]" style={{ left: `calc(${(followProgress * 100).toFixed(2)}% - 2px)` }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500">
                    <span>cedo</span>
                    <span>bom</span>
                    <span>tarde</span>
                  </div>
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-3 items-center justify-between">
                <p className="text-neutral-300">{message}</p>
                <button onClick={() => setIsSpawnPaused((prev) => !prev)} className="px-4 py-2 rounded-xl border border-neutral-700 bg-neutral-900 hover:bg-neutral-800">
                  {isSpawnPaused ? "Retomar bomb/flower" : "Pausar bomb/flower"}
                </button>
                <button onClick={() => resetAll()} className="px-4 py-2 rounded-xl border border-neutral-700 bg-neutral-900 hover:bg-neutral-800">
                  Resetar posicoes
                </button>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
