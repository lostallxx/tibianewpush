import { HOTKEY_ACTIONS, formatHotkey } from "../../simulator/hotkeys";
import type { HotkeyActionId, HotkeyBindings } from "../../simulator/types";

type HotkeyEditorProps = {
  bindings: HotkeyBindings;
  rebindingAction: HotkeyActionId | null;
  onStartRebinding: (actionId: HotkeyActionId) => void;
  onClearBinding: (actionId: HotkeyActionId) => void;
};

export function HotkeyEditor({ bindings, rebindingAction, onStartRebinding, onClearBinding }: HotkeyEditorProps) {
  const groups = ["Movimento", "Runas", "Utilidade"] as const;

  return (
    <div className="rounded-2xl border border-neutral-800 bg-[linear-gradient(180deg,rgba(15,15,15,0.94),rgba(8,8,8,0.96))] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-200/80">Hotkeys</h3>
          <p className="mt-1 text-sm text-neutral-400">
            Clique em alterar e pressione qualquer tecla, inclusive F1-F12. Se repetir uma tecla, ela muda para a nova acao.
          </p>
        </div>
        {rebindingAction && <span className="rounded-full border border-amber-400/40 bg-amber-300/10 px-3 py-1 text-xs text-amber-100">Aguardando tecla...</span>}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {groups.map((group) => (
          <div key={group} className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-3">
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-neutral-500">{group}</p>
            <div className="space-y-2">
              {HOTKEY_ACTIONS.filter((action) => action.group === group).map((action) => (
                <div key={action.id} className="rounded-xl border border-neutral-800 px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-neutral-200">{action.label}</span>
                    <kbd className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-amber-100">{formatHotkey(bindings[action.id])}</kbd>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => onStartRebinding(action.id)}
                      className={`rounded-lg border px-3 py-1 text-xs ${
                        rebindingAction === action.id
                          ? "border-amber-400 bg-amber-300/10 text-amber-100"
                          : "border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
                      }`}
                    >
                      {rebindingAction === action.id ? "Pressione..." : "Alterar"}
                    </button>
                    <button
                      onClick={() => onClearBinding(action.id)}
                      className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1 text-xs text-neutral-400 hover:bg-neutral-800"
                    >
                      Limpar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
