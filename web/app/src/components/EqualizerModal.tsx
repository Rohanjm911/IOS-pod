import {
  Sliders,
  X,
  RotateCcw,
  Zap,
  Download,
  Upload,
  Plus,
  Trash2,
  Check,
  FileText,
} from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  POPULAR_PRESETS,
  SHORT_FREQ_LABELS,
  FREQ_LABELS,
  useEqualizer,
  resumeAudioContext,
  type CustomEqPreset,
} from '@/state/equalizer';

interface EqualizerModalProps {
  open: boolean;
  onClose: () => void;
}

export function EqualizerModal({ open, onClose }: EqualizerModalProps) {
  const enabled = useEqualizer((s) => s.enabled);
  const preset = useEqualizer((s) => s.preset);
  const gains = useEqualizer((s) => s.gains);
  const bassBoost = useEqualizer((s) => s.bassBoost);
  const bassBoostEnabled = useEqualizer((s) => s.bassBoostEnabled);
  const customPresets = useEqualizer((s) => s.customPresets);

  const setEnabled = useEqualizer((s) => s.setEnabled);
  const setPreset = useEqualizer((s) => s.setPreset);
  const setBandGain = useEqualizer((s) => s.setBandGain);
  const setBassBoost = useEqualizer((s) => s.setBassBoost);
  const setBassBoostEnabled = useEqualizer((s) => s.setBassBoostEnabled);
  const resetEq = useEqualizer((s) => s.resetEq);
  const saveCustomPreset = useEqualizer((s) => s.saveCustomPreset);
  const deleteCustomPreset = useEqualizer((s) => s.deleteCustomPreset);
  const importCustomPreset = useEqualizer((s) => s.importCustomPreset);
  const exportPreset = useEqualizer((s) => s.exportPreset);

  const [savingName, setSavingName] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [copiedExport, setCopiedExport] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const gradientId = useId();

  useEffect(() => {
    if (!open) return;
    resumeAudioContext();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (importOpen) {
          setImportOpen(false);
        } else if (savingName) {
          setSavingName(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, importOpen, savingName]);

  if (!open) return null;

  // Build 10 SVG points for frequency response curve
  const svgWidth = 440;
  const paddingX = 22;
  const stepX = (svgWidth - paddingX * 2) / (gains.length - 1);
  const points = gains.map((g, i) => {
    const x = paddingX + i * stepX;
    // Map -12..+12 to y: 92..12 (center 0dB is at y=52)
    const y = 52 - (g / 12) * 40;
    return { x, y };
  });

  // Smooth Bezier curve path string
  let curveD = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i]!;
    const p1 = points[i + 1]!;
    const mx = (p0.x + p1.x) / 2;
    curveD += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
  }

  const areaD = `${curveD} L ${points[points.length - 1]!.x} 96 L ${points[0]!.x} 96 Z`;

  // Handle file import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const res = importCustomPreset(content);
        setImportStatus(res);
        if (res.success) {
          setTimeout(() => {
            setImportOpen(false);
            setImportStatus(null);
            setImportJsonText('');
          }, 1200);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Handle text import
  const handleTextImport = () => {
    if (!importJsonText.trim()) return;
    const res = importCustomPreset(importJsonText);
    setImportStatus(res);
    if (res.success) {
      setTimeout(() => {
        setImportOpen(false);
        setImportStatus(null);
        setImportJsonText('');
      }, 1200);
    }
  };

  // Handle export download and copy
  const handleExport = () => {
    const json = exportPreset();
    // Copy to clipboard
    void navigator.clipboard?.writeText(json);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2000);

    // Trigger download
    try {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `isopod-eq-${preset}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  };

  const handleSaveCustom = () => {
    if (!presetNameInput.trim()) return;
    saveCustomPreset(presetNameInput.trim());
    setPresetNameInput('');
    setSavingName(false);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-(--z-modal) grid animate-fade place-items-center bg-scrim p-3 pb-[max(12px,var(--safe-bottom))] sm:p-4"
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="flex max-h-[min(780px,calc(100dvh-24px))] w-[min(560px,100%)] animate-spring-popup flex-col rounded-[20px] bg-page shadow-glass overflow-hidden border border-divider"
        role="dialog"
        aria-modal="true"
        aria-label="Sound Equalizer"
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-divider px-5 py-3.5 bg-quinary/20">
          <div className="flex items-center gap-3">
            <div className="grid size-8.5 place-items-center rounded-full bg-key/15 text-key shadow-sm">
              <Sliders size={18} />
            </div>
            <div>
              <h2 className="type-title-2-emphasized text-primary flex items-center gap-2">
                Sound Equalizer
                <span className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-quaternary text-secondary">
                  {enabled && <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                  10-Band DSP
                </span>
              </h2>
              <p className="type-caption-2 text-tertiary">Real-time studio acoustics & custom presets</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className={`type-callout-medium text-xs font-semibold ${enabled ? 'text-key' : 'text-secondary'}`}>
                {enabled ? 'Active' : 'Bypass'}
              </span>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="size-4.5 accent-key cursor-pointer rounded"
              />
            </label>
            <button
              className="grid size-[30px] place-items-center rounded-full bg-quinary text-secondary hover:text-primary transition-colors cursor-pointer"
              aria-label="Close"
              onClick={onClose}
            >
              <X size={16} />
            </button>
          </div>
        </header>

        <div className={`overflow-y-auto px-4 sm:px-5 py-3.5 flex flex-col gap-4 ${enabled ? '' : 'opacity-40 pointer-events-none'}`}>
          {/* Preset Manager Toolbar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="type-caption-2 text-tertiary uppercase tracking-wider font-semibold">
                Presets & Profiles
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSavingName(true)}
                  className="flex items-center gap-1 type-caption-2 px-2 py-0.5 rounded-full bg-quinary text-secondary hover:text-primary hover:bg-quaternary transition-colors cursor-pointer"
                  title="Save current configuration as custom preset"
                >
                  <Plus size={12} />
                  Save
                </button>
                <button
                  onClick={() => setImportOpen(true)}
                  className="flex items-center gap-1 type-caption-2 px-2 py-0.5 rounded-full bg-quinary text-secondary hover:text-primary hover:bg-quaternary transition-colors cursor-pointer"
                  title="Import preset JSON or file"
                >
                  <Upload size={12} />
                  Import
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-1 type-caption-2 px-2 py-0.5 rounded-full bg-quinary text-secondary hover:text-primary hover:bg-quaternary transition-colors cursor-pointer"
                  title="Export current preset to JSON file / clipboard"
                >
                  {copiedExport ? <Check size={12} className="text-key" /> : <Download size={12} />}
                  {copiedExport ? 'Copied' : 'Export'}
                </button>
                <button
                  onClick={resetEq}
                  className="flex items-center gap-1 type-caption-2 px-2 py-0.5 rounded-full bg-quinary text-secondary hover:text-primary hover:bg-quaternary transition-colors cursor-pointer"
                  title="Reset to Flat response"
                >
                  <RotateCcw size={12} />
                  Reset
                </button>
              </div>
            </div>

            {/* Inline Save Input */}
            {savingName && (
              <div className="mb-2.5 flex items-center gap-2 rounded-[10px] bg-quinary p-2 animate-fade">
                <input
                  type="text"
                  placeholder="Custom Preset Name..."
                  value={presetNameInput}
                  autoFocus
                  onChange={(e) => setPresetNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveCustom()}
                  className="flex-1 bg-transparent px-2 py-1 type-callout text-primary placeholder:text-tertiary outline-none"
                />
                <button
                  onClick={handleSaveCustom}
                  className="rounded-[6px] bg-key px-3 py-1 type-caption-2 font-semibold text-white cursor-pointer"
                >
                  Save
                </button>
                <button
                  onClick={() => setSavingName(false)}
                  className="rounded-[6px] bg-quaternary px-2 py-1 type-caption-2 text-secondary cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Presets Horizontal Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
              {/* Popular Built-in Presets */}
              {POPULAR_PRESETS.map((p) => {
                const isSelected = preset === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPreset(p.id)}
                    className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-key text-white shadow-sm'
                        : 'bg-quinary text-secondary hover:text-primary hover:bg-quaternary'
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}

              {/* User Custom Presets */}
              {customPresets.map((cp) => {
                const isSelected = preset === cp.id;
                return (
                  <div
                    key={cp.id}
                    className={`group flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-key text-white shadow-sm'
                        : 'bg-quinary text-secondary hover:text-primary hover:bg-quaternary'
                    }`}
                  >
                    <button onClick={() => setPreset(cp.id)} className="cursor-pointer">
                      ★ {cp.name}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCustomPreset(cp.id);
                      }}
                      className="opacity-60 hover:opacity-100 hover:text-destructive cursor-pointer ml-0.5"
                      title="Delete preset"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Frequency Response Visualizer Curve (SVG) */}
          <div className="relative rounded-[14px] bg-quinary/60 p-2.5 overflow-hidden border border-divider">
            <svg viewBox={`0 0 ${svgWidth} 104`} className="w-full h-20 overflow-visible">
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--keyColor, #fa2d48)" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="var(--keyColor, #fa2d48)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Zero line (0 dB) */}
              <line x1={paddingX} y1="52" x2={svgWidth - paddingX} y2="52" stroke="currentColor" strokeOpacity="0.2" strokeDasharray="3 3" />
              {/* +6dB and -6dB lines */}
              <line x1={paddingX} y1="32" x2={svgWidth - paddingX} y2="32" stroke="currentColor" strokeOpacity="0.08" />
              <line x1={paddingX} y1="72" x2={svgWidth - paddingX} y2="72" stroke="currentColor" strokeOpacity="0.08" />

              {/* Shaded curve fill */}
              <path d={areaD} fill={`url(#${gradientId})`} />
              {/* Response line */}
              <path d={curveD} fill="none" stroke="var(--keyColor, #fa2d48)" strokeWidth="2.5" strokeLinecap="round" />

              {/* 10 Knots on curve */}
              {points.map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r="3"
                  fill="#ffffff"
                  stroke="var(--keyColor, #fa2d48)"
                  strokeWidth="2"
                />
              ))}
            </svg>
          </div>

          {/* 10-Band Vertical EQ Sliders */}
          <div className="grid grid-cols-10 gap-1 sm:gap-1.5 px-0.5 py-1">
            {gains.map((gain, index) => {
              const fullLabel = FREQ_LABELS[index]!;
              const shortLabel = SHORT_FREQ_LABELS[index]!;
              const formattedGain = gain > 0 ? `+${gain}` : `${gain}`;

              return (
                <div key={fullLabel} className="flex flex-col items-center gap-1.5 min-w-0" title={fullLabel}>
                  {/* Gain readout */}
                  <span className="type-caption-2 font-mono text-[11px] font-semibold text-secondary">
                    {formattedGain}
                  </span>

                  {/* Vertical Slider Track */}
                  <div className="relative flex h-32 w-full items-center justify-center">
                    <div className="pointer-events-none absolute inset-y-2 left-1/2 w-1.5 -translate-x-1/2 rounded-full bg-quaternary" />
                    {/* Zero center reference dot */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-1.5 rounded-full bg-secondary/45 pointer-events-none" />

                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="0.5"
                      value={gain}
                      aria-label={`${fullLabel} gain`}
                      onPointerDown={() => resumeAudioContext()}
                      onInput={(e) => setBandGain(index, parseFloat((e.target as HTMLInputElement).value))}
                      onChange={(e) => setBandGain(index, parseFloat(e.target.value))}
                      className="h-28 w-7 touch-none appearance-none rounded-full bg-transparent accent-key cursor-pointer [writing-mode:vertical-lr] [direction:rtl]"
                    />
                  </div>

                  {/* Frequency Label */}
                  <span className="type-caption-2 text-[10px] sm:text-[11px] text-tertiary text-center truncate w-full">
                    {shortLabel}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Sub-Bass Booster Card */}
          <div className="rounded-[14px] bg-quinary/80 p-3 border border-divider">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap size={15} className={bassBoostEnabled && bassBoost > 0 ? 'text-key animate-pulse' : 'text-tertiary'} />
                <span className="type-callout-medium text-primary text-xs font-semibold">Sub-Bass Booster (80 Hz)</span>
              </div>
              <span className="type-caption-2 font-mono font-semibold text-key">
                {bassBoostEnabled && bassBoost > 0 ? `+${bassBoost} dB` : 'Off'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="12"
                step="1"
                value={bassBoostEnabled ? bassBoost : 0}
                aria-label="Sub-Bass Booster gain"
                onPointerDown={() => resumeAudioContext()}
                onInput={(e) => {
                  const val = parseInt((e.target as HTMLInputElement).value, 10);
                  setBassBoost(val);
                }}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setBassBoost(val);
                }}
                className="w-full h-2 touch-none appearance-none rounded-full bg-quaternary accent-key cursor-pointer"
              />
              <button
                onClick={() => setBassBoostEnabled(!bassBoostEnabled)}
                className={`rounded-[8px] px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                  bassBoostEnabled && bassBoost > 0
                    ? 'bg-key text-white'
                    : 'bg-quaternary text-secondary hover:text-primary'
                }`}
              >
                {bassBoostEnabled && bassBoost > 0 ? 'Active' : 'Enable'}
              </button>
            </div>
          </div>
        </div>

        {/* Import Modal / Popover Overlay */}
        {importOpen && (
          <div className="absolute inset-0 z-10 flex flex-col bg-page/95 [backdrop-filter:blur(24px)] p-5 animate-fade">
            <div className="flex items-center justify-between pb-3 border-b border-divider">
              <div className="flex items-center gap-2">
                <Upload size={18} className="text-key" />
                <h3 className="type-title-3 text-primary">Import EQ Preset</h3>
              </div>
              <button
                onClick={() => {
                  setImportOpen(false);
                  setImportStatus(null);
                }}
                className="grid size-7 place-items-center rounded-full bg-quinary text-secondary hover:text-primary cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-4">
              <p className="type-callout text-secondary">
                Upload a preset <code className="text-primary font-mono text-xs bg-quinary px-1.5 py-0.5 rounded">.json</code> file or paste a JSON configuration below (supports 10-band or 5-band interpolated presets):
              </p>

              {/* File Upload Button */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-[12px] border-2 border-dashed border-divider p-4 text-center hover:border-key/60 hover:bg-quinary/40 transition-colors cursor-pointer"
                >
                  <FileText size={20} className="text-secondary" />
                  <span className="type-callout-medium text-primary">Choose .JSON File</span>
                </button>
              </div>

              {/* Paste Text Area */}
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="type-caption-2 text-tertiary uppercase font-semibold">Or Paste JSON Data:</label>
                <textarea
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder='{"name": "Heavy Bass", "gains": [8, 7, 5, 2, 0, 0, 0, 0, 1, 2], "bassBoost": 5}'
                  rows={4}
                  className="w-full flex-1 rounded-[10px] bg-quinary p-3 font-mono text-xs text-primary placeholder:text-tertiary border border-divider outline-none focus:border-key"
                />
              </div>

              {importStatus && (
                <div
                  className={`p-2.5 rounded-[8px] text-xs font-medium flex items-center gap-2 ${
                    importStatus.success ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
                  }`}
                >
                  {importStatus.message}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-divider">
              <button
                onClick={() => {
                  setImportOpen(false);
                  setImportStatus(null);
                }}
                className="rounded-[8px] bg-quaternary px-3 py-1.5 type-callout text-secondary hover:text-primary cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleTextImport}
                disabled={!importJsonText.trim()}
                className="rounded-[8px] bg-key px-4 py-1.5 type-callout-medium text-white hover:opacity-90 disabled:opacity-40 cursor-pointer"
              >
                Import & Apply
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-divider px-5 py-3 bg-quinary/20 flex items-center justify-between">
          <span className="type-caption-2 text-tertiary">
            Real-time Web Audio Biquad Filter Chain
          </span>
          <button
            onClick={onClose}
            className="rounded-[8px] bg-key px-5 py-1.5 type-callout-medium text-white hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
          >
            Done
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
