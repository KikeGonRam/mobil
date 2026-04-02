import { Appearance, useColorScheme as useNativeColorScheme } from 'react-native';
import { createContext, useContext, useMemo, useEffect, useState, type PropsWithChildren } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  cycleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = 'urbanblade.theme.mode';

export function ThemeModeProvider({ children }: PropsWithChildren) {
  const [mode, setInternalMode] = useState<ThemeMode>('system');
  const systemColorScheme = useNativeColorScheme();

  // Cargar el tema inicial desde el almacenamiento
  useEffect(() => {
    void (async () => {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (saved) {
        setInternalMode(JSON.parse(saved) as ThemeMode);
      }
    })();
  }, []);

  const setMode = (newMode: ThemeMode) => {
    setInternalMode(newMode);
    void AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(newMode));
  };

  const resolvedMode = useMemo<'light' | 'dark'>(() => {
    if (mode === 'system') {
      return systemColorScheme === 'light' ? 'light' : 'dark';
    }
    return mode;
  }, [mode, systemColorScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      resolvedMode,
      setMode,
      cycleMode: () => {
        const next: ThemeMode = mode === 'system' ? 'light' : mode === 'light' ? 'dark' : 'system';
        setMode(next);
      },
    }),
    [mode, resolvedMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used inside ThemeModeProvider');
  }
  return context;
}
