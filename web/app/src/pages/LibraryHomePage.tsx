import { ChevronRight, Clock, Download, ListMusic, Loader2, Play, Plus, Shuffle, Star, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { PrefetchLink } from '@/components/PrefetchLink';
import { Artwork } from '@/components/music/Artwork';
import { EmptyState } from '@/components/music/States';
import { TrackList } from '@/components/music/TrackList';
import { useLocalLibrary, type LocalPlaylist } from '@/data/music/localLibrary';
import { importExternalPlaylist, type ImportProgress } from '@/data/music/playlistImport';
import { usePlayer } from '@/state/player';
import { seeAllTracks } from './pageStyles';

type LibraryTab = 'overview' | 'favorites' | 'recent' | 'playlist';

function PlaylistCard({
  playlist,
  onOpen,
  onDelete,
}: {
  playlist: LocalPlaylist;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const cover = playlist.tracks.find((t) => t.thumbnail)?.thumbnail ?? null;
  const playAll = () => {
    if (!playlist.tracks.length) return;
    usePlayer.getState().playTracks(playlist.tracks, 0, { title: playlist.title, type: 'playlist', id: playlist.id });
  };
  return (
    <div className="group relative flex flex-col gap-2 rounded-[10px] bg-quinary p-3 transition-colors hover:bg-quaternary">
      <button type="button" onClick={onOpen} className="text-left">
        <div className="relative aspect-square w-full overflow-hidden rounded-[8px] bg-joe">
          {cover ? (
            <Artwork src={cover} displayWidth={220} radius="var(--radius-artwork-medium)" />
          ) : (
            <div className="grid size-full place-items-center text-tertiary">
              <ListMusic size={34} />
            </div>
          )}
        </div>
        <p className="mt-2 truncate type-body-emphasized text-primary">{playlist.title}</p>
        <p className="truncate type-callout text-secondary">
          {playlist.tracks.length} {playlist.tracks.length === 1 ? 'song' : 'songs'}
        </p>
      </button>
      <div className="flex items-center justify-between pt-0.5">
        <button
          type="button"
          disabled={!playlist.tracks.length}
          onClick={playAll}
          aria-label={`Play ${playlist.title}`}
          className="inline-flex h-8 items-center gap-1 rounded-[8px] bg-key-bg px-2.5 type-callout-emphasized text-white disabled:opacity-40"
        >
          <Play size={12} fill="currentColor" aria-hidden />
          <span>Play</span>
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete playlist ${playlist.title}`}
          className="grid size-8 place-items-center rounded-[8px] text-secondary hover:bg-quinary hover:text-key"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

/**
 * Library Home (/library): works everywhere (iPhone, iPad, Desktop Web) with
 * Liked Songs, Recently Played history, and custom Local Playlists persisted in browser storage.
 */
export default function LibraryHomePage() {
  const favorites = useLocalLibrary((s) => s.favorites);
  const recentTracks = useLocalLibrary((s) => s.recentTracks);
  const playlists = useLocalLibrary((s) => s.playlists);
  const { createPlaylist, deletePlaylist, clearRecent } = useLocalLibrary.getState();

  const [tab, setTab] = useState<LibraryTab>('overview');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [importFeedback, setImportFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const activePlaylist = playlists.find((p) => p.id === selectedPlaylistId) ?? null;

  const handleCreatePlaylist = (e: FormEvent) => {
    e.preventDefault();
    const created = createPlaylist(newName);
    if (!created) return;
    setNewName('');
    setSelectedPlaylistId(created.id);
    setTab('playlist');
  };

  const handleImportPlaylist = async (e: FormEvent) => {
    e.preventDefault();
    if (importing || !importUrl.trim()) return;
    setImporting(true);
    setImportFeedback(null);
    setImportProgress({ stage: 'fetching', processed: 0, total: 0, matched: 0 });
    try {
      const imported = await importExternalPlaylist(importUrl, setImportProgress);
      const saved = createPlaylist(imported.title, imported.tracks);
      if (saved) {
        setImportUrl('');
        setSelectedPlaylistId(saved.id);
        setTab('playlist');
        setImportOpen(false);
        const note =
          imported.skippedCount > 0
            ? `Imported “${imported.title}” (${imported.tracks.length}/${imported.totalSourceTracks} matched).`
            : `Imported “${imported.title}” (${imported.tracks.length} songs).`;
        setImportFeedback({ ok: true, message: note });
      }
    } catch (err) {
      setImportFeedback({ ok: false, message: err instanceof Error ? err.message : 'Playlist import failed.' });
    } finally {
      setImporting(false);
      setImportProgress(null);
    }
  };

  const playTracks = (tracks: typeof favorites, title: string, id: string) => {
    if (!tracks.length) return;
    usePlayer.getState().playTracks(tracks, 0, { title, type: 'library', id });
  };

  return (
    <>
      <PageHeader title={tab === 'playlist' && activePlaylist ? activePlaylist.title : 'Library'} />

      <div className="mx-(--body-gutter) mt-4 flex flex-wrap items-center gap-2">
        {(
          [
            { id: 'overview', label: 'All' },
            { id: 'favorites', label: `Liked Songs (${favorites.length})` },
            { id: 'recent', label: `Recently Played (${recentTracks.length})` },
          ] as const
        ).map((pill) => {
          const active = tab === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              aria-pressed={active}
              onClick={() => setTab(pill.id)}
              className={[
                'h-8 cursor-pointer rounded-pill px-3.5 type-callout-emphasized transition-colors',
                active ? 'bg-key-bg text-white' : 'bg-quinary text-secondary hover:bg-quaternary hover:text-primary',
              ].join(' ')}
            >
              {pill.label}
            </button>
          );
        })}
        {tab === 'playlist' && activePlaylist && (
          <button
            type="button"
            onClick={() => setTab('overview')}
            className="h-8 cursor-pointer rounded-pill bg-key-bg px-3.5 type-callout-emphasized text-white"
          >
            ← Back to Library
          </button>
        )}
      </div>

      {tab === 'overview' && (
        <div className="mx-(--body-gutter) mt-5 flex flex-col gap-7 pb-8">
          {/* Quick Library rows like Apple Music */}
          <div className="overflow-hidden rounded-[12px] bg-quinary">
            <button
              type="button"
              onClick={() => setTab('favorites')}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-quaternary"
            >
              <span className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-[8px] bg-key-bg text-white">
                  <Star size={17} fill="currentColor" aria-hidden />
                </span>
                <span>
                  <span className="block type-title-3-emphasized text-primary">Liked Songs</span>
                  <span className="block type-callout text-secondary">
                    {favorites.length} {favorites.length === 1 ? 'song' : 'songs'}
                  </span>
                </span>
              </span>
              <ChevronRight size={17} className="text-tertiary" />
            </button>

            <button
              type="button"
              onClick={() => setTab('recent')}
              className="flex w-full items-center justify-between border-t-[0.5px] border-t-divider px-4 py-3 text-left transition-colors hover:bg-quaternary"
            >
              <span className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-[8px] bg-quaternary text-key">
                  <Clock size={17} aria-hidden />
                </span>
                <span>
                  <span className="block type-title-3-emphasized text-primary">Recently Played</span>
                  <span className="block type-callout text-secondary">
                    {recentTracks.length} {recentTracks.length === 1 ? 'song' : 'songs'}
                  </span>
                </span>
              </span>
              <ChevronRight size={17} className="text-tertiary" />
            </button>
          </div>

          {/* Playlists section */}
          <section aria-label="Your Playlists">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="type-title-2-emphasized">Playlists</h2>
                <button
                  type="button"
                  onClick={() => {
                    setImportOpen((v) => !v);
                    setImportFeedback(null);
                  }}
                  aria-expanded={importOpen}
                  className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[8px] bg-quinary px-3 type-callout-emphasized text-key transition-colors hover:bg-quaternary"
                >
                  <Download size={14} aria-hidden />
                  <span>Import Playlist</span>
                </button>
              </div>
              <form className="flex items-center gap-2" onSubmit={handleCreatePlaylist}>
                <input
                  type="text"
                  placeholder="New playlist name…"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  aria-label="New playlist name"
                  className="h-8 w-[min(210px,52vw)] rounded-[8px] border-0 bg-quinary px-3 type-body text-primary placeholder:text-tertiary"
                />
                <button
                  type="submit"
                  disabled={!newName.trim()}
                  className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-[8px] bg-key-bg px-3 type-callout-emphasized text-white disabled:opacity-40"
                >
                  <Plus size={14} aria-hidden />
                  <span>Create</span>
                </button>
              </form>
            </div>
            {importOpen && (
              <form
                onSubmit={handleImportPlaylist}
                className="mb-4 flex flex-col gap-2.5 rounded-[12px] bg-quinary p-3.5"
              >
                <p className="type-callout text-secondary">
                  Paste any <strong className="text-primary">YouTube Music / YouTube</strong>,{' '}
                  <strong className="text-primary">Spotify</strong>, or{' '}
                  <strong className="text-primary">Deezer</strong> playlist link. All songs import with no cap and are
                  strictly verified across multiple sources to prevent mismatches.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    placeholder="Spotify, YouTube Music, or Deezer playlist URL…"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    disabled={importing}
                    aria-label="YouTube Music, Spotify, or Deezer playlist URL"
                    className="h-9 min-w-0 flex-1 rounded-[8px] border-0 bg-quaternary px-3 type-body text-primary placeholder:text-tertiary"
                  />
                  <button
                    type="submit"
                    disabled={importing || !importUrl.trim()}
                    className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[8px] bg-key-bg px-3.5 type-callout-emphasized text-white disabled:opacity-50"
                  >
                    {importing && <Loader2 size={14} className="animate-spin" aria-hidden />}
                    <span>{importing ? 'Importing…' : 'Import'}</span>
                  </button>
                </div>
                {importProgress && (
                  <p className="type-callout text-secondary">
                    {importProgress.stage === 'fetching'
                      ? `Fetching playlist${importProgress.title ? ` “${importProgress.title}”` : ''}${
                          importProgress.processed > 0
                            ? ` (${importProgress.processed}${importProgress.total > importProgress.processed ? `/${importProgress.total}` : ''} songs)`
                            : ''
                        }…`
                      : `Matching tracks cleanly across sources: ${importProgress.processed}/${importProgress.total} (${importProgress.matched} matched)`}
                  </p>
                )}
              </form>
            )}
            {importFeedback && (
              <p className={`mb-3 type-callout ${importFeedback.ok ? 'text-green' : 'text-key'}`}>{importFeedback.message}</p>
            )}
            {playlists.length > 0 ? (
              <div className="grid grid-cols-5 gap-4 max-xl:grid-cols-4 max-md:grid-cols-2 max-md:gap-3">
                {playlists.map((pl) => (
                  <PlaylistCard
                    key={pl.id}
                    playlist={pl}
                    onOpen={() => {
                      setSelectedPlaylistId(pl.id);
                      setTab('playlist');
                    }}
                    onDelete={() => deletePlaylist(pl.id)}
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-[10px] bg-quinary px-4 py-3 type-body text-secondary">
                No playlists yet. Create one above or tap ⋯ on any song → Add to Playlist.
              </p>
            )}
          </section>

          {/* Preview of Recently Played right in Overview */}
          {recentTracks.length > 0 && (
            <section aria-label="Recently Played">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="type-title-2-emphasized">Recently Played</h2>
                <button
                  type="button"
                  onClick={() => setTab('recent')}
                  className="type-callout-emphasized text-key hover:underline"
                >
                  See All
                </button>
              </div>
              <TrackList
                tracks={recentTracks.slice(0, 10)}
                variant="playlist"
                source={{ title: 'Recently Played', type: 'library', id: 'recent' }}
              />
            </section>
          )}
        </div>
      )}

      {tab === 'favorites' && (
        <div className="mt-4 pb-8">
          {favorites.length > 0 ? (
            <>
              <div className="mx-(--body-gutter) mb-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => playTracks(favorites, 'Liked Songs', 'songs')}
                  className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[10px] bg-key-bg px-4 type-body-emphasized text-white"
                >
                  <Play size={14} fill="currentColor" aria-hidden />
                  <span>Play All</span>
                </button>
                <PrefetchLink
                  to="/library/songs"
                  className="inline-flex h-9 items-center rounded-[10px] bg-quinary px-3.5 type-callout-emphasized text-secondary hover:bg-quaternary hover:text-primary"
                >
                  YouTube Liked Songs
                </PrefetchLink>
              </div>
              <div className={seeAllTracks}>
                <TrackList tracks={favorites} variant="playlist" source={{ title: 'Liked Songs', type: 'library', id: 'songs' }} />
              </div>
            </>
          ) : (
            <EmptyState
              title="No Liked Songs Yet"
              detail="Tap the star ★ on the player or choose Favorite from any song’s ⋯ menu to save songs here."
            />
          )}
        </div>
      )}

      {tab === 'recent' && (
        <div className="mt-4 pb-8">
          {recentTracks.length > 0 ? (
            <>
              <div className="mx-(--body-gutter) mb-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => playTracks(recentTracks, 'Recently Played', 'recent')}
                  className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[10px] bg-key-bg px-4 type-body-emphasized text-white"
                >
                  <Play size={14} fill="currentColor" aria-hidden />
                  <span>Play All</span>
                </button>
                <button
                  type="button"
                  onClick={clearRecent}
                  className="inline-flex h-9 cursor-pointer items-center rounded-[10px] bg-quinary px-3.5 type-callout-emphasized text-secondary hover:bg-quaternary hover:text-key"
                >
                  Clear History
                </button>
              </div>
              <div className={seeAllTracks}>
                <TrackList
                  tracks={recentTracks}
                  variant="playlist"
                  source={{ title: 'Recently Played', type: 'library', id: 'recent' }}
                />
              </div>
            </>
          ) : (
            <EmptyState
              title="No Listening History Yet"
              detail="Songs you play on BitChord appear here automatically so you can jump right back in."
            />
          )}
        </div>
      )}

      {tab === 'playlist' && activePlaylist && (
        <div className="mt-4 pb-8">
          {activePlaylist.tracks.length > 0 ? (
            <>
              <div className="mx-(--body-gutter) mb-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => playTracks(activePlaylist.tracks, activePlaylist.title, activePlaylist.id)}
                  className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[10px] bg-key-bg px-4 type-body-emphasized text-white"
                >
                  <Play size={14} fill="currentColor" aria-hidden />
                  <span>Play</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const shuffled = [...activePlaylist.tracks].sort(() => Math.random() - 0.5);
                    playTracks(shuffled, activePlaylist.title, activePlaylist.id);
                  }}
                  className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[10px] bg-quinary px-4 type-body-emphasized text-primary hover:bg-quaternary"
                >
                  <Shuffle size={14} aria-hidden />
                  <span>Shuffle</span>
                </button>
              </div>
              <div className={seeAllTracks}>
                <TrackList
                  tracks={activePlaylist.tracks}
                  variant="playlist"
                  source={{ title: activePlaylist.title, type: 'playlist', id: activePlaylist.id }}
                />
              </div>
            </>
          ) : (
            <EmptyState
              title="This Playlist is Empty"
              detail="Tap ⋯ on any song in Search, Home, or the Player and choose Add to Playlist."
            />
          )}
        </div>
      )}
    </>
  );
}
