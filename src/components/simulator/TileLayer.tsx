import React from "react";
import { motion } from "framer-motion";
import type { Pos } from "../../simulator/types";
import { keyOf, samePos } from "../../simulator/utils";

type TileLayerProps = {
  x: number;
  y: number;
  player: Pos;
  target: Pos;
  hoverTile: Pos | null;
  pushDestination: Pos | null;
  validPushKeySet: Set<string>;
  bombs: Set<string>;
  flowers: Set<string>;
  magicWalls: Set<string>;
  obstacles: Set<string>;
  lastTargetOrigin: Pos | null;
  bombPopKeys: Set<string>;
  onTileClick: (pos: Pos) => void;
  onFlowerPointerDown: (e: React.PointerEvent, pos: Pos) => void;
};

function TileLayer({
  x,
  y,
  player,
  target,
  hoverTile,
  pushDestination,
  validPushKeySet,
  bombs,
  flowers,
  magicWalls,
  obstacles,
  lastTargetOrigin,
  bombPopKeys,
  onTileClick,
  onFlowerPointerDown,
}: TileLayerProps) {
  const pos = { x, y };
  const key = keyOf(x, y);
  const isHovered = samePos(hoverTile, pos);
  const isValidPush = validPushKeySet.has(key);
  const isPushDest = samePos(pushDestination, pos);
  const hasBomb = bombs.has(key);
  const hasFlower = flowers.has(key);
  const hasMagicWall = magicWalls.has(key);
  const obstacleHere = obstacles.has(key);
  const isTargetTile = samePos(target, pos);
  const isReturnTile = samePos(lastTargetOrigin, pos);
  const isPlayerTile = samePos(player, pos);
  const shouldPopBomb = bombPopKeys.has(key);

  let className =
    "relative aspect-square rounded-[10px] flex items-center justify-center text-[10px] font-semibold overflow-hidden border border-black/30 transition-all duration-150 ";
  className +=
    "bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.02)),repeating-linear-gradient(135deg,#7c8c52_0px,#7c8c52_6px,#70814b_6px,#70814b_12px)] ";
  if ((x + y) % 2 === 0) className += "brightness-[1.03] ";
  if (hasBomb) {
    className +=
      "bg-[radial-gradient(circle_at_center,rgba(255,170,70,0.30),rgba(255,120,20,0.16)_45%,rgba(120,45,8,0.10)_78%),linear-gradient(180deg,rgba(255,175,80,0.22),rgba(255,95,10,0.10)),linear-gradient(135deg,#7a491f,#4b2b12)] shadow-[inset_0_0_24px_rgba(255,145,35,0.18)] ";
  }
  if (hasFlower) className += "bg-[linear-gradient(180deg,rgba(255,180,220,0.18),rgba(255,120,180,0.08)),linear-gradient(135deg,#6b3552,#48223b)] ";
  if (obstacleHere) {
    className +=
      "bg-[linear-gradient(180deg,rgba(170,170,170,0.20),rgba(70,70,70,0.12)),repeating-linear-gradient(135deg,#6c6c6c_0px,#6c6c6c_5px,#4c4c4c_5px,#4c4c4c_10px)] ring-1 ring-neutral-300/20 ";
  }
  if (hasMagicWall) {
    className +=
      "bg-[linear-gradient(180deg,rgba(120,90,255,0.25),rgba(86,55,220,0.12)),linear-gradient(135deg,#5b3ec7,#32207c)] ring-1 ring-violet-300/30 shadow-[inset_0_0_20px_rgba(139,92,246,0.18)] ";
  }
  if (isValidPush) className += "ring-1 ring-lime-300/45 shadow-[inset_0_0_0_1px_rgba(190,242,100,0.18)] ";
  if (isReturnTile) className += "ring-2 ring-sky-300/70 shadow-[0_0_0_1px_rgba(125,211,252,0.35),inset_0_0_18px_rgba(56,189,248,0.16)] ";
  if (isPushDest) className += "bg-[linear-gradient(180deg,#f9d976,#f39f1f)] text-neutral-950 ring-2 ring-amber-100/80 ";
  if (isHovered) className += "outline outline-2 outline-white/50 z-10 ";

  return (
    <div className={className} onClick={() => onTileClick(pos)}>
      <div className="absolute inset-0 opacity-[0.12] bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.8),transparent_24%),linear-gradient(135deg,transparent,rgba(0,0,0,0.28))]" />
      <span className="absolute top-1 left-1 text-[9px] text-white/28">
        {x},{y}
      </span>

      {isHovered && <div className="absolute inset-[14%] rounded-[8px] border border-white/45 shadow-[0_0_0_1px_rgba(255,255,255,0.14)]" />}
      {isReturnTile && <div className="absolute inset-[20%] rounded-[8px] border border-sky-200/70 animate-pulse" />}

      {obstacleHere && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-6 h-6 rounded-[3px] bg-[repeating-linear-gradient(135deg,#757575_0px,#757575_4px,#5e5e5e_4px,#5e5e5e_8px)] border border-neutral-300/20 shadow-[inset_0_0_10px_rgba(0,0,0,0.35)]" />
        </div>
      )}

      {hasMagicWall && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-7 h-7 rounded-[3px] bg-[repeating-linear-gradient(180deg,rgba(148,92,255,0.95)_0px,rgba(148,92,255,0.95)_3px,rgba(98,55,210,0.95)_3px,rgba(98,55,210,0.95)_6px)] border border-violet-200/30 shadow-[0_0_16px_rgba(139,92,246,0.24),inset_0_0_10px_rgba(255,255,255,0.08)]" />
        </div>
      )}

      {hasBomb && !hasMagicWall && !isTargetTile && !isPlayerTile && (
        <div className={`absolute pointer-events-none z-10 ${hasFlower ? "top-[18%] left-[18%]" : "inset-0 flex items-center justify-center"}`}>
          <motion.span
            className="text-lg leading-none drop-shadow-[0_0_6px_rgba(255,120,20,0.45)]"
            animate={shouldPopBomb ? { scale: [0.6, 1.2, 1] } : { scale: 1 }}
            transition={{ duration: 0.24 }}
          >
            🔥
          </motion.span>
        </div>
      )}

      {hasFlower && !hasMagicWall && !isPlayerTile && !isTargetTile && (
        <button
          type="button"
          onPointerDown={(e) => onFlowerPointerDown(e, pos)}
          className={`absolute z-20 flex items-center justify-center text-lg leading-none ${hasBomb ? "right-[14%] bottom-[12%] w-6 h-6" : "inset-0"}`}
        >
          🌸
        </button>
      )}
    </div>
  );
}

export const MemoTileLayer = React.memo(TileLayer);
