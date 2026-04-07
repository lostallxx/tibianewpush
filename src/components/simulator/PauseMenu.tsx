import { HotkeyEditor } from "./HotkeyEditor";
import type { HotkeyActionId, HotkeyBindings, TrainingModeId } from "../../simulator/types";
import type { TrainingScenario } from "../../simulator/types";
import type { ReactNode } from "react";

type PauseMenuProps = {
  selectedModeId: TrainingModeId;
  selectedScenarioId: string;
  availableScenarios: TrainingScenario[];
  trainingModes: ReadonlyArray<{
    id: TrainingModeId;
    name: string;
    description: string;
    focus: string;
  }>;
  selectedModeName: string;
  selectedModeDescription: string;
  selectedModeFocus: string;
  selectedScenarioGoal: string;
  hotkeyBindings: HotkeyBindings;
  rebindingAction: HotkeyActionId | null;
  onSelectMode: (modeId: TrainingModeId) => void;
  onSelectScenario: (scenarioId: string) => void;
  onResetScenario: () => void;
  onStartRebinding: (actionId: HotkeyActionId) => void;
  onClearBinding: (actionId: HotkeyActionId) => void;
  onResetHotkeys: () => void;
  onClose: () => void;
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-neutral-800 bg-[linear-gradient(180deg,rgba(20,18,15,0.96),rgba(9,8,7,0.98))] p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-amber-200/80">{title}</h3>
      {children}
    </section>
  );
}

export function PauseMenu({
  selectedModeId,
  selectedScenarioId,
  availableScenarios,
  trainingModes,
  selectedModeName,
  selectedModeDescription,
  selectedModeFocus,
  selectedScenarioGoal,
  hotkeyBindings,
  rebindingAction,
  onSelectMode,
  onSelectScenario,
  onResetScenario,
  onStartRebinding,
  onClearBinding,
  onResetHotkeys,
  onClose,
}: PauseMenuProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-[3px]">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-auto rounded-3xl border border-amber-900/40 bg-[radial-gradient(circle_at_top,_rgba(59,46,24,0.96),_rgba(16,12,9,0.98)_42%,_rgba(8,8,8,0.99)_100%)] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-amber-100">Menu de Pausa</h2>
            <p className="mt-1 text-sm text-neutral-400">Escolha o treino, ajuste hotkeys e pressione ESC para voltar ao jogo.</p>
          </div>
          <button onClick={onClose} className="rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm text-neutral-100 hover:bg-neutral-800">
            Fechar
          </button>
        </div>

        <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
          <Section title="Treino">
            <div className="space-y-4">
              <label className="block text-sm text-neutral-300">
                <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-amber-300/70">Modo</span>
                <select
                  value={selectedModeId}
                  onChange={(event) => onSelectMode(event.target.value as TrainingModeId)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-amber-400"
                >
                  {trainingModes.map((mode) => (
                    <option key={mode.id} value={mode.id}>
                      {mode.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm text-neutral-300">
                <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-amber-300/70">Cenario</span>
                <select
                  value={selectedScenarioId}
                  onChange={(event) => onSelectScenario(event.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-amber-400"
                >
                  {availableScenarios.map((scenario) => (
                    <option key={scenario.id} value={scenario.id}>
                      {scenario.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
                <p className="text-sm font-semibold text-amber-100">{selectedModeName}</p>
                <p className="mt-2 text-sm text-neutral-400">{selectedModeDescription}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-amber-300/70">Foco</p>
                <p className="mt-1 text-sm text-neutral-300">{selectedModeFocus}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-amber-300/70">Objetivo</p>
                <p className="mt-1 text-sm text-neutral-300">{selectedScenarioGoal}</p>
              </div>

              <button onClick={onResetScenario} className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm text-neutral-100 hover:bg-neutral-800">
                Resetar cenario
              </button>
            </div>
          </Section>

          <Section title="Opcoes">
            <HotkeyEditor
              bindings={hotkeyBindings}
              rebindingAction={rebindingAction}
              onStartRebinding={onStartRebinding}
              onClearBinding={onClearBinding}
            />
            <div className="mt-4 flex justify-end">
              <button onClick={onResetHotkeys} className="rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm text-neutral-100 hover:bg-neutral-800">
                Restaurar hotkeys padrao
              </button>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
