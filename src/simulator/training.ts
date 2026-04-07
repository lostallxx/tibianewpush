import { OBSTACLE_COUNT } from "./constants";
import type { TrainingModeId, TrainingScenario } from "./types";
import type { Pos } from "./types";

type TrainingMode = {
  id: TrainingModeId;
  name: string;
  description: string;
  focus: string;
};

const fixedObstaclesA: Pos[] = [
  { x: 1, y: 3 },
  { x: 2, y: 3 },
  { x: 8, y: 3 },
  { x: 9, y: 3 },
  { x: 4, y: 5 },
  { x: 4, y: 6 },
  { x: 8, y: 6 },
  { x: 2, y: 8 },
];

const fixedObstaclesB: Pos[] = [
  { x: 2, y: 1 },
  { x: 5, y: 1 },
  { x: 7, y: 2 },
  { x: 2, y: 5 },
  { x: 8, y: 5 },
  { x: 4, y: 8 },
  { x: 6, y: 8 },
];

export const TRAINING_MODES: readonly TrainingMode[] = [
  {
    id: "precision",
    name: "Precisao",
    description: "Treino limpo para repetir push e ocupacao de SQM.",
    focus: "Repeticao, controle de clique e leitura de bloqueios.",
  },
  {
    id: "follow",
    name: "Follow",
    description: "Treino focado em timing apos o push.",
    focus: "Push, follow e ocupacao do SQM original no tempo certo.",
  },
  {
    id: "pressure",
    name: "Pressao",
    description: "Treino com interferencias de bomb, flower e magic wall.",
    focus: "Tomada de decisao sob pressao e execucao limpa.",
  },
] as const;

export const TRAINING_SCENARIOS: readonly TrainingScenario[] = [
  {
    id: "clean-reset",
    modeId: "precision",
    name: "Push Limpo",
    summary: "Cenario quase limpo para repetir a mecanica base.",
    goal: "Treinar push e reset rapido sem interferencia aleatoria.",
    player: { x: 3, y: 5 },
    target: { x: 6, y: 5 },
    flower: { x: 6, y: 4 },
    pauseSpawnsByDefault: true,
    useRandomObstacles: false,
    obstacles: [],
  },
  {
    id: "corridor-follow",
    modeId: "follow",
    name: "Corredor de Follow",
    summary: "Forca leitura de retorno e disputa do SQM.",
    goal: "Executar o push e entrar no SQM original no timing certo.",
    player: { x: 3, y: 5 },
    target: { x: 6, y: 5 },
    flower: { x: 5, y: 4 },
    pauseSpawnsByDefault: true,
    useRandomObstacles: false,
    obstacles: fixedObstaclesA,
  },
  {
    id: "bomb-pressure",
    modeId: "pressure",
    name: "Pressao de Bomb",
    summary: "Cenario com spawns ativos e caminhos apertados.",
    goal: "Manter o push limpo mesmo com bomb e flower atrapalhando.",
    player: { x: 2, y: 6 },
    target: { x: 6, y: 5 },
    flower: { x: 7, y: 5 },
    pauseSpawnsByDefault: false,
    useRandomObstacles: false,
    obstacles: fixedObstaclesB,
  },
  {
    id: "scrim-random",
    modeId: "pressure",
    name: "Scrim Aleatoria",
    summary: "Mantem a ideia atual do simulador com mapa variavel.",
    goal: "Adaptacao rapida em situacoes menos previsiveis.",
    player: { x: 3, y: 5 },
    target: { x: 6, y: 5 },
    flower: { x: 6, y: 4 },
    pauseSpawnsByDefault: false,
    useRandomObstacles: true,
  },
] as const;

export const DEFAULT_SCENARIO_ID = TRAINING_SCENARIOS[0].id;

export function getTrainingMode(modeId: TrainingModeId): TrainingMode {
  return TRAINING_MODES.find((mode) => mode.id === modeId) ?? TRAINING_MODES[0];
}

export function getScenarioById(scenarioId: string): TrainingScenario {
  return TRAINING_SCENARIOS.find((scenario) => scenario.id === scenarioId) ?? TRAINING_SCENARIOS[0];
}

export function getScenariosForMode(modeId: TrainingModeId): TrainingScenario[] {
  return TRAINING_SCENARIOS.filter((scenario) => scenario.modeId === modeId);
}

export function getObstacleCountForScenario(scenario: TrainingScenario): number {
  return scenario.useRandomObstacles ? OBSTACLE_COUNT : scenario.obstacles?.length ?? 0;
}
