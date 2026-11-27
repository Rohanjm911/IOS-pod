import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { probeAddon, type AddonSourceConfig, type AudioQualityTier } from './addonClient';

interface AddonsState {
  addons: AddonSourceConfig[];
  quality: AudioQualityTier;
  losslessOutput: boolean;
  addAddon: (rawUrl: string) => Promise<AddonSourceConfig>;
  removeAddon: (id: string) => void;
  toggleAddon: (id: string) => void;
  moveAddon: (index: number, delta: -1 | 1) => void;
  testAddon: (id: string) => Promise<{ ok: boolean; message: string }>;
  setQuality: (quality: AudioQualityTier) => void;
  setLosslessOutput: (on: boolean) => void;
}

export const useAddons = create<AddonsState>()(
  persist(
    (set, get) => ({
      addons: [],
      quality: 'LOSSLESS',
      losslessOutput: true,

      async addAddon(rawUrl) {
        const probed = await probeAddon(rawUrl);
        const existing = get().addons.find((a) => a.url === probed.url);
        const entry: AddonSourceConfig = {
          id: existing?.id ?? probed.manifest.id ?? probed.url,
          url: probed.url,
          name: probed.name,
          version: probed.version,
          enabled: existing?.enabled ?? true,
          manifest: probed.manifest,
          lastError: null,
        };
        set((state) => ({
          addons: existing
            ? state.addons.map((a) => (a.url === probed.url ? entry : a))
            : [...state.addons, entry],
        }));
        return entry;
      },

      removeAddon(id) {
        set((state) => ({ addons: state.addons.filter((a) => a.id !== id) }));
      },

      toggleAddon(id) {
        set((state) => ({
          addons: state.addons.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)),
        }));
      },

      moveAddon(index, delta) {
        set((state) => {
          const nextIndex = index + delta;
          if (nextIndex < 0 || nextIndex >= state.addons.length) return state;
          const copy = [...state.addons];
          const [moved] = copy.splice(index, 1);
          copy.splice(nextIndex, 0, moved!);
          return { addons: copy };
        });
      },

      async testAddon(id) {
        const addon = get().addons.find((a) => a.id === id);
        if (!addon) return { ok: false, message: 'Source not found.' };
        try {
          const probed = await probeAddon(addon.url);
          set((state) => ({
            addons: state.addons.map((a) =>
              a.id === id
                ? { ...a, name: probed.name, version: probed.version, manifest: probed.manifest, lastError: null }
                : a,
            ),
          }));
          return { ok: true, message: `${probed.name} v${probed.version} is healthy.` };
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          set((state) => ({
            addons: state.addons.map((a) => (a.id === id ? { ...a, lastError: message } : a)),
          }));
          return { ok: false, message };
        }
      },

      setQuality(quality) {
        set({ quality });
      },

      setLosslessOutput(losslessOutput) {
        set({ losslessOutput });
      },
    }),
    {
      name: 'isopod:addons',
      version: 1,
    },
  ),
);
