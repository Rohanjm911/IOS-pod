import { Check, Monitor, Moon, Palette, Sun, X } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  THEME_PRESETS,
  useThemeSettings,
  type ColorSchemeMode,
  type GlassmorphismLevel,
} from '@/lib/theme';
import { APP_UI_MODES, BRUTAL_PALETTES, PLAYER_STYLES, useUi } from '@/state/ui';

interface ThemeModalProps {
  open: boolean;
  onClose: () => void;
}

export function ThemeModal({ open, onClose }: ThemeModalProps) {
  const {
    scheme,
    amoled,
    glass,
    systemDark,
    setColorScheme,
    setAmoledBlack,
    setGlassmorphism,
  } = useThemeSettings();

  const playerStyle = useUi((s) => s.playerStyle);
  const setPlayerStyle = useUi((s) => s.setPlayerStyle);
  const uiMode = useUi((s) => s.uiMode);
  const requestUiModeSwitch = useUi((s) => s.requestUiModeSwitch);
  const brutalPalette = useUi((s) => s.brutalPalette);
  const customBrutalPrimary = useUi((s) => s.customBrutalPrimary);
  const customBrutalSecondary = useUi((s) => s.customBrutalSecondary);
  const setBrutalPalette = useUi((s) => s.setBrutalPalette);
  const setCustomBrutalColors = useUi((s) => s.setCustomBrutalColors);
  const activeModeMeta = APP_UI_MODES.find((m) => m.id === uiMode) ?? APP_UI_MODES[0]!;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const schemeOptions: { id: ColorSchemeMode; label: string; Icon: typeof Sun }[] = [
    { id: 'system', label: 'System', Icon: Monitor },
    { id: 'light', label: 'Light', Icon: Sun },
    { id: 'dark', label: 'Dark', Icon: Moon },
  ];

  const glassOptions: { id: GlassmorphismLevel; label: string; desc: string }[] = [
    { id: 'default', label: 'Apple Glass', desc: 'Standard 32px blur' },
    { id: 'frosted', label: 'Ultra Frosted', desc: 'Deep 48px blur & saturation' },
    { id: 'subtle', label: 'Subtle Glass', desc: 'Light 12px blur' },
    { id: 'none', label: 'Solid / Flat', desc: 'No blur (OLED crisp)' },
  ];

  return createPortal(
    <div
      className="fixed inset-0 z-(--z-modal) grid animate-fade place-items-center bg-scrim p-3 pb-[max(12px,var(--safe-bottom))] sm:p-4"
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="flex max-h-[min(740px,calc(100dvh-24px))] w-[min(520px,100%)] animate-spring-popup flex-col rounded-[20px] bg-page shadow-glass overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Theme Customizer"
      >
        <header className="flex items-center justify-between border-b border-divider px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-full bg-quinary text-key">
              <Palette size={18} />
            </div>
            <div>
              <h2 className="type-title-2-emphasized text-primary">Themes &amp; Styling</h2>
              <p className="type-caption-2 text-tertiary">Custom accents, AMOLED black &amp; glassmorphism</p>
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

        <div className="overflow-y-auto px-5 py-4 flex flex-col gap-5">
          {/* Player Bar Style Selector (Top for immediate visibility) */}
          <div>
            <span className="type-caption-2 text-tertiary uppercase tracking-wider font-semibold block mb-2">
              Player Bar Style
            </span>
            <div className="grid grid-cols-2 gap-2">
              {PLAYER_STYLES.map((opt) => {
                const isSelected = playerStyle === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPlayerStyle(opt.id)}
                    className={`flex flex-col text-left rounded-[10px] p-2.5 border transition-all ${
                      isSelected
                        ? 'border-key bg-quaternary text-primary'
                        : 'border-divider bg-quinary/60 text-secondary hover:text-primary hover:bg-quaternary'
                    }`}
                  >
                    <span className="type-callout-medium text-primary flex items-center justify-between">
                      {opt.label}
                      {isSelected && <Check size={14} className="text-key" />}
                    </span>
                    <span className="type-caption-2 text-tertiary mt-0.5">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Theme Mode Toggle (System/Light/Dark) */}
          <div>
            <span className="type-caption-2 text-tertiary uppercase tracking-wider font-semibold block mb-2">
              Appearance Mode
            </span>
            <div className="grid grid-cols-3 gap-1.5 rounded-[12px] bg-quaternary p-1">
              {schemeOptions.map(({ id, label, Icon }) => {
                const active = scheme === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setColorScheme(id)}
                    className={`flex items-center justify-center gap-2 rounded-[8px] py-2 type-callout-medium transition-all ${
                      active ? 'bg-key text-white shadow-sm' : 'text-secondary hover:text-primary'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pure AMOLED Black Mode Switch */}
          <div className="rounded-[14px] bg-quinary/80 p-3.5 border border-divider">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="type-callout-medium text-primary">Pure AMOLED Pitch Black</span>
                  <span className="rounded bg-black px-1.5 py-0.5 text-[10px] font-bold text-white border border-white/20">
                    OLED 0%
                  </span>
                </div>
                <span className="type-caption-2 text-tertiary mt-0.5">
                  Absolute #000000 true black for maximum battery savings and contrast
                </span>
              </div>
              <input
                type="checkbox"
                checked={amoled}
                onChange={(e) => setAmoledBlack(e.target.checked)}
                className="size-5 accent-key cursor-pointer rounded"
              />
            </label>
          </div>

          {/* Background Glassmorphism Customization */}
          <div>
            <span className="type-caption-2 text-tertiary uppercase tracking-wider font-semibold block mb-2">
              Background Glassmorphism
            </span>
            <div className="grid grid-cols-2 gap-2">
              {glassOptions.map((opt) => {
                const isSelected = glass === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setGlassmorphism(opt.id)}
                    className={`flex flex-col text-left rounded-[10px] p-2.5 border transition-all ${
                      isSelected
                        ? 'border-key bg-quaternary text-primary'
                        : 'border-divider bg-quinary/60 text-secondary hover:text-primary hover:bg-quaternary'
                    }`}
                  >
                    <span className="type-callout-medium text-primary flex items-center justify-between">
                      {opt.label}
                      {isSelected && <Check size={14} className="text-key" />}
                    </span>
                    <span className="type-caption-2 text-tertiary mt-0.5">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* App UI Look (Triggers Restart with User Input) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="type-caption-2 text-tertiary uppercase tracking-wider font-semibold">
                App UI Look
              </span>
              <span className="type-caption-2 text-tertiary">Restart required</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {APP_UI_MODES.map((opt) => {
                const isSelected = uiMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => requestUiModeSwitch(opt.id)}
                    className={`flex flex-col items-start rounded-[12px] p-2.5 border transition-all text-left ${
                      isSelected
                        ? 'border-key bg-key/10'
                        : 'border-divider bg-quinary/60 hover:bg-quaternary'
                    }`}
                  >
                    <span className="type-callout-medium text-primary flex items-center gap-1.5">
                      {opt.label}
                      {isSelected && <Check size={14} className="text-key" />}
                    </span>
                    <span className="type-caption-2 text-tertiary mt-0.5">{opt.description}</span>
                    <span className="mt-1.5 flex items-center gap-1" aria-hidden="true">
                      {opt.swatches.map((hex) => (
                        <span
                          key={hex}
                          className="size-3 rounded-full border border-white/20"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fixed Signature Color Scheme */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="type-caption-2 text-tertiary uppercase tracking-wider font-semibold">
                Signature Color Scheme
              </span>
              <span className="type-caption-2 text-key font-semibold">Fixed</span>
            </div>
            <div className="flex items-center gap-3 rounded-[12px] border border-key bg-quaternary p-3">
              <span
                className="size-8 shrink-0 rounded-[8px] border border-white/20 shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${activeModeMeta.swatches[0]} 48%, ${activeModeMeta.swatches[1]} 48%)`,
                }}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate type-callout-medium text-primary">
                  {activeModeMeta.label} • {activeModeMeta.schemeName}
                </div>
                <div className="truncate type-caption-2 text-secondary">
                  Locked signature palette for this UI style
                </div>
              </div>
              <Check size={14} className="text-key shrink-0" />
            </div>
          </div>
        </div>

        <footer className="border-t border-divider px-5 py-3 bg-quinary/30 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-[8px] bg-key px-4 py-1.5 type-callout-medium text-white hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
