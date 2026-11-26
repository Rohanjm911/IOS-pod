import { Clock, Moon, X, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { formatSleepTimerRemaining, useSleepTimer, type SleepTimerPreset } from '@/state/sleepTimer';

interface SleepTimerModalProps {
  open: boolean;
  onClose: () => void;
}

const PRESETS: { id: SleepTimerPreset; label: string; desc?: string }[] = [
  { id: '15', label: '15 minutes' },
  { id: '30', label: '30 minutes' },
  { id: '45', label: '45 minutes' },
  { id: '60', label: '1 hour' },
  { id: 'track', label: 'End of current track', desc: 'Pauses automatically when track finishes' },
  { id: 'custom', label: 'Custom time' },
];

export function SleepTimerModal({ open, onClose }: SleepTimerModalProps) {
  const preset = useSleepTimer((s) => s.preset);
  const remainingSec = useSleepTimer((s) => s.remainingSec);
  const customMinutes = useSleepTimer((s) => s.customMinutes);
  const fadeEnabled = useSleepTimer((s) => s.fadeEnabled);
  const setTimer = useSleepTimer((s) => s.setTimer);
  const cancelTimer = useSleepTimer((s) => s.cancelTimer);
  const setFadeEnabled = useSleepTimer((s) => s.setFadeEnabled);
  const setCustomMinutes = useSleepTimer((s) => s.setCustomMinutes);

  const [customInput, setCustomInput] = useState(customMinutes.toString());

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSelect = (id: SleepTimerPreset) => {
    if (id === 'custom') {
      const mins = Math.max(1, parseInt(customInput, 10) || customMinutes);
      setTimer('custom', mins);
    } else {
      setTimer(id);
    }
  };

  const handleCustomApply = () => {
    const mins = Math.max(1, parseInt(customInput, 10) || 15);
    setCustomMinutes(mins);
    setTimer('custom', mins);
  };

  const remainingText = formatSleepTimerRemaining(remainingSec, preset);

  return createPortal(
    <div
      className="fixed inset-0 z-(--z-modal) grid animate-fade place-items-center bg-scrim p-4"
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="flex max-h-[min(640px,calc(100vh-48px))] w-[min(420px,100%)] animate-spring-popup flex-col rounded-[16px] bg-page shadow-glass overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Sleep timer"
      >
        <header className="flex items-center justify-between border-b border-divider px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-full bg-quinary text-key">
              <Moon size={18} />
            </div>
            <div>
              <h2 className="type-title-2-emphasized text-primary">Sleep Timer</h2>
              {preset !== 'off' && (
                <p className="type-caption-2 text-key font-medium">
                  Active • {remainingText}
                </p>
              )}
            </div>
          </div>
          <button
            className="grid size-[30px] place-items-center rounded-full bg-quinary text-secondary hover:text-primary transition-colors"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            {PRESETS.map((p) => {
              const isSelected = preset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelect(p.id)}
                  className={`flex items-center justify-between rounded-[10px] px-3.5 py-2.5 text-left transition-colors ${
                    isSelected
                      ? 'bg-quaternary text-primary font-medium'
                      : 'hover:bg-quinary text-secondary hover:text-primary'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="type-body">{p.label}</span>
                    {p.desc && <span className="type-caption-2 text-tertiary mt-0.5">{p.desc}</span>}
                  </div>
                  {isSelected && <Check size={16} className="text-key shrink-0" />}
                </button>
              );
            })}
          </div>

          {preset === 'custom' && (
            <div className="flex items-center gap-2 rounded-[10px] bg-quinary p-3">
              <label htmlFor="custom-mins" className="type-callout text-secondary whitespace-nowrap">
                Minutes:
              </label>
              <input
                id="custom-mins"
                type="number"
                min="1"
                max="360"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCustomApply()}
                className="w-20 rounded-[6px] bg-page px-2.5 py-1 text-center type-body text-primary outline-none focus:ring-1 focus:ring-key"
              />
              <button
                onClick={handleCustomApply}
                className="rounded-[6px] bg-key px-3 py-1 type-callout-medium text-white hover:opacity-90"
              >
                Set
              </button>
            </div>
          )}

          <div className="border-t border-divider pt-3.5">
            <label className="flex items-center justify-between cursor-pointer py-1">
              <div className="flex flex-col">
                <span className="type-callout text-primary">Gentle volume fade-out</span>
                <span className="type-caption-2 text-tertiary">Gradually softens audio 20s before stopping</span>
              </div>
              <input
                type="checkbox"
                checked={fadeEnabled}
                onChange={(e) => setFadeEnabled(e.target.checked)}
                className="size-4.5 accent-key cursor-pointer rounded"
              />
            </label>
          </div>
        </div>

        {preset !== 'off' && (
          <footer className="border-t border-divider px-5 py-3 bg-quinary/40 flex justify-between items-center">
            <span className="type-callout text-secondary flex items-center gap-1.5">
              <Clock size={14} className="text-tertiary" />
              {remainingText} remaining
            </span>
            <button
              onClick={() => {
                cancelTimer();
                onClose();
              }}
              className="type-callout font-medium text-red-400 hover:text-red-300 transition-colors"
            >
              Turn Off Timer
            </button>
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
