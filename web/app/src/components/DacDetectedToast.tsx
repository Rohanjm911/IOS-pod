import { BatteryCharging, Bluetooth, Headphones, X } from 'lucide-react';
import { useDacAudio } from '@/state/dacAudio';
import { useUi, type AppUiMode } from '@/state/ui';

function themeToastStyles(uiMode: AppUiMode): {
  shell: string;
  badge: string;
  kicker: string | null;
  titleStyle?: React.CSSProperties;
  bar: string;
} {
  switch (uiMode) {
    case 'secondary':
      return {
        shell:
          'rounded-[10px] border-2 border-primary bg-elevated shadow-[4px_4px_0_rgb(var(--label-primary-rgb))]',
        badge: 'rounded-[6px] bg-[#2563EB] text-white border border-black/30',
        kicker: 'DAC CONNECTED',
        bar: 'bg-[#2563EB]',
      };
    case 'editorial':
      return {
        shell:
          'rounded-[4px] border border-divider border-l-4 border-l-[#DC2626] bg-elevated shadow-lg',
        badge: 'rounded-[2px] bg-[#DC2626] text-white',
        kicker: 'HI-FI HARDWARE',
        titleStyle: { fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 },
        bar: 'bg-[#DC2626]',
      };
    case 'bento':
      return {
        shell:
          'rounded-[20px] border border-divider bg-elevated/95 shadow-[0_12px_32px_rgba(0,0,0,0.16)] backdrop-blur-xl',
        badge: 'rounded-[10px] bg-[#0066CC] text-white',
        kicker: 'AUDIO OUTPUT',
        bar: 'bg-[#34C759]',
      };
    case 'retro':
      return {
        shell:
          'rounded-[10px] border border-white/25 bg-elevated/95 shadow-[0_8px_24px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-md',
        badge: 'rounded-[6px] bg-gradient-to-b from-[#3b8df7] to-[#146EF5] text-white shadow-inner',
        kicker: 'DAC LINK ACTIVE',
        titleStyle: { fontFamily: "'Lucida Grande', 'Trebuchet MS', sans-serif" },
        bar: 'bg-[#146EF5]',
      };
    case 'anime':
      return {
        shell:
          'rounded-[16px] border-2 border-[#FF3E8A]/70 bg-elevated/95 shadow-[0_10px_30px_rgba(255,62,138,0.24)] backdrop-blur-xl',
        badge: 'rounded-[10px] bg-gradient-to-br from-[#FF3E8A] to-[#00D2FF] text-white',
        kicker: 'HI-FI SYNC',
        titleStyle: { fontFamily: "'M PLUS Rounded 1c', 'DM Sans', sans-serif", fontWeight: 700 },
        bar: 'bg-gradient-to-r from-[#FF3E8A] to-[#00D2FF]',
      };
    default:
      // Glassmorphism
      return {
        shell:
          'rounded-[18px] border border-white/20 bg-elevated/82 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl',
        badge: 'rounded-full bg-[#30d158] text-white shadow-[0_0_14px_rgba(48,209,88,0.45)]',
        kicker: 'DAC DETECTED',
        bar: 'bg-[#30d158]',
      };
  }
}

/**
 * Compact, theme-matched animated popup notification shown whenever an external
 * DAC is auto-detected on phones, tablets, or computers.
 */
export function DacDetectedToast() {
  // Made by Rohan JM aka TheRedDragon
  const dacToast = useDacAudio((s) => s.dacConnectedToast);
  const dismissDacToast = useDacAudio((s) => s.dismissDacToast);
  const uiMode = useUi((s) => s.uiMode);

  if (!dacToast) return null;
  const theme = themeToastStyles(uiMode);
  const isBt = dacToast.kind === 'bluetooth';
  const Icon = isBt ? Bluetooth : Headphones;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed top-[calc(14px+var(--safe-top))] left-1/2 z-50 w-[min(350px,calc(100vw-24px))] -translate-x-1/2 max-md:top-[calc(var(--mobile-top-bar-height)+var(--safe-top)+8px)]"
    >
      <div
        className={`pointer-events-auto relative overflow-hidden px-3.5 py-2.5 animate-spring-popup ${theme.shell}`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`relative grid size-8 shrink-0 place-items-center ${
              isBt ? 'rounded-full bg-[#0a84ff] text-white shadow-[0_0_14px_rgba(10,132,255,0.45)]' : theme.badge
            }`}
          >
            <Icon size={15} className="animate-pulse" />
          </span>
          <div className="min-w-0 flex-1">
            {(isBt || theme.kicker) && (
              <div className="text-[9px] font-bold tracking-[0.14em] text-secondary uppercase">
                {isBt ? 'BLUETOOTH CONNECTED' : theme.kicker}
              </div>
            )}
            <div className="truncate type-callout font-semibold text-primary" style={theme.titleStyle}>
              {dacToast.label}
            </div>
            <div className="truncate text-[11px] text-secondary">{dacToast.detail}</div>
            {isBt && (
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] font-medium text-secondary">
                {typeof dacToast.batteryPct === 'number' && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-semibold ${
                      dacToast.batteryPct >= 50
                        ? 'bg-[#30d158]/20 text-[#30d158]'
                        : dacToast.batteryPct >= 20
                          ? 'bg-[#ff9f0a]/20 text-[#ff9f0a]'
                          : 'bg-[#ff453a]/20 text-[#ff453a]'
                    }`}
                  >
                    <BatteryCharging size={10} />
                    {dacToast.batteryPct}%
                  </span>
                )}
                {dacToast.profile && (
                  <span className="rounded-full bg-quaternary px-1.5 py-0.5 text-primary/90">
                    {dacToast.profile}
                  </span>
                )}
                {dacToast.sampleRateHz && (
                  <span className="rounded-full bg-quaternary px-1.5 py-0.5 text-primary/90">
                    {+(dacToast.sampleRateHz / 1000).toFixed(1)} kHz
                  </span>
                )}
                {dacToast.manufacturer && (
                  <span className="rounded-full bg-quaternary px-1.5 py-0.5 text-primary/90">
                    {dacToast.manufacturer}
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={dismissDacToast}
            aria-label="Dismiss DAC notification"
            className="grid size-6 shrink-0 place-items-center rounded-full text-tertiary hover:bg-quaternary hover:text-primary transition-colors cursor-pointer"
          >
            <X size={13} />
          </button>
        </div>
        <div className="mt-2 h-[2px] w-full overflow-hidden rounded-full bg-quaternary">
          <div
            className={`h-full origin-left ${theme.bar}`}
            style={{
              animation: 'dac-toast-progress 4.5s linear forwards',
            }}
          />
        </div>
        <style>{`@keyframes dac-toast-progress { from { transform: scaleX(1); } to { transform: scaleX(0); } }`}</style>
      </div>
    </div>
  );
}
