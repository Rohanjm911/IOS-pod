import { WifiOff, X } from 'lucide-react';
import { useSlowNetwork } from '@/state/slowNetwork';
import { useUi, type AppUiMode } from '@/state/ui';

function slowToastTheme(uiMode: AppUiMode): {
  shell: string;
  badge: string;
  bar: string;
} {
  switch (uiMode) {
    case 'secondary':
      return {
        shell:
          'rounded-[10px] border-2 border-primary bg-elevated shadow-[4px_4px_0_rgb(var(--label-primary-rgb))]',
        badge: 'rounded-[6px] bg-[#FFE600] text-black border border-black/30',
        bar: 'bg-[#2563EB]',
      };
    case 'editorial':
      return {
        shell:
          'rounded-[4px] border border-divider border-l-4 border-l-[#DC2626] bg-elevated shadow-lg',
        badge: 'rounded-[2px] bg-[#DC2626] text-white',
        bar: 'bg-[#DC2626]',
      };
    case 'bento':
      return {
        shell:
          'rounded-[20px] border border-divider bg-elevated/95 shadow-[0_12px_32px_rgba(0,0,0,0.16)] backdrop-blur-xl',
        badge: 'rounded-[10px] bg-[#FF9500] text-white',
        bar: 'bg-[#FF9500]',
      };
    case 'retro':
      return {
        shell:
          'rounded-[10px] border border-white/25 bg-elevated/95 shadow-[0_8px_24px_rgba(0,0,0,0.28)] backdrop-blur-md',
        badge: 'rounded-[6px] bg-gradient-to-b from-[#ff9f0a] to-[#e07b00] text-white',
        bar: 'bg-[#146EF5]',
      };
    case 'anime':
      return {
        shell:
          'rounded-[16px] border-2 border-[#00D2FF]/70 bg-elevated/95 shadow-[0_10px_30px_rgba(0,210,255,0.2)] backdrop-blur-xl',
        badge: 'rounded-[10px] bg-gradient-to-br from-[#FF3E8A] to-[#00D2FF] text-white',
        bar: 'bg-gradient-to-r from-[#FF3E8A] to-[#00D2FF]',
      };
    default:
      return {
        shell:
          'rounded-[18px] border border-white/20 bg-elevated/86 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl',
        badge: 'rounded-full bg-[#ff9f0a] text-white shadow-[0_0_12px_rgba(255,159,10,0.4)]',
        bar: 'bg-[#ff9f0a]',
      };
  }
}

/** Displays a random network-related joke popup whenever the connection is slow or buffering stalls. */
export function SlowNetworkToast() {
  const toast = useSlowNetwork((s) => s.jokeToast);
  const dismiss = useSlowNetwork((s) => s.dismissJoke);
  const uiMode = useUi((s) => s.uiMode);

  if (!toast) return null;
  const theme = slowToastTheme(uiMode);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed right-4 bottom-[calc(var(--player-pill-height)+var(--player-bottom-offset)+var(--safe-bottom)+14px)] z-50 w-[min(360px,calc(100vw-28px))] max-md:right-1/2 max-md:translate-x-1/2 max-md:bottom-[calc(var(--mobile-tab-bar-height)+var(--mini-player-height)+var(--safe-bottom)+14px)]"
    >
      <div className={`pointer-events-auto relative overflow-hidden px-3.5 py-2.5 animate-spring-popup ${theme.shell}`}>
        <div className="flex items-start gap-3">
          <span className={`mt-0.5 grid size-8 shrink-0 place-items-center ${theme.badge}`}>
            <WifiOff size={15} className="animate-pulse" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[9px] font-bold tracking-[0.14em] text-secondary uppercase">
              {toast.reason}
            </div>
            <div className="mt-0.5 type-callout font-medium leading-snug text-primary">
              {toast.message}
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss network notice"
            className="grid size-6 shrink-0 place-items-center rounded-full text-tertiary hover:bg-quaternary hover:text-primary transition-colors cursor-pointer"
          >
            <X size={13} />
          </button>
        </div>
        <div className="mt-2 h-[2px] w-full overflow-hidden rounded-full bg-quaternary">
          <div
            className={`h-full origin-left ${theme.bar}`}
            style={{ animation: 'slow-net-progress 6s linear forwards' }}
          />
        </div>
        <style>{`@keyframes slow-net-progress { from { transform: scaleX(1); } to { transform: scaleX(0); } }`}</style>
      </div>
    </div>
  );
}
