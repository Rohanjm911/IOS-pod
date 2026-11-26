import { Check, Monitor, Moon, Palette, Sparkles, Sun, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  THEME_PRESETS,
  useThemeSettings,
  type ColorSchemeMode,
  type GlassmorphismLevel,
} from '@/lib/theme';
import { PLAYER_STYLES, useUi } from '@/state/ui';

interface ThemeModalProps {
  open: boolean;
  onClose: () => void;
}

const QUICK_COLORS = [
  '#fa2d48', // Classic Apple Music Rose
  '#ff2d55', // iOS Hot Pink
  '#7c3aed', // Electric Purple
  '#007aff', // iOS Royal Blue
  '#00f2fe', // Cyber Cyan
  '#059669', // Emerald Mint
  '#30d158', // Neon Green
  '#ff9500', // Sunset Tangerine
  '#eab308', // Radiant Gold
  '#ef4444', // Fiery Red
];

export function ThemeModal({ open, onClose }: ThemeModalProps) {
  const {
    scheme,
    preset,
    amoled,
    glass,
    customAccent,
    systemDark,
    setColorScheme,
    setThemePreset,
    setAmoledBlack,
    setGlassmorphism,
    setCustomAccent,
  } = useThemeSettings();

  const isDarkActive = scheme === 'dark' || (scheme === 'system' && systemDark);
  const [hexInput, setHexInput] = useState(customAccent);
  const playerStyle = useUi((s) => s.playerStyle);
  const setPlayerStyle = useUi((s) => s.setPlayerStyle);

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
      className="fixed inset-0 z-(--z-modal) grid animate-fade place-items-center bg-scrim p-4"
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="flex max-h-[min(740px,calc(100vh-32px))] w-[min(520px,100%)] animate-spring-popup flex-col rounded-[20px] bg-page shadow-glass overflow-hidden"
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

          {/* iOS Accent Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="type-caption-2 text-tertiary uppercase tracking-wider font-semibold">
                iOS Color Palettes
              </span>
              <span className="type-caption-2 text-tertiary">{THEME_PRESETS.length} presets</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {THEME_PRESETS.map((p) => {
                const active = preset === p.id;
                const accent = isDarkActive ? p.swatchDark : p.swatchLight;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setThemePreset(p.id)}
                    className={`flex items-center gap-2 rounded-[10px] p-2 border transition-all text-left ${
                      active
                        ? 'border-key bg-quaternary'
                        : 'border-divider bg-quinary/60 hover:bg-quaternary'
                    }`}
                  >
                    <span
                      className="size-5 shrink-0 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: accent }}
                    />
                    <span className="min-w-0 flex-1 truncate type-callout text-primary">
                      {p.name.split(' ')[0]}
                    </span>
                    {active && <Check size={12} className="text-key shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Hex Accent Color Picker */}
          <div className="rounded-[14px] bg-quinary/80 p-3.5 border border-divider">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <Sparkles size={15} className="text-key" />
                <span className="type-callout-medium text-primary">Custom Accent Color</span>
              </div>
              {preset === 'custom' && (
                <span className="type-caption-2 text-key font-medium">Custom Active</span>
              )}
            </div>

            {/* Quick Swatch Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
              {QUICK_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    setHexInput(color);
                    setCustomAccent(color);
                  }}
                  className={`size-7 shrink-0 rounded-full border-2 transition-transform hover:scale-110 active:scale-95 ${
                    preset === 'custom' && customAccent.toLowerCase() === color.toLowerCase()
                      ? 'border-white scale-110 shadow-md'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={color}
                />
              ))}
            </div>

            {/* Color picker input & Hex field */}
            <div className="flex items-center gap-2.5 mt-1 pt-2 border-t border-divider">
              <input
                type="color"
                value={customAccent}
                onChange={(e) => {
                  setHexInput(e.target.value);
                  setCustomAccent(e.target.value);
                }}
                className="size-9 rounded-[8px] cursor-pointer bg-transparent border-0 p-0"
              />
              <input
                type="text"
                value={hexInput}
                onChange={(e) => {
                  setHexInput(e.target.value);
                  if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                    setCustomAccent(e.target.value);
                  }
                }}
                placeholder="#fa2d48"
                className="w-28 rounded-[8px] bg-page px-3 py-1.5 font-mono type-callout text-primary border border-divider outline-none focus:border-key"
              />
              <button
                onClick={() => {
                  if (/^#[0-9a-fA-F]{3,6}$/.test(hexInput)) {
                    setCustomAccent(hexInput);
                  }
                }}
                className="rounded-[8px] bg-key px-3 py-1.5 type-callout-medium text-white hover:opacity-90 transition-opacity"
              >
                Apply
              </button>
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
