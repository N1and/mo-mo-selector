import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

interface Settings {
  maimemoToken: string;
  selectedNotepadId: string;
  autoStart: boolean;
  hotkey: string;
}

interface SettingsState {
  settings: Settings;
  isLoaded: boolean;
  updateSettings: (updates: Partial<Settings>) => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}

const defaultSettings: Settings = {
  maimemoToken: '',
  selectedNotepadId: '',
  autoStart: false,
  hotkey: 'Ctrl+Shift+A',
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,
  isLoaded: false,
  updateSettings: (updates) =>
    set((state) => ({
      settings: { ...state.settings, ...updates },
    })),
  loadSettings: async () => {
    try {
      const settings = await invoke<Settings>('load_settings');
      set({ settings: { ...defaultSettings, ...settings }, isLoaded: true });
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({ isLoaded: true });
    }
  },
  saveSettings: async () => {
    try {
      const { settings } = get();
      await invoke('save_settings', { settings });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  },
}));
