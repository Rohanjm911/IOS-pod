import { Layers, RotateCw, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { APP_UI_MODES, useUi } from '@/state/ui';

/**
 * Confirmation modal shown when the user requests switching the entire app UI look.
 * Switching UI mode triggers a clean app restart (`window.location.reload()`) upon confirmation.
 */
export function UiRestartDialog() {
  const pendingUiMode = useUi((s) => s.pendingUiMode);
  const cancelUiModeSwitch = useUi((s) => s.cancelUiModeSwitch);
  const confirmUiModeSwitchAndRestart = useUi((s) => s.confirmUiModeSwitchAndRestart);

  if (!pendingUiMode || typeof document === 'undefined') return null;

  const targetMeta = APP_UI_MODES.find((m) => m.id === pendingUiMode) ?? {
    id: pendingUiMode,
    label:
      pendingUiMode === 'secondary'
        ? 'Neo-Brutalism'
        : pendingUiMode === 'editorial'
          ? 'Editorial Magazine'
          : pendingUiMode === 'bento'
            ? 'Bento Grids'
            : 'Glassmorphism',
    description:
      pendingUiMode === 'secondary'
        ? 'Bold Ink & Dual-Tone'
        : pendingUiMode === 'editorial'
          ? 'Print Serif & Asymmetric Grid'
          : pendingUiMode === 'bento'
            ? 'Apple Modular Rounded Tiles'
            : 'Apple Frosted Depth & Blur',
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[calc(var(--z-modal)+5)] grid animate-fade place-items-center bg-scrim p-3 pb-[max(12px,var(--safe-bottom))] sm:p-4"
      onPointerDown={(e) => e.target === e.currentTarget && cancelUiModeSwitch()}
    >
      <div
        className="flex w-[min(420px,100%)] max-h-[calc(100dvh-32px)] flex-col overflow-hidden rounded-[20px] border border-divider bg-page shadow-glass animate-spring-popup"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="ui-restart-title"
        aria-describedby="ui-restart-desc"
      >
        <header className="flex items-center justify-between border-b border-divider px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-full bg-key/15 text-key">
              <Layers size={18} />
            </div>
            <div>
              <h2 id="ui-restart-title" className="type-title-2-emphasized text-primary">
                Switch App UI &amp; Restart?
              </h2>
              <p className="type-caption-2 text-tertiary">{targetMeta.label}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={cancelUiModeSwitch}
            aria-label="Cancel UI switch"
            className="grid size-[30px] place-items-center rounded-full bg-quinary text-secondary hover:text-primary transition-colors"
          >
            <X size={16} />
          </button>
        </header>

        <div id="ui-restart-desc" className="px-5 py-4 flex flex-col gap-2">
          <p className="type-body text-primary">
            You are switching the entire ISO pod interface to <strong>{targetMeta.label}</strong> ({targetMeta.description}).
          </p>
          <p className="type-callout text-secondary">
            The app will restart cleanly to apply the new UI layout and visual system. Your playback queue and settings are saved.
          </p>
        </div>

        <footer className="flex items-center justify-end gap-2.5 border-t border-divider bg-quinary/30 px-5 py-3">
          <button
            type="button"
            onClick={cancelUiModeSwitch}
            className="rounded-[10px] bg-quaternary px-4 py-2 type-callout-medium text-primary hover:brightness-110 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmUiModeSwitchAndRestart}
            className="inline-flex items-center gap-1.5 rounded-[10px] bg-key px-4 py-2 type-callout-medium text-white hover:opacity-90 transition"
          >
            <RotateCw size={14} />
            Restart &amp; Apply
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
