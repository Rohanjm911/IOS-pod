import { PrefetchLink } from '@/components/PrefetchLink';
import { isIosDevice } from '@/lib/platform';

/** A page-sized message, centred: also the Spotify page's sign-in invitation. */
export const stateStyles = {
  state: 'mx-auto my-20 flex max-w-[420px] flex-col items-center gap-2 px-(--body-gutter) text-center',
  title: 'type-title-2-emphasized',
  detail: 'type-body-tall text-secondary',
  button: 'mt-3 inline-flex h-8 items-center rounded-pill bg-key-bg px-4 type-body-emphasized text-white',
};

/** In place of a YouTube page when neither extension nor iOS proxy is configured. */
export function NeedsExtension({ what = 'YouTube Music' }: { what?: string }) {
  if (what === 'YouTube Music') {
    return (
      <div className={stateStyles.state}>
        <p className={stateStyles.title}>Connecting to YouTube Music…</p>
        <p className={stateStyles.detail}>
          BitChord Web is streaming through the built-in edge proxy.
        </p>
        <PrefetchLink to="/" className={stateStyles.button}>
          Refresh Home
        </PrefetchLink>
      </div>
    );
  }
  return (
    <div className={stateStyles.state}>
      <p className={stateStyles.title}>{what}</p>
      <p className={stateStyles.detail}>
        Connecting {what} directly requires the desktop extension to read browser session cookies. All YouTube Music tracks and playlists are playable right here in the web app!
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <PrefetchLink to="/" className={stateStyles.button}>
          Explore Music
        </PrefetchLink>
        <PrefetchLink
          to="/extension"
          className="mt-3 inline-flex h-8 items-center rounded-pill bg-elevated px-4 type-body-emphasized text-secondary hover:text-white"
        >
          Get Extension
        </PrefetchLink>
      </div>
    </div>
  );
}

export function LoadError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div className={stateStyles.state}>
      <p className={stateStyles.title}>Couldn’t load this page</p>
      <p className={stateStyles.detail}>{error instanceof Error ? error.message : String(error)}</p>
      <button className={stateStyles.button} onClick={onRetry}>
        Try Again
      </button>
    </div>
  );
}

export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className={stateStyles.state}>
      <p className={stateStyles.title}>{title}</p>
      {detail && <p className={stateStyles.detail}>{detail}</p>}
    </div>
  );
}

/** A later page of a long list failed: what's loaded stays, with a way to try again. */
export function LoadMoreError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center gap-2.5 px-(--body-gutter) pt-6 pb-10 type-callout text-secondary">
      <span>Couldn’t load more.</span>
      <button className="type-callout-emphasized text-key" onClick={onRetry}>
        Try Again
      </button>
    </div>
  );
}
