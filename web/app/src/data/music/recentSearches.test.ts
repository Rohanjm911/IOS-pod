// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { recentEntryKey, useRecentSearches } from './recentSearches';
import type { MusicItem } from './types';

function makeSong(id: string, title: string): MusicItem {
  return {
    kind: 'song',
    id,
    title,
    subtitle: 'Artist',
    thumbnail: null,
    artists: [{ id: 'a1', name: 'Artist' }],
    album: null,
    durationSec: 180,
    explicit: false,
    wide: false,
  };
}

describe('recentSearches', () => {
  beforeEach(() => {
    useRecentSearches.getState().clear();
  });

  it('adds, deduplicates case-insensitively, and caps query entries', () => {
    const { addQuery } = useRecentSearches.getState();
    addQuery('Arijit Singh');
    addQuery('Lofi Beats');
    addQuery('arijit singh');

    const entries = useRecentSearches.getState().entries;
    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({ kind: 'query', text: 'arijit singh' });
    expect(entries[1]).toEqual({ kind: 'query', text: 'Lofi Beats' });

    for (let i = 0; i < 20; i++) addQuery(`Query ${i}`);
    expect(useRecentSearches.getState().entries).toHaveLength(15);
  });

  it('stores items, removes individual entries, and clears all', () => {
    const { addItem, addQuery, remove, clear } = useRecentSearches.getState();
    addQuery('jazz');
    addItem(makeSong('v1', 'Midnight Blues'));
    expect(useRecentSearches.getState().entries).toHaveLength(2);

    const firstKey = recentEntryKey(useRecentSearches.getState().entries[0]!);
    remove(firstKey);
    expect(useRecentSearches.getState().entries).toHaveLength(1);
    expect(useRecentSearches.getState().entries[0]).toEqual({ kind: 'query', text: 'jazz' });

    clear();
    expect(useRecentSearches.getState().entries).toHaveLength(0);
  });
});
