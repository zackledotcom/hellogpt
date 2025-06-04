import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EmbeddingConfig } from '../types/embedding';

interface ConfigState {
  customPresets: Record<string, EmbeddingConfig>;
  addCustomPreset: (name: string, config: EmbeddingConfig) => void;
  removeCustomPreset: (name: string) => void;
  getCustomPreset: (name: string) => EmbeddingConfig | undefined;
  getAllCustomPresets: () => Record<string, EmbeddingConfig>;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      customPresets: {},
      addCustomPreset: (name: string, config: EmbeddingConfig) =>
        set((state) => ({
          customPresets: { ...state.customPresets, [name]: config },
        })),
      removeCustomPreset: (name: string) =>
        set((state) => {
          const { [name]: _, ...rest } = state.customPresets;
          return { customPresets: rest };
        }),
      getCustomPreset: (name: string) => get().customPresets[name],
      getAllCustomPresets: () => get().customPresets,
    }),
    {
      name: 'embedding-config-storage',
    }
  )
); 