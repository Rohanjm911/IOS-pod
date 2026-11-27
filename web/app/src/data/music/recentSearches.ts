import { create } from 'zustand';
import type { MusicItem } from './types';

export type RecentSearchEntry =
  | { kind: 'query'; text: string }
  | { kind: 'item'; item: MusicItem };

export function recentEntryKey(entry: RecentSearchEntry): string {
  return entry.kind === 'query' ? `q:${entry.text.toLowerCase()}` : `i:${entry.item.id}`;
}

const STORAGE_KEY = 'isopod:recent-searches';
const MAX_RECENT = 15;

function readStored(): RecentSearchEntry[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as unknown;
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((entry): entry is RecentSearchEntry => {
        if (!entry || typeof entry !== 'object') return false;
        const candidate = entry as Partial<RecentSearchEntry>;
        if (candidate.kind === 'query') return typeof candidate.text === 'string' && candidate.text.trim().length > 0;
        if (candidate.kind === 'item') return !!candidate.item && typeof candidate.item.id === 'string' && typeof candidate.item.title === 'string';
        return false;
      })
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

function writeStored(entries: RecentSearchEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Ignore storage failures in restricted contexts.
  }
}

interface RecentSearchesState {
  entries: RecentSearchEntry[];
  addQuery: (text: string) => void;
  addItem: (item: MusicItem) => void;
  remove: (key: string) => void;
  clear: () => void;
}

export const useRecentSearches = create<RecentSearchesState>()((set, get) => ({
  entries: readStored(),
  addQuery: (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const entry: RecentSearchEntry = { kind: 'query', text: trimmed };
    const key = recentEntryKey(entry);
    const next = [entry, ...get().entries.filter((e) => recentEntryKey(e) !== key)].slice(0, MAX_RECENT);
    writeStored(next);
    set({ entries: next });
  },
  addItem: (item) => {
    if (!item.id || !item.title) return;
    const entry: RecentSearchEntry = { kind: 'item', item };
    const key = recentEntryKey(entry);
    const next = [entry, ...get().entries.filter((e) => recentEntryKey(e) !== key)].slice(0, MAX_RECENT);
    writeStored(next);
    set({ entries: next });
  },
  remove: (key) => {
    const next = get().entries.filter((e) => recentEntryKey(e) !== key);
    writeStored(next);
    set({ entries: next });
  },
  clear: () => {
    writeStored([]);
    set({ entries: [] });
  },
}));
