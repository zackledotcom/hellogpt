import { useState, useCallback, useEffect } from 'react';

export interface AppSettings {
  model: {
    name: string;
    temperature: number;
    contextWindow: number;
  };
  theme: {
    mode: 'light' | 'dark' | 'system';
    accentColor: string;
  };
  shortcuts: {
    sendMessage: string;
    newLine: string;
    messageHistory: string;
    toggleSettings: string;
  };
  prompts: {
    systemPrompt: string;
    savedPrompts: Array<{
      name: string;
      content: string;
    }>;
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  model: {
    name: 'llama2',
    temperature: 0.7,
    contextWindow: 2048,
  },
  theme: {
    mode: 'system',
    accentColor: 'blue',
  },
  shortcuts: {
    sendMessage: 'Enter',
    newLine: 'Shift + Enter',
    messageHistory: 'Ctrl + ↑/↓',
    toggleSettings: 'Ctrl + ,',
  },
  prompts: {
    systemPrompt: 'You are a helpful AI assistant.',
    savedPrompts: [
      {
        name: 'Default Assistant',
        content: 'You are a helpful AI assistant.',
      },
      {
        name: 'Code Expert',
        content: 'You are an expert programmer. Provide detailed, well-documented code examples.',
      },
      {
        name: 'Creative Writer',
        content: 'You are a creative writer. Help with storytelling, character development, and plot structure.',
      },
    ],
  },
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load settings from storage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = localStorage.getItem('appSettings');
        if (stored) {
          setSettings(JSON.parse(stored));
        }
      } catch (err) {
        setError('Failed to load settings');
        console.error('Error loading settings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Save settings to storage
  const saveSettings = useCallback(async (newSettings: AppSettings) => {
    try {
      localStorage.setItem('appSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
      return true;
    } catch (err) {
      setError('Failed to save settings');
      console.error('Error saving settings:', err);
      return false;
    }
  }, []);

  // Update specific settings
  const updateSettings = useCallback(async (
    section: keyof AppSettings,
    value: Partial<AppSettings[keyof AppSettings]>
  ) => {
    const newSettings = {
      ...settings,
      [section]: {
        ...settings[section],
        ...value,
      },
    };
    return saveSettings(newSettings);
  }, [settings, saveSettings]);

  // Reset settings to defaults
  const resetSettings = useCallback(async () => {
    return saveSettings(DEFAULT_SETTINGS);
  }, [saveSettings]);

  return {
    settings,
    isLoading,
    error,
    saveSettings,
    updateSettings,
    resetSettings,
  };
} caches