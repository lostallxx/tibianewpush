import React from "react";
import { STATUS_ROWS } from "../../simulator/constants";
import type { Pos } from "../../simulator/types";

type SidePanelProps = {
  player: Pos;
  target: Pos;
  playerAutoWalkPath: Pos[];
  targetAutoWalkPath: Pos[];
  followWindowStart: number | null;
  followLabel: string;
  lastTargetOrigin: Pos | null;
  isSpawnPaused: boolean;
  bombReady: boolean;
  nextBombIn: number;
  nextFlowerIn: number;
  destroyReady: boolean;
  disintegrateReady: boolean;
  magicWallReady: boolean;
  magicWalls: Set<string>;
  obstacles: Set<string>;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-neutral-800 pb-2">
      <span className="text-amber-200/55">{label}</span>
      <span className="font-medium text-amber-50 text-right">{value}</span>
    </div>
  );
}

function SidePanel({
  player,
  target,
  playerAutoWalkPath,
  targetAutoWalkPath,
  followWindowStart,
  followLabel,
  lastTargetOrigin,
  isSpawnPaused,
  bombReady,
  nextBombIn,
  nextFlowerIn,
  destroyReady,
  disintegrateReady,
  magicWallReady,
  magicWalls,
  obstacles,
}: SidePanelProps) {
  const rows: Array<[string, string]> = [
    ["Voce", `${player.x},${player.y}`],
    ["Target", `${target.x},${target.y}`],
    ...STATUS_ROWS,
    ["Auto-walk player", playerAutoWalkPath.length ? `${playerAutoWalkPath.length} passos` : "parado"],
    ["Retorno target", targetAutoWalkPath.length ? `${targetAutoWalkPath.length} passos` : "parado"],
    ["Timing follow", followWindowStart ? followLabel : "inativo"],
    ["SQM de retorno", lastTargetOrigin ? `${lastTargetOrigin.x},${lastTargetOrigin.y}` : "—"],
    ["Bomb", isSpawnPaused ? "pausada" : `${bombReady ? "pronta" : "cooldown"} · recast aleatorio: ${(nextBombIn / 1000).toFixed(1)}s`],
    ["Flower", isSpawnPaused ? "pausada" : `recast aleatorio: ${(nextFlowerIn / 1000).toFixed(1)}s`],
    ["Spawns", isSpawnPaused ? "pausados" : "ativos"],
    ["Destroy Field", destroyReady ? "pronto" : "cooldown"],
    ["Disintegrate", disintegrateReady ? "pronta" : "cooldown"],
    ["Magic Wall", magicWallReady ? "pronta" : "cooldown"],
    ["MW ativas", `${magicWalls.size}`],
    ["Obstaculos", `${obstacles.size} aleatorios`],
  ];

  return (
    <div className="rounded-[14px] border border-amber-950/70 bg-[linear-gradient(180deg,rgba(32,24,14,0.92),rgba(18,14,9,0.94))] p-5 lg:sticky lg:top-6 shadow-[0_10px_30px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,220,120,0.05)]">
      <h2 className="font-semibold text-lg mb-3 text-amber-100 [text-shadow:0_1px_0_rgba(0,0,0,0.65)]">Estado atual</h2>
      <div className="space-y-2 text-sm text-neutral-300">
        {rows.map(([label, value]) => (
          <Row key={label} label={label} value={value} />
        ))}
      </div>

      <div className="mt-6">
        <h3 className="font-medium mb-2">Resumo</h3>
        <ul className="text-sm text-neutral-400 space-y-2 list-disc pl-5">
          <li>Push de player leva 1 segundo. Flower move instantaneamente.</li>
          <li>Destroy Field e Disintegrate compartilham o mesmo cooldown de 2 segundos.</li>
          <li>Bomb, flower e Magic Wall possuem recasts proprios.</li>
          <li>Obstaculos e Magic Wall bloqueiam walk, push e retorno.</li>
          <li>R limpa bombs e flowers. Magic Wall permanece.</li>
          <li>O target tenta retomar o SQM original depois do push.</li>
        </ul>
      </div>

      <div className="mt-6">
        <h3 className="font-medium mb-2">Runas</h3>
        <p className="text-sm text-neutral-400">
          <b>F</b> usa Destroy Field em qualquer distancia sobre bombs.
          <br />
          <b>X</b> usa Disintegrate somente a 1 SQM do player para remover flowers.
          <br />
          <b>3</b> cria Magic Wall no SQM do mouse com duracao aleatoria entre 18 e 20 segundos.
        </p>
      </div>

      <div className="mt-6 rounded-xl border border-neutral-800 p-3 bg-neutral-950 text-xs text-neutral-400">
        R limpa bombs e flowers. Clique no mapa para auto-walk.
      </div>
    </div>
  );
}

export const MemoSidePanel = React.memo(SidePanel);
